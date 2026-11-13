import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
import { SortOptions, isPriceSort, resolveSort } from "@lib/util/sort-products"
import {
  ListingIndexEntry,
  chunkCount,
  inIdOrder,
  orderListing,
  pageIds,
} from "@lib/util/listing-order"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { stripVariantPrices } from "@lib/util/strip-variant-prices"
import { stripSensitiveMetadata } from "@lib/util/strip-sensitive-metadata"

/**
 * In catalog mode, drop the computed prices from product payloads before they
 * reach any component — client components serialize their props into the page
 * (RSC payload), so hiding the price in the UI alone would still leak it in the
 * page source.
 */
function withoutPricesInCatalogMode<T extends HttpTypes.StoreProduct>(
  products: T[]
): T[] {
  // Cost/supplier metadata is never for shoppers, catalog mode or not.
  const safe = stripSensitiveMetadata(products)
  return isCatalogMode() ? stripVariantPrices(safe) : safe
}

export const getProductsById = cache(async function ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) {
  return sdk.store.product
    .list(
      {
        id: ids,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products }) => withoutPricesInCatalogMode(products))
})

export const getProductByHandle = cache(async function (
  handle: string,
  regionId: string
) {
  return sdk.store.product
    .list(
      {
        handle,
        region_id: regionId,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,+metadata,*categories,*categories.parent_category",
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products }) => withoutPricesInCatalogMode(products)[0])
})

export type ProductHighlight = { id: string; value: string; rank: number }
export type ProductSpec = {
  id: string
  label: string | null
  value: string
  unit: string | null
  rank: number
}

/**
 * Amazon-style product characteristics from the custom `product_attributes`
 * module (store route GET /store/products/:id/attributes). `sdk.client.fetch`
 * adds the publishable key + backend URL automatically. Fails soft to empty.
 */
export const getProductAttributes = cache(async function (productId: string) {
  return sdk.client
    .fetch<{ highlights: ProductHighlight[]; specs: ProductSpec[] }>(
      `/store/products/${productId}/attributes`,
      { next: { tags: ["products"] } }
    )
    .catch(() => ({ highlights: [], specs: [] }))
})

export type BoughtTogetherPair = {
  id: string
  productId1: string
  productId2: string
  frequency: number
}

/**
 * Frequently-bought-together pairs from the
 * `@rsc-labs/medusa-products-bought-together-v2` plugin (store route
 * GET /store/products-bought-together/:id). Returns a raw array of pairs ordered by
 * co-purchase frequency. `sdk.client.fetch` adds the publishable key + backend URL.
 * Fails soft to [] so the PDP can fall back to collection-based suggestions.
 */
export const getBoughtTogether = cache(async function (productId: string) {
  return sdk.client
    .fetch<BoughtTogetherPair[]>(`/store/products-bought-together/${productId}`, {
      next: { tags: ["products"] },
    })
    .catch(() => [] as BoughtTogetherPair[])
})

export const getProductsList = cache(async function ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: HttpTypes.StoreProductListParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.StoreProductListParams
}> {
  const limit = queryParams?.limit || 12
  const validPageParam = Math.max(pageParam, 1);
  const offset = (validPageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
  return sdk.store.product
    .list(
      {
        limit,
        offset,
        region_id: region.id,
        fields: "*variants.calculated_price",
        ...queryParams,
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products: withoutPricesInCatalogMode(products),
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
})

/**
 * Fields a product card needs: prices + stock for the non-catalog footer,
 * categories (+ parent) for the card eyebrow. Cards rendered from these rows
 * don't need a per-card re-fetch.
 */
export const LISTING_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*categories,*categories.parent_category"

/** Rows per lightweight index request, and the most rows we will index. */
const INDEX_CHUNK = 1000
const INDEX_MAX = 5000

/**
 * Lightweight index (id, thumbnail, sort keys) of EVERY product matching the
 * filters, so listings can be ordered globally — images first, then the chosen
 * sort — before a page is cut. One request covers up to {@link INDEX_CHUNK}
 * products (the whole catalogue is ~1k); larger sets fetch the remaining chunks
 * in parallel, capped at {@link INDEX_MAX} rows.
 */
const getListingIndex = cache(async function ({
  filters,
  regionId,
  withPrices,
}: {
  filters: HttpTypes.StoreProductListParams
  regionId: string
  withPrices: boolean
}): Promise<{ entries: ListingIndexEntry[]; count: number }> {
  const fields = [
    "id",
    "thumbnail",
    "title",
    "created_at",
    withPrices ? "*variants.calculated_price" : null,
  ]
    .filter(Boolean)
    .join(",")

  const fetchChunk = (offset: number) =>
    sdk.store.product.list(
      {
        ...filters,
        region_id: regionId,
        fields,
        // A stable order so chunks don't overlap or skip rows.
        order: "-created_at",
        limit: INDEX_CHUNK,
        offset,
      },
      { next: { tags: ["products"] } }
    )

  const first = await fetchChunk(0)
  const chunks = chunkCount(first.count, INDEX_CHUNK, INDEX_MAX)
  const rest = await Promise.all(
    Array.from({ length: chunks - 1 }, (_, i) => fetchChunk((i + 1) * INDEX_CHUNK))
  )

  const seen = new Set<string>()
  const entries: ListingIndexEntry[] = []
  for (const row of [first, ...rest].flatMap((r) => r.products)) {
    if (!row.id || seen.has(row.id)) continue
    seen.add(row.id)
    entries.push(row as ListingIndexEntry)
  }

  return { entries, count: first.count }
})

/**
 * A page of a product listing (store, category, collection, search results).
 *
 * Order: the requested sort (`created_at`, `name_asc`, price, or search
 * `relevance`), then products WITH an image ahead of those without — applied
 * to the whole filter set via {@link getListingIndex}, so page 2 continues
 * page 1's order. The page's ids are then hydrated in one request with the
 * card fields ({@link LISTING_FIELDS}). Price sorts are ignored in catalog mode.
 */
export const getProductsListWithSort = cache(async function ({
  page = 1,
  queryParams,
  sortBy,
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.StoreProductListParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.StoreProductListParams
}> {
  const limit = queryParams?.limit || 12
  const region = await getRegion(countryCode)

  if (!region) {
    return { response: { products: [], count: 0 }, nextPage: null }
  }

  const {
    limit: _limit,
    offset: _offset,
    order: _order,
    fields: _fields,
    ...filters
  } = queryParams ?? {}

  const searchIds = Array.isArray(filters.id)
    ? (filters.id as string[])
    : undefined
  const sort = resolveSort(sortBy, {
    catalogMode: isCatalogMode(),
    hasIds: Boolean(searchIds?.length),
  })

  const { entries, count } = await getListingIndex({
    filters,
    regionId: region.id,
    withPrices: isPriceSort(sort),
  })

  const ordered = orderListing(entries, sort, searchIds)
  const ids = pageIds(ordered, page, limit)
  const nextPage = ordered.length > page * limit ? page + 1 : null

  if (!ids.length) {
    return { response: { products: [], count }, nextPage, queryParams }
  }

  const { products } = await sdk.store.product.list(
    {
      id: ids,
      region_id: region.id,
      fields: LISTING_FIELDS,
      limit: ids.length,
    },
    { next: { tags: ["products"] } }
  )

  return {
    response: {
      products: inIdOrder(withoutPricesInCatalogMode(products), ids),
      count,
    },
    nextPage,
    queryParams,
  }
})

