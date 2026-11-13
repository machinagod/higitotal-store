import { getRegion } from "@lib/data/regions"
import {
  LISTING_FIELDS,
  getComplementCandidates,
  getProductsList,
} from "@lib/data/products"
import { rankSuggestions } from "@lib/util/complements"
import { HttpTypes } from "@medusajs/types"
import ProductRail from "./rail"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const RELATED_LIMIT = 4

/**
 * "Também lhe pode interessar" — products from complementary categories
 * (paper ↔ dispensers, detergents ↔ doseadores), then the same category /
 * family, then the same collection or tags; photos first within each step
 * (`rankSuggestions` in @lib/util/complements).
 */
export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  // Same collection and/or sharing a tag — only when there is such a link;
  // an unfiltered list would just be "any products".
  const tagIds = (product.tags ?? []).map((t) => t.id).filter(Boolean)
  const byCollectionOrTag =
    product.collection_id || tagIds.length
      ? getProductsList({
          queryParams: {
            region_id: region.id,
            is_giftcard: false,
            // Over-fetch so the ranking has something to choose from.
            limit: 12,
            fields: LISTING_FIELDS,
            ...(product.collection_id
              ? { collection_id: [product.collection_id] }
              : {}),
            // The Store API filters tags by id (`tag_id`); the list endpoint is
            // strict, so an unknown `tags` param would fail with a 400.
            ...(tagIds.length ? { tag_id: tagIds } : {}),
          },
          countryCode,
        })
          .then(({ response }) => response.products)
          .catch(() => [] as HttpTypes.StoreProduct[])
      : Promise.resolve([] as HttpTypes.StoreProduct[])

  const [categoryCandidates, linked] = await Promise.all([
    getComplementCandidates({ product, countryCode, sameCategory: true }),
    byCollectionOrTag,
  ])

  const products = rankSuggestions(product, [
    ...categoryCandidates,
    ...linked,
  ]).slice(0, RELATED_LIMIT)

  return (
    <ProductRail
      eyebrow="Sugestões"
      title="Também lhe pode interessar"
      products={products}
      region={region}
      data-testid="related-products"
    />
  )
}
