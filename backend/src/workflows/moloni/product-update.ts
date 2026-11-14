/**
 * Update payload for an existing Moloni-backed product, and change detection
 * against its current Medusa state (pure — unit-tested).
 *
 * Every `updateProductsWorkflow` run emits `product.updated` (→ search
 * re-index, …) even when nothing changed. Moloni's "modified since" also
 * returns products touched for reasons the sync does not care about (e.g.
 * stock movements), and a full re-sync re-sends the whole catalog, so updates
 * are only sent when a field the sync owns actually differs.
 */
import type { MoloniProduct } from "../../modules/moloni"
import {
  EUR,
  defaultEurPrice,
  supplierCost,
  variantSku,
  vatPercent,
} from "./mappers"

export interface ProductRef {
  productId: string
  variantId: string
  metadata: Record<string, any>
}

/** Fields fetched for change detection (product entity). */
export const PRODUCT_STATE_FIELDS = [
  "title",
  "categories.id",
  "variants.barcode",
  "variants.manage_inventory",
  "variants.metadata",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "variants.prices.price_list_id",
  "variants.prices.rules_count",
  "variants.prices.min_quantity",
  "variants.prices.max_quantity",
  "variants.inventory_items.inventory.id",
]

/** Product-level metadata keys the sync owns (merged over existing metadata). */
const PRODUCT_METADATA_KEYS = [
  "moloni_product_id",
  "moloni_category_id",
  "moloni_vat_percent",
] as const

export function toUpdateProductInput(
  p: MoloniProduct,
  ref: ProductRef,
  categoryId?: string
) {
  const cost = supplierCost(p)
  return {
    id: ref.productId,
    title: p.name,
    // description & subtitle are Medusa-owned (SoT); the sync never touches them.
    category_ids: categoryId ? [categoryId] : undefined,
    // Merge onto existing metadata so manually-set keys (e.g. `excluded`)
    // and `moloni_vat_percent` survive re-syncs instead of being wiped.
    metadata: {
      ...ref.metadata,
      moloni_product_id: p.product_id,
      moloni_category_id: p.category_id,
      moloni_vat_percent: vatPercent(p) ?? null,
    } as Record<string, unknown>,
    variants: [
      {
        id: ref.variantId,
        sku: variantSku(p),
        barcode: p.ean || undefined,
        manage_inventory: p.has_stock === 1,
        prices: [{ amount: defaultEurPrice(p), currency_code: EUR }],
        metadata: { moloni_product_id: p.product_id, ...cost } as Record<
          string,
          unknown
        >,
      },
    ],
  }
}

export type ProductUpdateInput = ReturnType<typeof toUpdateProductInput>

export interface ExistingProductState {
  title: string | null
  categoryIds: string[]
  metadata: Record<string, unknown>
  variant: {
    id: string
    sku: string | null
    barcode: string | null
    manageInventory: boolean
    metadata: Record<string, unknown>
    /** Base EUR price (no price list, no rules/quantity tiers), if any. */
    eurAmount: number | null
    hasInventoryItem: boolean
  } | null
}

/** Extract the comparable state from a `product` graph row (PRODUCT_STATE_FIELDS). */
export function existingStateFromRow(row: any): ExistingProductState {
  const v = row?.variants?.[0]
  const base = (v?.prices ?? []).find(
    (pr: any) =>
      String(pr?.currency_code ?? "").toLowerCase() === EUR &&
      !pr.price_list_id &&
      !(Number(pr.rules_count) > 0) &&
      pr.min_quantity == null &&
      pr.max_quantity == null
  )
  return {
    title: row?.title ?? null,
    categoryIds: (row?.categories ?? []).map((c: any) => c.id).filter(Boolean),
    metadata: row?.metadata ?? {},
    variant: v
      ? {
          id: v.id,
          sku: v.sku ?? null,
          barcode: v.barcode ?? null,
          manageInventory: v.manage_inventory === true,
          metadata: v.metadata ?? {},
          eurAmount:
            base && base.amount != null && Number.isFinite(Number(base.amount))
              ? Number(base.amount)
              : null,
          hasInventoryItem: (v.inventory_items ?? []).some(
            (ii: any) => ii?.inventory?.id
          ),
        }
      : null,
  }
}

/** Loose equality for stored JSON values: null ≡ undefined, 1 ≡ "1". */
export function sameValue(a: unknown, b: unknown): boolean {
  const na = a === undefined ? null : a
  const nb = b === undefined ? null : b
  if (na === nb) return true
  if (na === null || nb === null) return false
  const numA = typeof na === "number" || (typeof na === "string" && na.trim() !== "")
  const numB = typeof nb === "number" || (typeof nb === "string" && nb.trim() !== "")
  if (numA && numB && Number.isFinite(Number(na)) && Number.isFinite(Number(nb))) {
    return Math.abs(Number(na) - Number(nb)) < 1e-9
  }
  return String(na) === String(nb)
}

/**
 * Names of the sync-owned fields that differ between `input` and `existing`;
 * empty → the update can be skipped.
 */
export function productUpdateChanges(
  input: ProductUpdateInput,
  existing: ExistingProductState
): string[] {
  const changes: string[] = []
  const v = existing.variant
  const iv = input.variants[0]
  if (!v || v.id !== iv.id) return ["variant"]

  if ((existing.title ?? "") !== (input.title ?? "")) changes.push("title")
  if (input.category_ids) {
    const want = [...input.category_ids].sort().join(",")
    const have = [...existing.categoryIds].sort().join(",")
    if (want !== have) changes.push("categories")
  }
  for (const k of PRODUCT_METADATA_KEYS) {
    if (!sameValue(input.metadata[k], existing.metadata[k])) {
      changes.push(`metadata.${k}`)
    }
  }
  if ((v.sku ?? "") !== iv.sku) changes.push("sku")
  if (iv.barcode !== undefined && (v.barcode ?? "") !== iv.barcode) {
    changes.push("barcode")
  }
  if (v.manageInventory !== iv.manage_inventory) changes.push("manage_inventory")
  // Medusa creates the missing default inventory item on update.
  if (iv.manage_inventory && !v.hasInventoryItem) changes.push("inventory_item")
  const amount = iv.prices[0].amount
  if (v.eurAmount === null || !sameValue(v.eurAmount, amount)) {
    changes.push("price")
  }
  for (const [k, val] of Object.entries(iv.metadata)) {
    if (val === undefined) continue // not sent (JSON drops it)
    if (!sameValue(val, v.metadata[k])) changes.push(`variant.metadata.${k}`)
  }
  return changes
}
