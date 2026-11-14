/**
 * Pure SKU planning for the Moloni product sync (no I/O — unit-tested).
 *
 * Both Medusa product variants and inventory items carry a UNIQUE sku
 * (`IDX_product_variant_sku_unique`, `IDX_inventory_item_sku`), and Medusa does
 * not propagate a variant's sku change to its linked inventory item. When a
 * Moloni reference moves between products (A: RS0010 → RS0030 while B takes
 * RS0010), naive updates collide:
 *   - the stale inventory item of A still holds RS0010, so Medusa's implicit
 *     "create default inventory item" for B throws `Inventory item with sku:
 *     RS0010, already exists`;
 *   - within one run, B's variant may be written before A's releases the sku.
 *
 * `planProductSkuSync` works out, for a whole run, which skus must move where:
 *   1. variant renames that would collide are routed through a temporary sku
 *      (`<sku>__tmp_<id>`) so ANY permutation (swap, rotation, chain) applies
 *      in two collision-free phases;
 *   2. every inventory item is brought in line with its variant's (planned) sku
 *      — the same pass also self-heals drift left by earlier runs;
 *   3. a product whose sku is legitimately held by something that is not
 *      moving (a true duplicate reference in Moloni, an orphan inventory item…)
 *      is skipped with a reason instead of crashing the whole run.
 */

/** Something that currently holds `current` and should end up holding `target`. */
export interface RenameEntity {
  id: string
  current: string | null
  /** Desired sku; null/empty or equal to `current` = stays where it is. */
  target: string | null
}

/** A sku that will be taken by something that does not exist yet (a create). */
export interface RenameClaim {
  id: string
  sku: string
}

export interface RenamePlan {
  /** Phase 1: move these out of the way to a unique temporary sku. */
  temp: { id: string; sku: string }[]
  /** Phase 2: set the final sku (every target is free once phase 1 ran). */
  final: { id: string; sku: string }[]
  /** Entities/claims that cannot get their target, with the ids blocking them. */
  blocked: Map<string, { sku: string; by: string[] }>
}

export const TEMP_SKU_MARKER = "__tmp_"

/** Deterministic, unique (by id) temporary sku. */
export function tempSku(sku: string, id: string): string {
  return `${sku}${TEMP_SKU_MARKER}${id}`
}

const norm = (s: string | null | undefined): string | null =>
  s == null || s === "" ? null : s

/**
 * Plan collision-free renames for a set of unique-sku holders.
 *
 * A wanter (changing entity or claim) is blocked when its target is also
 * wanted by another active wanter (duplicate — all of them are blocked, never
 * an arbitrary winner), or is held by an entity that is not moving away
 * (unchanged, or itself blocked). Blocking cascades to a fixpoint. Entities
 * whose current sku is wanted by an active wanter go through a temp sku.
 */
export function planRenames(
  entities: RenameEntity[],
  claims: RenameClaim[] = []
): RenamePlan {
  type Wanter = { id: string; sku: string }
  const wanters: Wanter[] = []
  const changing = new Map<string, { current: string | null; target: string }>()
  const holders = new Map<string, string[]>()

  for (const e of entities) {
    const current = norm(e.current)
    const target = norm(e.target)
    if (current) {
      const list = holders.get(current) ?? []
      list.push(e.id)
      holders.set(current, list)
    }
    if (target && target !== current) {
      changing.set(e.id, { current, target })
      wanters.push({ id: e.id, sku: target })
    }
  }
  for (const c of claims) {
    const sku = norm(c.sku)
    if (sku) wanters.push({ id: c.id, sku })
  }

  const blocked = new Map<string, { sku: string; by: string[] }>()
  // Each pass decides from the state at the START of the pass, so the result
  // does not depend on input order. Blocking only grows → terminates.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const active = wanters.filter((w) => !blocked.has(w.id))
    const bySku = new Map<string, string[]>()
    for (const w of active) {
      const list = bySku.get(w.sku) ?? []
      list.push(w.id)
      bySku.set(w.sku, list)
    }
    const newly: [string, { sku: string; by: string[] }][] = []
    for (const w of active) {
      const by = (bySku.get(w.sku) ?? []).filter((id) => id !== w.id)
      for (const h of holders.get(w.sku) ?? []) {
        if (h === w.id) continue
        const movingAway = changing.has(h) && !blocked.has(h)
        if (!movingAway) by.push(h)
      }
      if (by.length) newly.push([w.id, { sku: w.sku, by }])
    }
    if (!newly.length) break
    for (const [id, b] of newly) blocked.set(id, b)
  }

  const wantedSkus = new Set(
    wanters.filter((w) => !blocked.has(w.id)).map((w) => w.sku)
  )
  const temp: RenamePlan["temp"] = []
  const final: RenamePlan["final"] = []
  for (const [id, { current, target }] of changing) {
    if (blocked.has(id)) continue
    if (current && wantedSkus.has(current)) {
      temp.push({ id, sku: tempSku(current, id) })
    }
    final.push({ id, sku: target })
  }
  return { temp, final, blocked }
}

