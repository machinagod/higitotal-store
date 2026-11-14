/**
 * Moloni -> Medusa sync orchestration.
 *
 * Idempotent: every entity is keyed on its Moloni id (products via
 * `external_id`, everything else via `metadata.moloni_*`), so re-runs update
 * in place rather than duplicating. Safe to run on a schedule.
 *
 * Order matters: categories -> products(+variants, default EUR price) ->
 * price lists (price classes + cost) -> stock -> customers.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createCustomerAddressesWorkflow,
  createCustomersWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListPricesWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  deleteProductsWorkflow,
  updateCustomersWorkflow,
  updateInventoryLevelsWorkflow,
  updatePriceListPricesWorkflow,
  updateProductCategoriesWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { MOLONI_MODULE } from "../../modules/moloni"
import type MoloniModuleService from "../../modules/moloni/service"
import { EPOCH_CURSOR } from "../../modules/moloni/service"
import type { MoloniCustomer, MoloniProduct } from "../../modules/moloni"
import {
  EUR,
  categoryHandle,
  collectPriceClasses,
  defaultEurPrice,
  placeholderCustomerEmail,
  realCustomerEmail,
  supplierCost,
  toCreateProductInput,
  toCustomerAddress,
  toCustomerInput,
  totalStock,
  variantSku,
} from "./mappers"
import { errorMessage, runInBatchesWithFallback } from "./batch"
import { CATEGORY_STATE_FIELDS, categoryChanges } from "./category-update"
import {
  PRODUCT_STATE_FIELDS,
  existingStateFromRow,
  productUpdateChanges,
  toUpdateProductInput,
  type ExistingProductState,
  type ProductRef,
  type ProductUpdateInput,
} from "./product-update"
import {
  MAX_RETRY_FETCH,
  PRODUCT_RETRY_STATE_KEY,
  mergeRetryState,
  parseRetryState,
  retryIds,
  serializeRetryState,
} from "./retry-state"
import { planProductSkuSync, type PlannedProduct } from "./sku-plan"
import { applySkuPlan, loadSkuSnapshot } from "./sku-sync"
import { loadVariantsWithoutPriceSet } from "./price-sets"
import { ensureVariantPriceSetsWorkflow } from "./ensure-variant-price-sets"

export type MoloniSyncEntity =
  | "categories"
  | "products"
  | "prices"
  | "stock"
  | "customers"

export interface MoloniSyncOptions {
  dryRun?: boolean
  /** Cap products & customers fetched (for testing / first observed runs). */
  limit?: number
  /** Restrict to a subset of entities. Defaults to all. */
  entities?: MoloniSyncEntity[]
  /** Override product status (defaults to draft). */
  productStatus?: "draft" | "published"
  /**
   * Ignore stored cursors and fetch everything (since epoch). Default false:
   * the run is incremental once a cursor exists, full on the first run.
   */
  full?: boolean
}

export interface MoloniSyncReport {
  dryRun: boolean
  categories: { created: number; updated: number; unchanged: number }
  products: {
    created: number
    updated: number
    /** Existing products skipped because nothing the sync owns changed. */
    unchanged: number
    /** Products that failed (or were skipped on a sku conflict); retried next run. */
    failed: number
    /** Size of the retry list (previously failed products) at the start of the run. */
    retried: number
    /** Existing variants that had no price set and got one. */
    priceSetsCreated: number
  }
  /** Inventory items whose sku was brought in line with their variant. */
  inventoryItems: { renamed: number; failed: number }
  priceListPrices: {
    created: number
    updated: number
    priceLists: number
    failed: number
  }
  stock: { created: number; updated: number; failed: number }
  customers: {
    created: number
    updated: number
    skipped: number
    emailConflicts: number
  }
}

const CHUNK = 50

function chunk<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Fetch every row of a graph query, paginating in pages of 200. */
async function graphAll(
  query: any,
  entity: string,
  fields: string[],
  filters?: Record<string, unknown>
): Promise<any[]> {
  const out: any[] = []
  let skip = 0
  const take = 200
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, metadata } = await query.graph({
      entity,
      fields,
      filters,
      pagination: { skip, take },
    })
    out.push(...data)
    const count = metadata?.count ?? out.length
    skip += take
    if (out.length >= count || data.length === 0) break
  }
  return out
}

