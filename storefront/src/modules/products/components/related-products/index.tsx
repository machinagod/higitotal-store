import { getRegion } from "@lib/data/regions"
import { LISTING_FIELDS, getProductsList } from "@lib/data/products"
import { imagesFirst } from "@lib/util/listing-order"
import { HttpTypes } from "@medusajs/types"
import ProductRail from "./rail"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const RELATED_LIMIT = 4

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  // Related = same collection and/or sharing a tag with this product.
  const queryParams: HttpTypes.StoreProductListParams = {
    region_id: region.id,
    is_giftcard: false,
    // Over-fetch so images-first ordering has something to choose from.
    limit: 12,
    fields: LISTING_FIELDS,
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  // The Store API filters tags by id (`tag_id`); the list endpoint is strict,
  // so an unknown `tags` param would fail the whole request with a 400.
  const tagIds = (product.tags ?? []).map((t) => t.id).filter(Boolean)
  if (tagIds.length) {
    queryParams.tag_id = tagIds
  }

  const products = await getProductsList({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    imagesFirst(
      response.products.filter((p) => p.id !== product.id)
    ).slice(0, RELATED_LIMIT)
  )

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
