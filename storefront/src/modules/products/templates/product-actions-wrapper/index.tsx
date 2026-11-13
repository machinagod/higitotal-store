import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * In catalog mode the fetched product carries no prices (see lib/data/products).
 *
 * The pricing query does not return `metadata` (spec sheet URL, VAT %), so it
 * is taken from the page's product (already sanitised by lib/data/products).
 */
export default async function ProductActionsWrapper({
  id,
  region,
  catalogMode = false,
  metadata,
}: {
  id: string
  region: HttpTypes.StoreRegion
  catalogMode?: boolean
  metadata?: HttpTypes.StoreProduct["metadata"]
}) {
  const [product] = await getProductsById({
    ids: [id],
    regionId: region.id,
  })

  if (!product) {
    return null
  }

  return (
    <ProductActions
      product={{ ...product, metadata: product.metadata ?? metadata ?? null }}
      region={region}
      catalogMode={catalogMode}
    />
  )
}
