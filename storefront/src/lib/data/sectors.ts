import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

import { BRANDS, brandHref } from "@lib/brands"
import {
  collectCategoryIds,
  getCategoryByHandle,
  getNavGroups,
  listCategories,
  preferCurated,
} from "@lib/data/categories"
import { getProductsList } from "@lib/data/products"
import { isInternalCategory } from "@lib/util/category-display"

/**
 * Live category handles (internal bookkeeping groups excluded), or undefined
 * when the backend is unreachable — callers then trust the static config.
 */
export const getLiveCategoryHandles = cache(async function (): Promise<
  Set<string> | undefined
> {
  try {
    const all = await listCategories()
    if (!all?.length) return undefined
    return new Set(
      all
        .filter((c: any) => c?.handle && !isInternalCategory(c.name))
        .map((c: any) => c.handle as string)
    )
  } catch {
    return undefined
  }
})

/**
 * Brand name → landing page, exactly as the header/footer "Marcas" links
 * resolve it (so sector pages follow wherever brand pages live). Falls back
 * to the static `brandHref` when the live nav cannot be fetched.
 */
export const getBrandLinks = cache(async function (): Promise<
  Map<string, string>
> {
  const out = new Map<string, string>(
    BRANDS.map((b) => [b.name, brandHref(b)])
  )
  try {
    const { brands } = await getNavGroups()
    for (const link of brands) out.set(link.label, link.href)
  } catch {
    // keep the static fallbacks
  }
  return out
})

/**
 * Up to `count` photographed products for a sector strip, drawn round-robin
 * from its categories (each with its sub-categories) so the strip mixes
 * product lines instead of showing one range. Products in curated
 * collections come first within each category. Fails soft per category.
 */
export const getSectorProducts = cache(async function (
  handles: string[],
  countryCode: string,
  count: number = 8
): Promise<HttpTypes.StoreProduct[]> {
  const pools = await Promise.all(
    handles.map(async (handle) => {
      try {
        const { product_categories } = await getCategoryByHandle([handle])
        const ids = collectCategoryIds(product_categories?.[0])
        if (!ids.length) return []
        const {
          response: { products },
        } = await getProductsList({
          queryParams: { category_id: ids, limit: 24 },
          countryCode,
        })
        return preferCurated(products).filter((p) => p.thumbnail)
      } catch {
        return [] as HttpTypes.StoreProduct[]
      }
    })
  )

  const picked: HttpTypes.StoreProduct[] = []
  const seen = new Set<string>()
  const longest = Math.max(0, ...pools.map((p) => p.length))
  for (let i = 0; i < longest && picked.length < count; i++) {
    for (const pool of pools) {
      const p = pool[i]
      if (p && !seen.has(p.id) && picked.length < count) {
        seen.add(p.id)
        picked.push(p)
      }
    }
  }

  // Full rows only (4 per row on desktop, 2 on mobile).
  return picked.length >= 4
    ? picked.slice(0, picked.length - (picked.length % 4))
    : picked
})