// ─────────────────────────────────────────────────────────────────────────
// Product-level planning
// ─────────────────────────────────────────────────────────────────────────

/** Current state of one Medusa variant (ALL variants, not only this run's). */
export interface VariantState {
  variantId: string
  /** Moloni product id (product.external_id), null for non-Moloni products. */
  moloniId: number | null
  sku: string | null
  /** Linked inventory items. */
  items: { id: string; sku: string | null }[]
}

/** What this run wants for one Moloni product. */
export interface PlannedProduct {
  moloniId: number
  /** Existing variant being updated; undefined = product will be created. */
  variantId?: string
  sku: string
  manageInventory: boolean
}

/** Inventory item holding a relevant sku but linked to no (live) variant. */
export interface OrphanItem {
  id: string
  sku: string | null
}

export interface SkippedProduct {
  sku: string
  reason: string
  /** Moloni ids of the products holding/competing for the sku (if any). */
  otherMoloniIds: number[]
}

export interface ItemRename {
  id: string
  sku: string
  /** The variant the item follows (for the title / logging). */
  variantId: string
  moloniId: number | null
  from: string | null
}

export interface ProductSkuPlan {
  /** Products to leave alone this run (moloni id → why). */
  skipped: Map<number, SkippedProduct>
  /** Phase-1 variant moves to temp skus (only in-run variants that block others). */
  variantTemp: { id: string; sku: string }[]
  /** Phase-1 inventory item moves to temp skus. */
  itemTemp: { id: string; sku: string }[]
  /** Phase-2 inventory item renames (in-run planned sku, or reconcile drift). */
  itemFinal: ItemRename[]
  /** Items whose drift cannot be fixed now (warnings, product not skipped). */
  itemBlocked: { id: string; sku: string; reason: string }[]
}

const CREATE_PREFIX = "create:"
const VARIANT_PREFIX = "variant:"

/**
 * Plan every sku movement for one sync run. Products blocked at the variant
 * level (their sku is held by a variant that is not moving) or whose implicit
 * inventory-item creation would collide are skipped; skipping a product pins
 * its variant to its current sku, which can block others, so the plan is
 * recomputed until no new product is skipped.
 */
