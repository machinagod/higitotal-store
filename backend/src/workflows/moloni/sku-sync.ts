/**
 * I/O around the pure SKU planner (`sku-plan.ts`): load the current
 * variant ↔ inventory-item state, and apply a plan's temp/final renames.
 * Kept thin on purpose — the decisions live in `planProductSkuSync`.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  updateInventoryItemsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { errorMessage, runInBatchesWithFallback } from "./batch"
import type {
  OrphanItem,
  PlannedProduct,
  ProductSkuPlan,
  VariantState,
} from "./sku-plan"

type GraphAll = (
  entity: string,
  fields: string[],
  filters?: Record<string, unknown>
) => Promise<any[]>

/**
 * Every live variant with its sku, Moloni id and linked inventory items, plus
 * inventory items that hold a relevant sku without being linked to any live
 * variant (they block that sku, so the planner must know about them).
 */
export async function loadSkuSnapshot(
  graphAll: GraphAll,
  planned: PlannedProduct[]
): Promise<{ variants: VariantState[]; orphanItems: OrphanItem[] }> {
  const rows = await graphAll("product_variant", [
    "id",
    "sku",
    "product.external_id",
    "inventory_items.inventory.id",
    "inventory_items.inventory.sku",
  ])
  const variants: VariantState[] = rows.map((r) => {
    const ext = r.product?.external_id
    const mid = ext != null && /^\d+$/.test(String(ext)) ? Number(ext) : null
    return {
      variantId: r.id,
      moloniId: mid,
      sku: r.sku ?? null,
      items: (r.inventory_items ?? [])
        .map((ii: any) => ii?.inventory)
        .filter((inv: any) => inv?.id)
        .map((inv: any) => ({ id: inv.id, sku: inv.sku ?? null })),
    }
  })

  // Skus something may move to this run: planned skus + drifted variants'.
  const candidates = new Set<string>(planned.map((p) => p.sku))
  const knownItems = new Set<string>()
  for (const v of variants) {
    for (const it of v.items) {
      knownItems.add(it.id)
      if (v.sku && it.sku !== v.sku) candidates.add(v.sku)
    }
  }
  const orphanItems: OrphanItem[] = []
  const skus = [...candidates]
  for (let i = 0; i < skus.length; i += 200) {
    const items = await graphAll("inventory_item", ["id", "sku"], {
      sku: skus.slice(i, i + 200),
    })
    for (const it of items) {
      if (!knownItems.has(it.id)) orphanItems.push({ id: it.id, sku: it.sku ?? null })
    }
  }
  return { variants, orphanItems }
}

export interface ApplySkuPlanResult {
  variantTempFailed: number
  itemsRenamed: number
  itemsFailed: number
}

/**
 * Phase 1: move blocking variants/items to their temp sku. Phase 2: give items
 * their final sku. (Variants get their final sku from the regular product
 * update.) Each step isolates failures per record; a record left on a temp
 * sku is fixed by the next run's reconcile.
 */
export async function applySkuPlan(
  container: MedusaContainer,
  plan: ProductSkuPlan,
  itemTitle: (variantId: string) => string | undefined,
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }
): Promise<ApplySkuPlanResult> {
  const result: ApplySkuPlanResult = {
    variantTempFailed: 0,
    itemsRenamed: 0,
    itemsFailed: 0,
  }

  if (plan.variantTemp.length) {
    logger.info(
      `[moloni-sync] moving ${plan.variantTemp.length} variant sku(s) to a temporary sku to free them: ${plan.variantTemp
        .map((t) => `${t.id}→${t.sku}`)
        .join(", ")}`
    )
    const r = await runInBatchesWithFallback(plan.variantTemp, 50, (batch) =>
      updateProductVariantsWorkflow(container).run({
        input: { product_variants: batch.map((t) => ({ id: t.id, sku: t.sku })) },
      })
    )
    for (const f of r.failed) {
      logger.error(
        `[moloni-sync] variant ${f.item.id} temp sku ${f.item.sku} failed: ${errorMessage(f.error)}`
      )
    }
    result.variantTempFailed = r.failed.length
  }

  if (plan.itemTemp.length) {
    const r = await runInBatchesWithFallback(plan.itemTemp, 50, (batch) =>
      updateInventoryItemsWorkflow(container).run({
        input: { updates: batch.map((t) => ({ id: t.id, sku: t.sku })) },
      })
    )
    for (const f of r.failed) {
      logger.error(
        `[moloni-sync] inventory item ${f.item.id} temp sku ${f.item.sku} failed: ${errorMessage(f.error)}`
      )
    }
    result.itemsFailed += r.failed.length
  }

  if (plan.itemFinal.length) {
    const r = await runInBatchesWithFallback(plan.itemFinal, 50, (batch) =>
      updateInventoryItemsWorkflow(container).run({
        input: {
          updates: batch.map((f) => {
            const title = itemTitle(f.variantId)
            return { id: f.id, sku: f.sku, ...(title ? { title } : {}) }
          }),
        },
      })
    )
    for (const f of r.succeeded) {
      logger.info(
        `[moloni-sync] inventory item ${f.id} sku ${f.from ?? "∅"} → ${f.sku} (Moloni ${f.moloniId ?? "-"})`
      )
    }
    for (const f of r.failed) {
      logger.error(
        `[moloni-sync] inventory item ${f.item.id} sku ${f.item.from ?? "∅"} → ${f.item.sku} failed: ${errorMessage(f.error)}`
      )
    }
    result.itemsRenamed = r.succeeded.length
    result.itemsFailed += r.failed.length
  }

  for (const b of plan.itemBlocked) logger.warn(`[moloni-sync] ${b.reason}`)
  return result
}
