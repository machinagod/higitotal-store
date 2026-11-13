import { SortOptions, sortProducts } from "./sort-products"

/** The minimum a product needs for listing order: id, image, sort keys. */
export type ListingIndexEntry = {
  id: string
  thumbnail?: string | null
  title?: string | null
  created_at?: string | Date | null
  variants?: any[] | null
}

/** True when a product has a usable thumbnail URL. */
export function hasThumbnail(p: { thumbnail?: string | null }): boolean {
  return typeof p.thumbnail === "string" && p.thumbnail.trim() !== ""
}

/**
 * Stable partition: products with a thumbnail first, then those without,
 * each group keeping its incoming order. A quarter of the catalogue has no
 * image yet, and a grid that opens on placeholders reads as broken.
 */
export function imagesFirst<T extends { thumbnail?: string | null }>(
  products: T[]
): T[] {
  const withImage: T[] = []
  const without: T[] = []
  for (const p of products) (hasThumbnail(p) ? withImage : without).push(p)
  return withImage.concat(without)
}

/**
 * Full listing order: the requested sort, then images-first on top of it.
 * Works on the lightweight index for the WHOLE filter set, so page N is a
 * slice of one global order (not a per-page reshuffle).
 */
export function orderListing<T extends ListingIndexEntry>(
  products: T[],
  sortBy: SortOptions,
  ids?: string[]
): T[] {
  return imagesFirst(sortProducts(products, sortBy, ids))
}

/** Ids for 1-based `page` of `limit` items from an ordered list. */
export function pageIds(
  ordered: { id: string }[],
  page: number,
  limit: number
): string[] {
  const p = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1
  const start = (p - 1) * limit
  return ordered.slice(start, start + limit).map((x) => x.id)
}

/**
 * Re-order a hydrated page to match `ids` (the list endpoint doesn't return
 * rows in the order of an `id` filter). Ids that didn't hydrate are dropped.
 */
export function inIdOrder<T extends { id?: string }>(
  products: T[],
  ids: string[]
): T[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is T => Boolean(p))
}

/** Number of index chunks needed for `count` rows at `chunk` per request. */
export function chunkCount(count: number, chunk: number, max: number): number {
  const capped = Math.min(Math.max(count, 0), max)
  return Math.max(1, Math.ceil(capped / chunk))
}
