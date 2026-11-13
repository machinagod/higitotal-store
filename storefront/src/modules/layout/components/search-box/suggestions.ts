import { displayCategoryName } from "@lib/util/category-display"

/**
 * Pure helpers behind the header search suggestions (kept out of the client
 * component so they can be unit-tested).
 */

export type SearchCategory = {
  name: string
  handle: string
  type: "category" | "subcategory"
  parent?: string
}

export type SearchBrand = { name: string; href: string }

export type ProductHit = {
  id: string
  title: string
  handle: string
  thumbnail?: string
  sku?: string
  category?: string
}

/** Lower-case + strip accents so "assistencia" matches "Assistência". */
export const normalize = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")

/** Minimum query length before suggesting anything. */
export const MIN_QUERY = 2

/** Items whose `name` (or any keyword) contains the query, accent-insensitive. */
export function matchByName<T extends { name: string; keywords?: string[] }>(
  items: T[],
  query: string,
  limit: number
): T[] {
  const needle = normalize(query.trim())
  if (needle.length < MIN_QUERY) return []
  return items
    .filter(
      (i) =>
        normalize(i.name).includes(needle) ||
        (i.keywords || []).some((k) => normalize(k).includes(needle))
    )
    .slice(0, limit)
}

/**
 * A search hit as returned by `POST /store/search` (Medusa Search Module):
 * the reference lives on `variants[].sku`; older Meilisearch documents used a
 * flat `variant_sku`. Categories come as `{ name, handle }`.
 */
export function toProductHit(h: any): ProductHit {
  const variantSku = Array.isArray(h?.variants)
    ? h.variants.map((v: any) => v?.sku).find(Boolean)
    : undefined
  const flatSku = Array.isArray(h?.variant_sku)
    ? h.variant_sku[0]
    : h?.variant_sku
  const category = Array.isArray(h?.categories)
    ? h.categories.map((c: any) => c?.name).find(Boolean)
    : undefined
  return {
    id: h?.id || h?.objectID,
    title: h?.title ?? "",
    handle: h?.handle ?? "",
    thumbnail: h?.thumbnail || undefined,
    sku: variantSku || flatSku || undefined,
    category: category ? displayCategoryName(category) : undefined,
  }
}

/**
 * Next active option for ArrowDown (+1) / ArrowUp (-1), wrapping around;
 * from "nothing active" (-1), Down goes to the first and Up to the last.
 */
export function moveActive(current: number, delta: 1 | -1, count: number): number {
  if (count <= 0) return -1
  if (current < 0) return delta > 0 ? 0 : count - 1
  return (current + delta + count) % count
}
