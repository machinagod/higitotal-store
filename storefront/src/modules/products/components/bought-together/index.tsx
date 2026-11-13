import RelatedProducts from "../related-products"
import ProductRail from "../related-products/rail"
import { getRegion } from "@lib/data/regions"
import {
  LISTING_FIELDS,
  getBoughtTogether,
  getProductsList,
} from "@lib/data/products"
import { imagesFirst, inIdOrder } from "@lib/util/listing-order"
import { HttpTypes } from "@medusajs/types"

type BoughtTogetherProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

// How many partners to show, and how wide to cast the net before availability filtering.
const BOUGHT_TOGETHER_LIMIT = 4
const CANDIDATE_LIMIT = 12

/**
 * "Complementos habituais" — real co-purchase recommendations from the
 * bought-together plugin (seeded from Moloni sales history, then self-maintaining
 * from live orders). Falls back to the collection/tags `RelatedProducts` rail when
 * a product has no co-purchase data yet (cold start) or none of its partners are
 * currently available in this region.
 */
export default async function BoughtTogether({
  product,
  countryCode,
}: BoughtTogetherProps) {
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const pairs = await getBoughtTogether(product.id)

  // Rank partner products by co-purchase frequency, de-duplicated.
  const ranked = new Map<string, number>()
  for (const pair of pairs) {
    const partnerId =
      pair.productId1 === product.id ? pair.productId2 : pair.productId1
    if (!partnerId || partnerId === product.id) {
      continue
    }
    if (!ranked.has(partnerId) || pair.frequency > (ranked.get(partnerId) ?? 0)) {
      ranked.set(partnerId, pair.frequency)
    }
  }

  const candidateIds = Array.from(ranked.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, CANDIDATE_LIMIT)
    .map(([id]) => id)

  if (!candidateIds.length) {
    return <RelatedProducts product={product} countryCode={countryCode} />
  }

  // Hydrate with the card fields; the Store API only returns published,
  // in-region products, so this also drops drafts / discontinued partners.
  const { response } = await getProductsList({
    queryParams: {
      id: candidateIds,
      limit: candidateIds.length,
      fields: LISTING_FIELDS,
    },
    countryCode,
  })

  // Frequency order (the list endpoint doesn't keep input order), then
  // partners with a photo ahead of those without.
  const ordered = imagesFirst(
    inIdOrder(response.products, candidateIds).filter((p) => p.id !== product.id)
  ).slice(0, BOUGHT_TOGETHER_LIMIT)

  if (!ordered.length) {
    return <RelatedProducts product={product} countryCode={countryCode} />
  }

  return (
    <ProductRail
      eyebrow="Sugestões"
      title="Complementos habituais"
      products={ordered}
      region={region}
      data-testid="bought-together"
    />
  )
}
