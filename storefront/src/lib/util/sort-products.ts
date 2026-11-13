import { HttpTypes } from "@medusajs/types"

/**
 * Listing sort orders.
 * - `created_at` — newest first ("Mais recentes"; the default with prices)
 * - `name_asc`   — title A–Z, pt-PT collation ("Nome (A–Z)"; the default in
 *                  catalog mode — B2B buyers scan for a product they know)
 * - `price_asc` / `price_desc` — cheapest variant price (never in catalog mode)
 * - `relevance`  — keep the order the ids were given in (search results)
 */
export type SortOptions =
  | "created_at"
  | "name_asc"
  | "price_asc"
  | "price_desc"
  | "relevance"

const SORT_OPTIONS: readonly SortOptions[] = [
  "created_at",
  "name_asc",
  "price_asc",
  "price_desc",
  "relevance",
]

const PRICE_SORTS: readonly SortOptions[] = ["price_asc", "price_desc"]

export function isPriceSort(sortBy: SortOptions): boolean {
  return PRICE_SORTS.includes(sortBy)
}

/**
 * The order a listing opens in when `?sortBy=` is absent: A–Z in catalog mode
 * (no prices to compare, so "newest" means little to a buyer), newest first
 * otherwise. Search results (an explicit id list) always open by relevance.
 */
export function defaultSort({
  catalogMode,
  hasIds = false,
}: {
  catalogMode: boolean
  hasIds?: boolean
}): SortOptions {
  if (hasIds) return "relevance"
  return catalogMode ? "name_asc" : "created_at"
}

/**
 * Normalise a `?sortBy=` value into a sort the current listing can honour:
 * unknown values fall back to the default ({@link defaultSort}), price sorts
 * are dropped in catalog mode (there are no prices), and `relevance` only makes
 * sense for an explicit id list (search results), which also defaults to it.
 */
export function resolveSort(
  sortBy: string | null | undefined,
  { catalogMode, hasIds }: { catalogMode: boolean; hasIds: boolean }
): SortOptions {
  const fallback = defaultSort({ catalogMode, hasIds })
  const s = SORT_OPTIONS.find((o) => o === sortBy)
  if (!s) return fallback
  if (catalogMode && isPriceSort(s)) return fallback
  if (s === "relevance" && !hasIds) return defaultSort({ catalogMode })
  return s
}

/** The fields the sorts read (a full StoreProduct or a lightweight row). */
type SortableProduct = {
  id?: string
  title?: string | null
  created_at?: string | Date | null
  variants?:
    | {
        calculated_price?: Pick<
          NonNullable<HttpTypes.StoreProductVariant["calculated_price"]>,
          "calculated_amount"
        > | null
      }[]
    | null
}

const nameCollator = new Intl.Collator("pt-PT", {
  sensitivity: "base",
  numeric: true,
})

function minPrice(product: SortableProduct): number {
  const amounts = (product.variants ?? [])
    .map((v) => v?.calculated_price?.calculated_amount)
    .filter((a): a is number => typeof a === "number")
  // Unpriced products sink to the end in both directions.
  return amounts.length ? Math.min(...amounts) : NaN
}

/**
 * Sort products in memory (the Store API can't sort by price or collate
 * Portuguese titles). Returns a new array; the input is not mutated. The sort
 * is stable, so ties keep their incoming order.
 *
 * @param ids for `relevance`: the order to follow (ids not listed go last).
 */
export function sortProducts<T extends SortableProduct>(
  products: T[],
  sortBy: SortOptions,
  ids?: string[]
): T[] {
  const sorted = [...products]

  if (isPriceSort(sortBy)) {
    const prices = new Map(sorted.map((p) => [p, minPrice(p)]))
    sorted.sort((a, b) => {
      const pa = prices.get(a)!
      const pb = prices.get(b)!
      if (Number.isNaN(pa) || Number.isNaN(pb)) {
        return Number(Number.isNaN(pa)) - Number(Number.isNaN(pb))
      }
      return sortBy === "price_asc" ? pa - pb : pb - pa
    })
  } else if (sortBy === "name_asc") {
    sorted.sort((a, b) => nameCollator.compare(a.title ?? "", b.title ?? ""))
  } else if (sortBy === "created_at") {
    const t = (p: T) => (p.created_at ? new Date(p.created_at).getTime() : 0)
    sorted.sort((a, b) => t(b) - t(a))
  } else if (sortBy === "relevance" && ids?.length) {
    const rank = new Map(ids.map((id, i) => [id, i]))
    const r = (p: T) => rank.get(p.id ?? "") ?? Number.MAX_SAFE_INTEGER
    sorted.sort((a, b) => r(a) - r(b))
  }

  return sorted
}
