import Product from "../product-preview"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  // Related = same collection and/or sharing a tag with this product.
  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
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
  queryParams.is_giftcard = false
  // Keep the rail short (the mock shows a single row). Fetch a small window and
  // trim to RELATED_LIMIT after removing the current product.
  queryParams.limit = 8

  const RELATED_LIMIT = 4

  const products = await getProductsList({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    response.products
      .filter((responseProduct) => responseProduct.id !== product.id)
      .slice(0, RELATED_LIMIT)
  )

  if (!products.length) {
    return null
  }

  return (
    <div className="content-container">
      <div className="mb-7 flex flex-col gap-1">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
          <span className="ind" />
          Sugestões
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[28px]">
          Costuma comprar com
        </h2>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-4 gap-y-6 small:gap-x-6">
        {products.map((product) => (
          <li key={product.id}>
            {region && <Product region={region} product={product} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