export function planProductSkuSync(input: {
  variants: VariantState[]
  planned: PlannedProduct[]
  orphanItems?: OrphanItem[]
}): ProductSkuPlan {
  const { variants, planned } = input
  const orphanItems = input.orphanItems ?? []
  const variantById = new Map(variants.map((v) => [v.variantId, v]))

  // item id → its sku and the variants linking to it
  const itemInfo = new Map<string, { sku: string | null; variantIds: string[] }>()
  for (const v of variants) {
    for (const it of v.items) {
      const info = itemInfo.get(it.id) ?? { sku: it.sku, variantIds: [] }
      info.variantIds.push(v.variantId)
      itemInfo.set(it.id, info)
    }
  }
  const orphanById = new Map(
    orphanItems.filter((o) => !itemInfo.has(o.id)).map((o) => [o.id, o])
  )

  const describeVariant = (id: string): { text: string; moloniId: number | null } => {
    const v = variantById.get(id)
    if (!v) return { text: `variant ${id}`, moloniId: null }
    return v.moloniId != null
      ? { text: `Moloni product ${v.moloniId} (variant ${id})`, moloniId: v.moloniId }
      : { text: `non-Moloni variant ${id}`, moloniId: null }
  }
  const describeWanter = (
    id: string
  ): { text: string; moloniId: number | null } => {
    if (id.startsWith(CREATE_PREFIX)) {
      const mid = Number(id.slice(CREATE_PREFIX.length))
      return { text: `new Moloni product ${mid}`, moloniId: mid }
    }
    if (id.startsWith(VARIANT_PREFIX)) {
      return describeVariant(id.slice(VARIANT_PREFIX.length))
    }
    return describeVariant(id)
  }
  const describeItem = (id: string): { text: string; moloniIds: number[] } => {
    // Defensive: two item-level claims for one sku imply two variants with that
    // sku, which the variant-level pass already blocks.
    /* istanbul ignore if */
    if (id.startsWith(CREATE_PREFIX) || id.startsWith(VARIANT_PREFIX)) {
      const d = describeWanter(id)
      return {
        text: `the new inventory item of ${d.text}`,
        moloniIds: d.moloniId != null ? [d.moloniId] : [],
      }
    }
    const info = itemInfo.get(id)
    if (!info) return { text: `unlinked inventory item ${id}`, moloniIds: [] }
    const owners = info.variantIds.map(describeVariant)
    return {
      text: `inventory item ${id} of ${owners.map((o) => o.text).join(", ")}`,
      moloniIds: owners
        .map((o) => o.moloniId)
        .filter((m): m is number => m != null),
    }
  }

  const skipped = new Map<number, SkippedProduct>()
  // Each iteration skips ≥1 more product or returns, so this is bounded.
  for (let iter = 0; iter <= planned.length; iter++) {
    const active = planned.filter((p) => !skipped.has(p.moloniId))
    const plannedByVariant = new Map<string, PlannedProduct>()
    for (const p of active) if (p.variantId) plannedByVariant.set(p.variantId, p)

    // ── variants ──
    const vplan = planRenames(
      variants.map((v) => ({
        id: v.variantId,
        current: v.sku,
        target: plannedByVariant.get(v.variantId)?.sku ?? v.sku,
      })),
      active
        .filter((p) => !p.variantId)
        .map((p) => ({ id: `${CREATE_PREFIX}${p.moloniId}`, sku: p.sku }))
    )
    // The in-run Moloni product behind a wanter id (claims or planned variants).
    const plannedMoloniId = (id: string): number | undefined => {
      if (id.startsWith(CREATE_PREFIX)) return Number(id.slice(CREATE_PREFIX.length))
      const variantId = id.startsWith(VARIANT_PREFIX)
        ? id.slice(VARIANT_PREFIX.length)
        : id
      return plannedByVariant.get(variantId)?.moloniId
    }

    const newSkips = new Map<number, SkippedProduct>()
    for (const [id, b] of vplan.blocked) {
      const mid = plannedMoloniId(id)
      /* istanbul ignore if -- only in-run products' variants ever want a new sku */
      if (mid === undefined) continue
      const others = b.by.map(describeWanter)
      newSkips.set(mid, {
        sku: b.sku,
        reason: `sku ${b.sku} is already used by ${others
          .map((o) => o.text)
          .join(", ")}`,
        otherMoloniIds: others
          .map((o) => o.moloniId)
          .filter((m): m is number => m != null),
      })
    }

    // Final variant sku after this run (blocked variants stay put).
    const finalVariantSku = (v: VariantState): string | null => {
      const p = plannedByVariant.get(v.variantId)
      if (p && !vplan.blocked.has(v.variantId)) return p.sku
      return v.sku
    }

    // ── inventory items ──
    // An item follows its variant's sku only when the link is 1:1; kits /
    // shared items are left alone (no single correct sku).
    const itemEntities: RenameEntity[] = []
    const itemVariant = new Map<string, VariantState>()
    for (const [itemId, info] of itemInfo) {
      let target: string | null = info.sku
      if (info.variantIds.length === 1) {
        const v = variantById.get(info.variantIds[0])!
        if (v.items.length === 1) {
          target = finalVariantSku(v) ?? info.sku
          itemVariant.set(itemId, v)
        }
      }
      itemEntities.push({ id: itemId, current: info.sku, target })
    }
    for (const o of orphanById.values()) {
      itemEntities.push({ id: o.id, current: o.sku, target: o.sku })
    }
    const itemClaims: RenameClaim[] = []
    for (const p of active) {
      if (!p.manageInventory) continue
      if (!p.variantId) {
        if (!vplan.blocked.has(`${CREATE_PREFIX}${p.moloniId}`)) {
          itemClaims.push({ id: `${CREATE_PREFIX}${p.moloniId}`, sku: p.sku })
        }
        continue
      }
      const v = variantById.get(p.variantId)
      if (v && v.items.length === 0 && !vplan.blocked.has(p.variantId)) {
        itemClaims.push({ id: `${VARIANT_PREFIX}${p.variantId}`, sku: p.sku })
      }
    }
    const iplan = planRenames(itemEntities, itemClaims)

    const itemBlocked: ProductSkuPlan["itemBlocked"] = []
    for (const [id, b] of iplan.blocked) {
      const others = b.by.map(describeItem)
      if (id.startsWith(CREATE_PREFIX) || id.startsWith(VARIANT_PREFIX)) {
        // Medusa would try to create an inventory item with a taken sku → skip.
        const mid = plannedMoloniId(id)
        /* istanbul ignore if -- claims are only made for in-run products */
        if (mid === undefined || newSkips.has(mid)) continue
        newSkips.set(mid, {
          sku: b.sku,
          reason: `its inventory item sku ${b.sku} is already used by ${others
            .map((o) => o.text)
            .join(", ")}`,
          otherMoloniIds: others.flatMap((o) => o.moloniIds),
        })
      } else {
        itemBlocked.push({
          id,
          sku: b.sku,
          reason: `cannot rename ${describeItem(id).text} to ${b.sku}: already used by ${others
            .map((o) => o.text)
            .join(", ")}`,
        })
      }
    }

    if (newSkips.size) {
      for (const [mid, s] of newSkips) skipped.set(mid, s)
      continue
    }

    return {
      skipped,
      variantTemp: vplan.temp.filter((t) => plannedByVariant.has(t.id)),
      itemTemp: iplan.temp,
      itemFinal: iplan.final.map((f) => {
        const v = itemVariant.get(f.id)!
        return {
          id: f.id,
          sku: f.sku,
          variantId: v.variantId,
          moloniId: v.moloniId,
          from: itemInfo.get(f.id)?.sku ?? null,
        }
      }),
      itemBlocked,
    }
  }
  /* istanbul ignore next -- unreachable: each loop iteration skips ≥1 product */
  throw new Error("planProductSkuSync did not converge")
}