export async function runMoloniSync(
  container: MedusaContainer,
  options: MoloniSyncOptions = {}
): Promise<MoloniSyncReport> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const moloni = container.resolve(MOLONI_MODULE) as MoloniModuleService

  const dryRun = options.dryRun ?? false
  const status = (options.productStatus ?? "draft") as "draft" | "published"
  const entities = new Set<MoloniSyncEntity>(
    options.entities ?? ["categories", "products", "prices", "stock", "customers"]
  )

  const report: MoloniSyncReport = {
    dryRun,
    categories: { created: 0, updated: 0, unchanged: 0 },
    products: { created: 0, updated: 0, unchanged: 0, failed: 0, retried: 0, priceSetsCreated: 0 },
    inventoryItems: { renamed: 0, failed: 0 },
    priceListPrices: { created: 0, updated: 0, priceLists: 0, failed: 0 },
    stock: { created: 0, updated: 0, failed: 0 },
    customers: { created: 0, updated: 0, skipped: 0, emailConflicts: 0 },
  }

  logger.info(
    `[moloni-sync] start dryRun=${dryRun} entities=${[...entities].join(",")} limit=${
      options.limit ?? "none"
    }`
  )

  // ── Shared infra references ──────────────────────────────────────────────
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const [defaultSalesChannel] = await salesChannelService.listSalesChannels({
    name: "Default Sales Channel",
  })
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const [shippingProfile] = await fulfillmentService.listShippingProfiles({
    type: "default",
  })
  const [stockLocation] = await graphAll(query, "stock_location", ["id", "name"])

  if (!defaultSalesChannel || !shippingProfile || !stockLocation) {
    throw new Error(
      "[moloni-sync] Missing prerequisites (default sales channel / shipping profile / stock location). Run the base seed first."
    )
  }

  // ── 1. Categories ──────────────────────────────────────────────────────
  // moloni category_id -> medusa category id
  const categoryMap = new Map<number, string>()
  // medusa category id -> current row (for change detection)
  const categoryRow = new Map<string, Record<string, unknown>>()
  {
    const existing = await graphAll(
      query,
      "product_category",
      CATEGORY_STATE_FIELDS
    )
    for (const c of existing) {
      const mid = c.metadata?.moloni_category_id
      if (mid != null) categoryMap.set(Number(mid), c.id)
      categoryRow.set(c.id, c)
    }
  }

  if (entities.has("categories")) {
    const moloniCats = await moloni.listAllCategories()
    const pending = [...moloniCats]

    // Moloni brand "grouping" categories that must NOT surface as browsable
    // Medusa categories — they duplicate storefront collections. Their children
    // are promoted to the nearest non-hidden ancestor (root, for these), and any
    // existing Medusa category for them is forced inactive + internal so the
    // store API omits it. Without this the Moloni sync recreates the grouping
    // node and re-parents its children under it on every run.
    const HIDDEN_MOLONI_CATEGORY_IDS = new Set<number>([
      7584765, // "Diversey Unilever" → its only child "Unilever" goes top-level
    ])
    const moloniParent = new Map<number, number>()
    for (const c of moloniCats) moloniParent.set(c.category_id, c.parent_id)
    // Resolve a Moloni parent_id to the nearest non-hidden ancestor (0 = root),
    // skipping over any hidden grouping nodes in the chain.
    const effParentMoloniId = (parentId: number): number => {
      let pid = parentId
      const seen = new Set<number>()
      while (pid && HIDDEN_MOLONI_CATEGORY_IDS.has(pid) && !seen.has(pid)) {
        seen.add(pid)
        pid = moloniParent.get(pid) ?? 0
      }
      return pid || 0
    }

    // Topologically create/update: a category is ready when its effective parent
    // is the root (0) or already mapped.
    // Update an existing category only when a field the sync owns changed.
    const updateCategory = async (id: string, update: Record<string, unknown>) => {
      if (!categoryChanges(categoryRow.get(id), update).length) {
        report.categories.unchanged++
        return
      }
      if (!dryRun) {
        await updateProductCategoriesWorkflow(container).run({
          input: { selector: { id }, update },
        })
      }
      report.categories.updated++
    }

    let guard = pending.length + 1
    while (pending.length && guard-- > 0) {
      const ready = pending.filter((c) => {
        if (HIDDEN_MOLONI_CATEGORY_IDS.has(c.category_id)) return true
        const ep = effParentMoloniId(c.parent_id)
        return ep === 0 || categoryMap.has(ep)
      })
      if (!ready.length) {
        // Orphans (parent missing in Moloni payload) — attach to root.
        ready.push(...pending)
      }
      for (const c of ready) {
        const existingId = categoryMap.get(c.category_id)

        // Hidden grouping node: never browsable. Hide an existing one; never
        // create one. Children resolve past it via effParentMoloniId.
        if (HIDDEN_MOLONI_CATEGORY_IDS.has(c.category_id)) {
          if (existingId) {
            await updateCategory(existingId, {
              is_active: false,
              is_internal: true,
            })
          }
          continue
        }

        const ep = effParentMoloniId(c.parent_id)
        const parentId = ep === 0 ? undefined : categoryMap.get(ep)
        if (existingId) {
          await updateCategory(existingId, {
            name: c.name,
            parent_category_id: parentId ?? null,
          })
        } else {
          if (!dryRun) {
            const { result } = await createProductCategoriesWorkflow(
              container
            ).run({
              input: {
                product_categories: [
                  {
                    name: c.name,
                    handle: categoryHandle(c.name, c.category_id),
                    is_active: true,
                    parent_category_id: parentId ?? null,
                    metadata: { moloni_category_id: c.category_id },
                  },
                ],
              },
            })
            categoryMap.set(c.category_id, result[0].id)
          } else {
            // In dry-run we still register a placeholder so children resolve.
            categoryMap.set(c.category_id, `dry-${c.category_id}`)
          }
          report.categories.created++
        }
      }
      const done = new Set(ready.map((c) => c.category_id))
      for (let i = pending.length - 1; i >= 0; i--) {
        if (done.has(pending[i].category_id)) pending.splice(i, 1)
      }
    }
    logger.info(
      `[moloni-sync] categories created=${report.categories.created} updated=${report.categories.updated} unchanged=${report.categories.unchanged}`
    )
  }

  // ── 2. Products (+ default EUR price on the single variant) ─────────────
  const needProducts =
    entities.has("products") || entities.has("prices") || entities.has("stock")
  const runStart = new Date().toISOString()
  const productsSince = options.full
    ? EPOCH_CURSOR
    : await moloni.getSyncCursor("products")
  const moloniProducts = needProducts
    ? await moloni.listProducts({ since: productsSince, limit: options.limit })
    : []

  // Products that failed on an earlier run are retried until they succeed —
  // the cursor moved past them, so fetch the ones not already in this batch.
  const retryState = entities.has("products")
    ? parseRetryState(await moloni.getSyncState(PRODUCT_RETRY_STATE_KEY))
    : {}
  const retryNotFound: number[] = []
  {
    const pending = retryIds(retryState)
    if (pending.length) {
      const fetched = new Set(moloniProducts.map((p) => p.product_id))
      const toFetch = pending.filter((id) => !fetched.has(id))
      const batch = toFetch.slice(0, MAX_RETRY_FETCH)
      logger.info(
        `[moloni-sync] retry list: ${pending.length} product(s) (${
          pending.length - toFetch.length
        } already in this run, fetching ${batch.length} by id${
          toFetch.length > batch.length
            ? `, ${toFetch.length - batch.length} deferred`
            : ""
        })`
      )
      if (batch.length) {
        const r = await moloni.getProductsByIds(batch)
        moloniProducts.push(...r.found)
        retryNotFound.push(...r.notFound)
        for (const e of r.errors) {
          logger.warn(
            `[moloni-sync] could not fetch retry product ${e.id}: ${e.message} (kept for next run)`
          )
        }
      }
      report.products.retried = pending.length
    }
  }

  // Failed Moloni product id -> error message (products, prices or stock);
  // persisted as the retry list at the end of the run.
  const failures = new Map<number, string>()
  const productById = new Map(moloniProducts.map((p) => [p.product_id, p]))
  const markForRetry = (moloniId: number, message: string) => {
    const prev = failures.get(moloniId)
    failures.set(moloniId, prev ? `${prev}; ${message}` : message)
  }
  const recordFailure = (p: MoloniProduct, error: unknown) => {
    const message = errorMessage(error)
    logger.error(
      `[moloni-sync] product ${p.product_id} (${variantSku(p)}) failed: ${message}`
    )
    if (!failures.has(p.product_id)) report.products.failed++
    markForRetry(p.product_id, message)
  }
  // Price/stock per-item failure: logged + retried, counted by the caller.
  const recordItemFailure = (section: string) => (moloniId: number, error: unknown) => {
    const message = `${section}: ${errorMessage(error)}`
    const p = productById.get(moloniId)
    logger.error(
      `[moloni-sync] product ${moloniId} (${p ? variantSku(p) : "?"}) ${message}`
    )
    markForRetry(moloniId, message)
  }

  // moloni product_id -> { productId, variantId }. Only look up the products
  // we actually fetched (keeps incremental runs cheap as the catalog grows).
  const variantByMoloni = new Map<number, ProductRef>()
  const existingState = new Map<number, ExistingProductState>()
  let changeDetection = true
  if (moloniProducts.length) {
    const externalIds = moloniProducts.map((p) => String(p.product_id))
    const baseFields = ["id", "external_id", "metadata", "variants.id", "variants.sku"]
    const lookup = async (fields: string[]) => {
      const rows: any[] = []
      for (const ids of chunk(externalIds, 200)) {
        rows.push(
          ...(await graphAll(query, "product", fields, { external_id: ids }))
        )
      }
      return rows
    }
    let existing: any[]
    try {
      existing = await lookup([...baseFields, ...PRODUCT_STATE_FIELDS])
    } catch (e) {
      // Never let the optional change-detection fields break the sync.
      logger.warn(
        `[moloni-sync] change-detection lookup failed (${errorMessage(e)}); updating every fetched product`
      )
      changeDetection = false
      existing = await lookup(baseFields)
    }
    for (const p of existing) {
      if (!p.external_id) continue
      const mid = Number(p.external_id)
      if (Number.isNaN(mid)) continue
      const variantId = p.variants?.[0]?.id
      if (variantId) {
        variantByMoloni.set(mid, {
          productId: p.id,
          variantId,
          metadata: p.metadata ?? {},
        })
        if (changeDetection) existingState.set(mid, existingStateFromRow(p))
      }
    }
  }

  if (entities.has("products")) {
    let toCreate: MoloniProduct[] = []
    let toUpdate: MoloniProduct[] = []
    for (const p of moloniProducts) {
      const ref = variantByMoloni.get(p.product_id)
      if (!ref) {
        toCreate.push(p)
      } else if (ref.metadata?.excluded !== true) {
        toUpdate.push(p)
      }
      // Products flagged `metadata.excluded` (manually dropped from the catalog)
      // are left untouched — the sync never re-publishes or overwrites them.
    }

    // Keep variant + inventory-item skus collision-free (Moloni references can
    // move between products) and heal item skus that drifted from their
    // variant. Products whose sku is genuinely taken are skipped, not fatal.
    const planned: PlannedProduct[] = [
      ...toCreate.map((p) => ({
        moloniId: p.product_id,
        sku: variantSku(p),
        manageInventory: p.has_stock === 1,
      })),
      ...toUpdate.map((p) => ({
        moloniId: p.product_id,
        variantId: variantByMoloni.get(p.product_id)!.variantId,
        sku: variantSku(p),
        manageInventory: p.has_stock === 1,
      })),
    ]
    try {
      const snapshot = await loadSkuSnapshot(
        (entity, fields, filters) => graphAll(query, entity, fields, filters),
        planned
      )
      const plan = planProductSkuSync({ ...snapshot, planned })
      for (const [mid, s] of plan.skipped) {
        recordFailure(
          productById.get(mid)!,
          `skipped: ${s.reason}${
            s.otherMoloniIds.length
              ? ` (duplicate reference? Moloni products ${[
                  mid,
                  ...s.otherMoloniIds,
                ].join(" & ")})`
              : ""
          }`
        )
      }
      toCreate = toCreate.filter((p) => !plan.skipped.has(p.product_id))
      toUpdate = toUpdate.filter((p) => !plan.skipped.has(p.product_id))

      if (dryRun) {
        logger.info(
          `[moloni-sync] (dry) sku plan: ${plan.variantTemp.length} variant temp move(s), ${plan.itemTemp.length} item temp move(s), ${plan.itemFinal.length} item rename(s), ${plan.skipped.size} skipped`
        )
      } else {
        const nameByVariant = new Map<string, string>()
        for (const p of toUpdate) {
          nameByVariant.set(variantByMoloni.get(p.product_id)!.variantId, p.name)
        }
        const applied = await applySkuPlan(
          container,
          plan,
          (variantId) => nameByVariant.get(variantId),
          logger
        )
        report.inventoryItems.renamed += applied.itemsRenamed
        report.inventoryItems.failed += applied.itemsFailed
      }
    } catch (e) {
      // Planning is a safety net; without it the per-product isolation below
      // still keeps a collision from aborting the run.
      logger.error(
        `[moloni-sync] sku planning failed (${errorMessage(e)}); continuing without it`
      )
    }

    // creates (batched; a failing batch is replayed product by product)
    const created = await runInBatchesWithFallback(
      toCreate,
      CHUNK,
      async (batch) => {
        const products = batch.map((p) =>
          toCreateProductInput({
            product: p,
            status,
            categoryId: categoryMap.get(p.category_id),
            shippingProfileId: shippingProfile.id,
            salesChannelId: defaultSalesChannel.id,
          })
        )
        if (dryRun) return
        const { result } = await createProductsWorkflow(container).run({
          input: { products: products as any },
        })
        for (const c of result) {
          const mid = Number(c.external_id)
          const variantId = c.variants?.[0]?.id
          if (!Number.isNaN(mid) && variantId) {
            variantByMoloni.set(mid, { productId: c.id, variantId, metadata: {} })
          }
        }
      },
      (e, batch) =>
        logger.warn(
          `[moloni-sync] create batch of ${batch.length} failed (${errorMessage(e)}); retrying product by product`
        )
    )
    report.products.created += created.succeeded.length
    for (const f of created.failed) recordFailure(f.item, f.error)

    // updates (preserve manual status / publishing); only what changed
    const updates: { p: MoloniProduct; input: ProductUpdateInput }[] = []
    for (const p of toUpdate) {
      const input = toUpdateProductInput(
        p,
        variantByMoloni.get(p.product_id)!,
        categoryMap.get(p.category_id)
      )
      const state = existingState.get(p.product_id)
      if (changeDetection && state && !productUpdateChanges(input, state).length) {
        report.products.unchanged++
        continue
      }
      updates.push({ p, input })
    }
    const updated = await runInBatchesWithFallback(
      updates,
      CHUNK,
      async (batch) => {
        if (dryRun) return
        await updateProductsWorkflow(container).run({
          input: { products: batch.map((u) => u.input) as any },
        })
      },
      (e, batch) =>
        logger.warn(
          `[moloni-sync] update batch of ${batch.length} failed (${errorMessage(e)}); retrying product by product`
        )
    )
    report.products.updated += updated.succeeded.length
    for (const f of updated.failed) recordFailure(f.item.p, f.error)

    // Heal existing variants that have NO price set (early imports): Medusa
    // ignores `variants[].prices` for them and every price-list write throws.
    const failedNow = new Set(failures.keys())
    const healCandidates = toUpdate.filter((p) => !failedNow.has(p.product_id))
    if (healCandidates.length) {
      try {
        const missing = new Set(
          await loadVariantsWithoutPriceSet(
            (entity, fields, filters) => graphAll(query, entity, fields, filters),
            healCandidates.map((p) => variantByMoloni.get(p.product_id)!.variantId)
          )
        )
        const toHeal = healCandidates.filter((p) =>
          missing.has(variantByMoloni.get(p.product_id)!.variantId)
        )
        if (toHeal.length) {
          logger.warn(
            `[moloni-sync] ${toHeal.length} variant(s) have no price set; creating one: ${toHeal
              .map((p) => `${p.product_id} (${variantSku(p)})`)
              .join(", ")}`
          )
          const healed = await runInBatchesWithFallback(toHeal, CHUNK, async (batch) => {
            if (dryRun) return
            await ensureVariantPriceSetsWorkflow(container).run({
              input: {
                variants: batch.map((p) => ({
                  variant_id: variantByMoloni.get(p.product_id)!.variantId,
                  prices: [{ amount: defaultEurPrice(p), currency_code: EUR }],
                })),
              },
            })
          })
          report.products.priceSetsCreated += healed.succeeded.length
          for (const f of healed.failed) {
            recordFailure(f.item, `creating missing price set: ${errorMessage(f.error)}`)
          }
        }
      } catch (e) {
        logger.error(
          `[moloni-sync] price-set check failed (${errorMessage(e)}); continuing`
        )
      }
    }

    logger.info(
      `[moloni-sync] products created=${report.products.created} updated=${report.products.updated} unchanged=${report.products.unchanged} failed=${report.products.failed} priceSetsCreated=${report.products.priceSetsCreated}`
    )
  }

  // Prices and stock are re-derived from the products fetched this run. They
  // isolate failures per item; if a whole section still throws, every product
  // of this run goes on the retry list (so it is re-derived next run) instead of
  // aborting the run before the cursor is saved.
  const retryWholeSection = (section: string, e: unknown) => {
    const message = `${section} step failed: ${errorMessage(e)}`
    logger.error(`[moloni-sync] ${message}; all ${variantByMoloni.size} products of this run will be retried`)
    for (const p of moloniProducts) {
      if (variantByMoloni.has(p.product_id)) markForRetry(p.product_id, message)
    }
  }

  // ── 3. Price lists (price classes + Moloni Cost) ────────────────────────
  if (entities.has("prices") && !dryRun) {
    try {
      await syncPriceLists(
        container,
        query,
        moloniProducts,
        variantByMoloni,
        report,
        logger,
        recordItemFailure("price lists")
      )
    } catch (e) {
      retryWholeSection("price lists", e)
    }
  } else if (entities.has("prices")) {
    const classes = collectPriceClasses(moloniProducts)
    logger.info(
      `[moloni-sync] (dry) would ensure ${classes.size + 1} price lists and prices for ${variantByMoloni.size} variants`
    )
  }

  // ── 4. Stock ────────────────────────────────────────────────────────────
  if (entities.has("stock")) {
    try {
      await syncStock(
        container,
        query,
        moloniProducts,
        variantByMoloni,
        stockLocation.id,
        dryRun,
        report,
        logger,
        recordItemFailure("stock")
      )
    } catch (e) {
      retryWholeSection("stock", e)
    }
  }

  // Advance the products cursor once products (and their derived prices/stock)
  // are synced — even when some failed: those are remembered in the retry list
  // and fetched by id next run, so a poisoned product can no longer turn every
  // run into a full re-sync. Use the run start time so anything modified during
  // the run is re-checked next time.
  if (entities.has("products") && !dryRun) {
    const nextRetry = mergeRetryState(retryState, {
      processed: moloniProducts.map((p) => p.product_id),
      failed: failures,
      notFound: retryNotFound,
      now: runStart,
    })
    const pendingRetry = Object.keys(nextRetry).length
    if (pendingRetry || Object.keys(retryState).length) {
      logger.info(
        `[moloni-sync] retry list: ${pendingRetry} product(s) pending for next run`
      )
    }
    await moloni.setSyncState(
      PRODUCT_RETRY_STATE_KEY,
      serializeRetryState(nextRetry)
    )
    await moloni.setSyncCursor("products", runStart)
  }

  // ── 5. Customers ────────────────────────────────────────────────────────
  if (entities.has("customers")) {
    const customersSince = options.full
      ? EPOCH_CURSOR
      : await moloni.getSyncCursor("customers")
    await syncCustomers(
      container,
      query,
      moloni,
      customersSince,
      options.limit,
      dryRun,
      report,
      logger
    )
    if (!dryRun) await moloni.setSyncCursor("customers", runStart)
  }

  logger.info(`[moloni-sync] done: ${JSON.stringify(report)}`)
  return report
}

