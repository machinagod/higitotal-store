/**
 * Dependency-free fuzzy matcher for resolving a competitor listing to one of our
 * catalog products. Strategy, strongest first:
 *   1. EAN/GTIN exact         → method "ean",       score 100
 *   2. SKU / brand+reference  → method "sku"/"brand_ref", score ~95
 *   3. Token Dice-coefficient → method "fuzzy",     score 0..100 (title similarity)
 *
 * The score lets the caller auto-confirm above a threshold and queue the rest
 * for human review. Pure functions — the catalog is fed in by the caller so this
 * module stays decoupled from the product module.
 */

export type CatalogItem = {
  product_id: string
  variant_id?: string | null
  sku?: string | null
  ean?: string | null
  brand?: string | null
  title: string
}

export type Listing = {
  title?: string | null
  brand?: string | null
  sku?: string | null
  ean?: string | null
}

export type MatchCandidate = {
  product_id: string
  variant_id?: string | null
  sku?: string | null
  score: number // 0..100
  method: "ean" | "sku" | "brand_ref" | "fuzzy"
}

export function normalizeText(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const normRef = (s: string | null | undefined): string =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

/** Sørensen–Dice coefficient over character bigrams → 0..1. */
export function diceCoefficient(a: string, b: string): number {
  const x = normalizeText(a)
  const y = normalizeText(b)
  if (!x || !y) return 0
  if (x === y) return 1
  const bigrams = (s: string) => {
    const m = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2)
      m.set(g, (m.get(g) ?? 0) + 1)
    }
    return m
  }
  const ax = bigrams(x)
  const bx = bigrams(y)
  let overlap = 0
  let sizeA = 0
  let sizeB = 0
  for (const v of ax.values()) sizeA += v
  for (const [g, v] of bx) {
    sizeB += v
    overlap += Math.min(v, ax.get(g) ?? 0)
  }
  return (2 * overlap) / (sizeA + sizeB)
}

export function matchListing(
  listing: Listing,
  catalog: CatalogItem[]
): MatchCandidate | null {
  // 1. EAN exact.
  const ean = normRef(listing.ean)
  if (ean) {
    const hit = catalog.find((c) => normRef(c.ean) === ean)
    if (hit) return toCandidate(hit, 100, "ean")
  }

  // 2. SKU / reference exact (Moloni ref is the shared business identifier).
  const sku = normRef(listing.sku)
  if (sku) {
    const hit = catalog.find((c) => normRef(c.sku) === sku)
    if (hit) return toCandidate(hit, 96, "sku")
  }

  // 3. Brand + reference token inside the title (e.g. Vileda "V173433").
  const titleRef = normRef(listing.title)
  if (titleRef) {
    const hit = catalog.find((c) => {
      const ref = normRef(c.sku)
      return ref.length >= 4 && titleRef.includes(ref)
    })
    if (hit) return toCandidate(hit, 92, "brand_ref")
  }

  // 4. Fuzzy title similarity (optionally gated by matching brand).
  if (listing.title) {
    const wantBrand = normalizeText(listing.brand)
    let best: CatalogItem | null = null
    let bestScore = 0
    for (const c of catalog) {
      if (wantBrand && c.brand && normalizeText(c.brand) !== wantBrand) continue
      const score = diceCoefficient(listing.title, c.title)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    if (best && bestScore > 0) {
      return toCandidate(best, Math.round(bestScore * 100), "fuzzy")
    }
  }

  return null
}

function toCandidate(
  c: CatalogItem,
  score: number,
  method: MatchCandidate["method"]
): MatchCandidate {
  return {
    product_id: c.product_id,
    variant_id: c.variant_id ?? null,
    sku: c.sku ?? null,
    score,
    method,
  }
}
