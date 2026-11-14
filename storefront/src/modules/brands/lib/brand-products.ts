import { HttpTypes } from "@medusajs/types"

import { hitMentionsBrand, type BrandSearchHit } from "@lib/brand-pages"
import { brandListing, type Brand, type BrandListing } from "@lib/brands"
import {
  collectCategoryIds,
  getBrandListing,
  getCategoryByHandle,
} from "@lib/data/categories"
import { getCollectionByHandle } from "@lib/data/collections"
import { search } from "@modules/search/actions"

/** Most search hits a brand page lists (the backend caps `take` at 100). */
const MAX_SEARCH_HITS = 100

/** A brand page's product source, resolved against the live catalogue. */
export type BrandProducts =
  | {
      kind: "category"
      listing: BrandListing
      category: HttpTypes.StoreProductCategory
      categoryIds: string[]
    }
  | {
      kind: "collection"
      listing: BrandListing
      collection: HttpTypes.StoreCollection
    }
  | { kind: "search"; listing: BrandListing; productIds: string[] }

/**
 * Where a brand page takes its products from — the same listing the brand
 * links used to open (`brandListing`: category with sub-ranges → collection →
 * category → search). A category/collection that has gone missing falls back
 * to the search. Search hits are kept only when they really name the brand
 * (search is typo-tolerant). Fails soft: worst case an empty search.
 */
export async function resolveBrandProducts(brand: Brand): Promise<BrandProducts> {
  const listing = await getBrandListing(brand).catch(() => brandListing(brand))

  if (listing.kind === "category") {
    const category = await getCategoryByHandle([listing.handle])
      .then((r) => r.product_categories?.[0])
      .catch(() => undefined)
    if (category) {
      return {
        kind: "category",
        listing,
        category,
        categoryIds: collectCategoryIds(category),
      }
    }
  }

  if (listing.kind === "collection") {
    const collection = await getCollectionByHandle(listing.handle).catch(
      () => undefined
    )
    if (collection?.id) return { kind: "collection", listing, collection }
  }

  const fallback =
    listing.kind === "search" ? listing : brandListing({ name: brand.name })
  const hits = await search(brand.name, MAX_SEARCH_HITS)
    .catch(() => search(brand.name))
    .catch(() => [])
  const productIds = (hits as (BrandSearchHit & { id?: string; objectID?: string })[])
    .filter((h) => hitMentionsBrand(brand, h))
    .map((h) => h.objectID || h.id)
    .filter((id): id is string => typeof id === "string")

  return { kind: "search", listing: fallback, productIds }
}