/**
 * Prune Medusa products that were imported from Moloni but are no longer in
 * Moloni's *visible* set (archived/hidden or deleted in Moloni). Manual only —
 * never wired into the scheduled job, since auto-deletion on a cron is risky.
 *
 * Safety: aborts if Moloni returns an implausibly small visible set, or if the
 * prune would remove more than 70% of the imported products (guards against a
 * partial/empty API response wiping the catalog).
 */
export async function pruneInvisibleProducts(
  container: MedusaContainer,
  opts: { dryRun?: boolean } = {}
): Promise<{ visible: number; imported: number; toDelete: number; deleted: number }> {
  const dryRun = opts.dryRun ?? false
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const moloni = container.resolve(MOLONI_MODULE) as MoloniModuleService

  const visible = await moloni.listProducts({}) // getModifiedSince(epoch) = visible only
  const visibleIds = new Set(visible.map((p) => String(p.product_id)))
  if (visibleIds.size < 100) {
    throw new Error(
      `[moloni-prune] aborting: Moloni returned only ${visibleIds.size} visible products — refusing to prune`
    )
  }

  const existing = await graphAll(query, "product", ["id", "external_id"])
  const imported = existing.filter(
    (p) => p.external_id && /^\d+$/.test(p.external_id)
  )
  const toDelete = imported
    .filter((p) => !visibleIds.has(p.external_id))
    .map((p) => p.id)

  const ratio = imported.length ? toDelete.length / imported.length : 0
  if (ratio > 0.7) {
    throw new Error(
      `[moloni-prune] aborting: would delete ${toDelete.length}/${imported.length} (${Math.round(
        ratio * 100
      )}%) imported products — exceeds 70% safety threshold`
    )
  }

  logger.info(
    `[moloni-prune] visible=${visibleIds.size} imported=${imported.length} toDelete=${toDelete.length} dryRun=${dryRun}`
  )

  if (!dryRun) {
    for (const batch of chunk(toDelete, 100)) {
      await deleteProductsWorkflow(container).run({ input: { ids: batch } })
    }
  }

  return {
    visible: visibleIds.size,
    imported: imported.length,
    toDelete: toDelete.length,
    deleted: dryRun ? 0 : toDelete.length,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Price lists
// ─────────────────────────────────────────────────────────────────────────
type ItemFailureHandler = (moloniId: number, error: unknown) => void

async function syncPriceLists(
  container: MedusaContainer,
  query: any,
  products: MoloniProduct[],
  variantByMoloni: Map<number, ProductRef>,
  report: MoloniSyncReport,
  logger: any,
  onItemFailure: ItemFailureHandler
) {
  const classes = collectPriceClasses(products) // price_class_id -> title

  // price_list has no metadata column, so idempotency keys on the deterministic
  // title ("Moloni <price class>", and "Moloni Cost").
  const COST_TITLE = "Moloni Cost"
  const classTitle = (title: string) => `Moloni ${title}`

  const existingLists = await graphAll(query, "price_list", ["id", "title"])
  const listByTitle = new Map<string, string>()
  for (const pl of existingLists) {
    if (pl.title) listByTitle.set(pl.title, pl.id)
  }

  // Moloni price-class / cost lists are created as DRAFT so they never apply to
  // storefront carts — otherwise Medusa resolves to the cheapest applicable
  // price and leaks supplier cost / wholesale (PVP2…) as the public price. The
  // store uses the variant's default price (= PVP1); these drafts keep cost and
  // alternate classes visible in admin for margin analysis only.
  const ensureList = async (title: string, description: string) => {
    const existing = listByTitle.get(title)
    if (existing) return existing
    const { result } = await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          { title, description, type: "override", status: "draft" } as any,
        ],
      },
    })
    listByTitle.set(title, result[0].id)
    report.priceListPrices.priceLists++
    return result[0].id as string
  }

  // price_class_id -> price list id
  const listByClass = new Map<number, string>()
  for (const [classId, title] of classes) {
    const id = await ensureList(
      classTitle(title),
      `Moloni price class ${title} (#${classId})`
    )
    listByClass.set(classId, id)
  }
  const costListId = await ensureList(
    COST_TITLE,
    "Supplier cost prices imported from Moloni"
  )

  // Existing price-list prices keyed by `${listId}:${variantId}` -> { id, amount }.
  const existingPrices = new Map<string, { id: string; amount: number }>()
  try {
    const lists = await graphAll(query, "price_list", [
      "id",
      "prices.id",
      "prices.amount",
      "prices.currency_code",
      "prices.price_set.variant.id",
    ])
    for (const pl of lists) {
      for (const pr of pl.prices ?? []) {
        const variantId = pr.price_set?.variant?.id
        if (variantId) {
          existingPrices.set(`${pl.id}:${variantId}`, {
            id: pr.id,
            amount: pr.amount,
          })
        }
      }
    }
  } catch (e: any) {
    logger.warn(
      `[moloni-sync] could not read existing price-list prices (${e.message}); will create only`
    )
  }

  // A price-list price needs the variant's price set; Medusa throws "No price
  // set exist for variants" for the whole batch otherwise. Skip those (the
  // products step normally creates the missing set first).
  const runVariants = products
    .map((p) => variantByMoloni.get(p.product_id)?.variantId)
    .filter((v): v is string => !!v)
  const withoutPriceSet = new Set(
    await loadVariantsWithoutPriceSet(
      (entity, fields, filters) => graphAll(query, entity, fields, filters),
      runVariants
    )
  )

  // Build desired prices grouped by list, split into create vs update.
  type Entry = { moloniId: number; data: any }
  const toCreate = new Map<string, Entry[]>() // listId -> [{amount,currency_code,variant_id}]
  const toUpdate = new Map<string, Entry[]>() // listId -> [{id,amount,currency_code,variant_id}]

  const push = (
    moloniId: number,
    listId: string,
    variantId: string,
    amount: number
  ) => {
    const key = `${listId}:${variantId}`
    const existing = existingPrices.get(key)
    if (existing) {
      if (Math.abs(existing.amount - amount) > 1e-9) {
        const arr = toUpdate.get(listId) ?? []
        arr.push({
          moloniId,
          data: { id: existing.id, amount, currency_code: EUR, variant_id: variantId },
        })
        toUpdate.set(listId, arr)
      }
    } else {
      const arr = toCreate.get(listId) ?? []
      arr.push({
        moloniId,
        data: { amount, currency_code: EUR, variant_id: variantId },
      })
      toCreate.set(listId, arr)
    }
  }

  for (const p of products) {
    const ref = variantByMoloni.get(p.product_id)
    if (!ref) continue
    if (withoutPriceSet.has(ref.variantId)) {
      if (ref.metadata?.excluded === true) {
        logger.warn(
          `[moloni-sync] excluded product ${p.product_id}: variant ${ref.variantId} has no price set; price-list prices skipped`
        )
      } else {
        report.priceListPrices.failed++
        onItemFailure(
          p.product_id,
          `variant ${ref.variantId} has no price set; price-list prices skipped`
        )
      }
      continue
    }
    for (const pc of p.price_classes ?? []) {
      const listId = listByClass.get(pc.price_class?.price_class_id)
      if (listId) push(p.product_id, listId, ref.variantId, Number(pc.value) || 0)
    }
    const cost = supplierCost(p)
    const costAmount = cost.cost_price_discounted ?? cost.cost_price
    if (costListId && costAmount != null) {
      push(p.product_id, costListId, ref.variantId, Number(costAmount) || 0)
    }
  }

  const write = async (
    entriesByList: Map<string, Entry[]>,
    run: (listId: string, prices: any[]) => Promise<unknown>,
    verb: string
  ) => {
    let ok = 0
    for (const [listId, entries] of entriesByList) {
      const r = await runInBatchesWithFallback(
        entries,
        200,
        (batch) => run(listId, batch.map((e) => e.data)),
        (e, batch) =>
          logger.warn(
            `[moloni-sync] price-list ${verb} batch of ${batch.length} failed (${errorMessage(e)}); retrying price by price`
          )
      )
      ok += r.succeeded.length
      for (const f of r.failed) {
        report.priceListPrices.failed++
        onItemFailure(f.item.moloniId, `price-list ${verb} failed: ${errorMessage(f.error)}`)
      }
    }
    return ok
  }

  report.priceListPrices.created += await write(
    toCreate,
    (listId, prices) =>
      createPriceListPricesWorkflow(container).run({
        input: { data: [{ id: listId, prices }] },
      }),
    "create"
  )
  report.priceListPrices.updated += await write(
    toUpdate,
    (listId, prices) =>
      updatePriceListPricesWorkflow(container).run({
        input: { data: [{ id: listId, prices }] },
      }),
    "update"
  )
  logger.info(
    `[moloni-sync] price-list prices created=${report.priceListPrices.created} updated=${report.priceListPrices.updated} failed=${report.priceListPrices.failed} lists=${report.priceListPrices.priceLists}`
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Stock
// ─────────────────────────────────────────────────────────────────────────
async function syncStock(
  container: MedusaContainer,
  query: any,
  products: MoloniProduct[],
  variantByMoloni: Map<number, ProductRef>,
  locationId: string,
  dryRun: boolean,
  report: MoloniSyncReport,
  logger: any,
  onItemFailure: ItemFailureHandler
) {
  // variant id -> inventory_item id
  const variantIds = [...variantByMoloni.values()].map((v) => v.variantId)
  const invItemByVariant = new Map<string, string>()
  for (const batch of chunk(variantIds, 100)) {
    const rows = await graphAll(
      query,
      "product_variant",
      ["id", "inventory_items.inventory.id"],
      { id: batch }
    )
    for (const v of rows) {
      const invId = v.inventory_items?.[0]?.inventory?.id
      if (invId) invItemByVariant.set(v.id, invId)
    }
  }

  // existing inventory levels at this location
  const levels = await graphAll(
    query,
    "inventory_level",
    ["id", "inventory_item_id", "location_id", "stocked_quantity"],
    { location_id: locationId }
  )
  const levelByItem = new Map<string, { id: string; stocked: number }>()
  for (const l of levels) {
    levelByItem.set(l.inventory_item_id, {
      id: l.id,
      stocked: l.stocked_quantity,
    })
  }

  type Entry = { moloniId: number; data: any }
  const toCreate: Entry[] = []
  const toUpdate: Entry[] = []
  for (const p of products) {
    const ref = variantByMoloni.get(p.product_id)
    if (!ref || p.has_stock !== 1) continue
    const invId = invItemByVariant.get(ref.variantId)
    if (!invId) {
      // Normally created by the products step (manage_inventory). Excluded
      // products are never updated, so theirs may legitimately be missing.
      if (ref.metadata?.excluded !== true) {
        report.stock.failed++
        onItemFailure(
          p.product_id,
          `variant ${ref.variantId} has no inventory item; stock skipped`
        )
      }
      continue
    }
    const stocked = Math.max(0, Math.round(totalStock(p)))
    const existing = levelByItem.get(invId)
    const data = {
      inventory_item_id: invId,
      location_id: locationId,
      stocked_quantity: stocked,
    }
    if (existing) {
      if (existing.stocked !== stocked) toUpdate.push({ moloniId: p.product_id, data })
    } else {
      toCreate.push({ moloniId: p.product_id, data })
    }
  }

  const write = async (
    entries: Entry[],
    run: (batch: any[]) => Promise<unknown>,
    verb: string
  ) => {
    if (dryRun) return entries.length
    const r = await runInBatchesWithFallback(
      entries,
      200,
      (batch) => run(batch.map((e) => e.data)),
      (e, batch) =>
        logger.warn(
          `[moloni-sync] stock ${verb} batch of ${batch.length} failed (${errorMessage(e)}); retrying item by item`
        )
    )
    for (const f of r.failed) {
      report.stock.failed++
      onItemFailure(f.item.moloniId, `stock ${verb} failed: ${errorMessage(f.error)}`)
    }
    return r.succeeded.length
  }

  report.stock.created += await write(
    toCreate,
    (batch) =>
      createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: batch },
      }),
    "create"
  )
  report.stock.updated += await write(
    toUpdate,
    (batch) =>
      updateInventoryLevelsWorkflow(container).run({
        input: { updates: batch } as any,
      }),
    "update"
  )
  logger.info(
    `[moloni-sync] stock created=${report.stock.created} updated=${report.stock.updated} failed=${report.stock.failed}`
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────────
async function syncCustomers(
  container: MedusaContainer,
  query: any,
  moloni: MoloniModuleService,
  since: string,
  limit: number | undefined,
  dryRun: boolean,
  report: MoloniSyncReport,
  logger: any
) {
  const moloniCustomers = await moloni.listCustomers({ since, limit })
  if (!moloniCustomers.length) {
    logger.info("[moloni-sync] no modified customers")
    return
  }

  // Existence is keyed on the authoritative moloni_customer_id (order-independent)
  // rather than email — email-based matching is fragile when collision-resolution
  // order differs between runs. Load existing customers once, mapping both by
  // Moloni id (update/create decision) and by email (collision detection when
  // minting an email for a NEW customer).
  const existingAll = await graphAll(query, "customer", [
    "id",
    "email",
    "metadata",
  ])
  const byMoloniId = new Map<number, { id: string; metadata: any }>()
  const emailOwner = new Map<string, number | null>() // email -> moloni id | null
  for (const r of existingAll) {
    const mid = r.metadata?.moloni_customer_id
    if (r.email) {
      emailOwner.set(r.email.toLowerCase(), mid != null ? Number(mid) : null)
    }
    if (mid != null) {
      byMoloniId.set(Number(mid), { id: r.id, metadata: r.metadata ?? {} })
    }
  }

  // Reserve a unique email for a NEW customer: its real email if free, else the
  // deterministic placeholder (falling back to the always-unique customer_id if
  // two Moloni customers ever share a number).
  const claimed = new Map<string, number>() // email -> moloni id that claimed it
  const reserveEmail = (c: MoloniCustomer) => {
    const real = realCustomerEmail(c)
    if (real) {
      const owner = emailOwner.get(real)
      const claimer = claimed.get(real)
      const free =
        (owner === undefined || owner === c.customer_id) &&
        (claimer === undefined || claimer === c.customer_id)
      if (free) {
        claimed.set(real, c.customer_id)
        return { finalEmail: real, noEmail: false, conflict: false, real }
      }
    }
    let ph = placeholderCustomerEmail(c)
    if (claimed.has(ph) && claimed.get(ph) !== c.customer_id) {
      ph = `moloni-${c.customer_id}@no-email.invalid`
    }
    claimed.set(ph, c.customer_id)
    return { finalEmail: ph, noEmail: !real, conflict: !!real, real }
  }

  const creates: { input: any; moloni: MoloniCustomer }[] = []
  for (const c of moloniCustomers) {
    const existing = byMoloniId.get(c.customer_id)
    if (existing) {
      // Keep the existing email (changing it risks collisions) and preserve its
      // email-related flags; refresh the mutable fields.
      if (!dryRun) {
        await updateCustomersWorkflow(container).run({
          input: {
            selector: { id: existing.id },
            update: {
              company_name: c.name || undefined,
              phone: c.phone || c.contact_phone || undefined,
              metadata: {
                ...existing.metadata,
                moloni_customer_id: c.customer_id,
                moloni_number: c.number,
                moloni_vat: c.vat || null,
              },
            },
          },
        })
      }
      report.customers.updated++
      continue
    }
    const r = reserveEmail(c)
    if (r.conflict) report.customers.emailConflicts++
    const input = toCustomerInput(c, r.finalEmail, {
      noEmail: r.noEmail,
      emailConflict: r.conflict,
      realEmail: r.conflict ? r.real : undefined,
    })
    creates.push({ input, moloni: c })
  }

  for (const batch of chunk(creates)) {
    if (!dryRun) {
      const { result } = await createCustomersWorkflow(container).run({
        input: { customersData: batch.map((b) => b.input) },
      })
      // Attach addresses for the freshly created customers.
      const addresses: any[] = []
      for (let i = 0; i < result.length; i++) {
        const addr = toCustomerAddress(batch[i].moloni)
        if (addr) addresses.push({ customer_id: result[i].id, ...addr })
      }
      if (addresses.length) {
        await createCustomerAddressesWorkflow(container).run({
          input: { addresses },
        })
      }
    }
    report.customers.created += batch.length
  }
  logger.info(
    `[moloni-sync] customers created=${report.customers.created} updated=${report.customers.updated} skipped=${report.customers.skipped} emailConflicts=${report.customers.emailConflicts} (conflicts imported under placeholder emails)`
  )
}
