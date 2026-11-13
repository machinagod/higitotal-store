import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * In catalog mode the fetched product carries no prices (see lib/data/products).
 */
export default async function ProductActionsWrapper({
  id,
  region,
  catalogMode = false,
}: {
  id: string
  region: HttpTypes.StoreRegion
  catalogMode?: boolean
}) {
  const [product] = await getProductsById({
    ids: [id],
    regionId: region.id,
  })

  if (!product) {
    return null
  }

  return (
    <ProductActions product={product} region={region} catalogMode={catalogMode} />
  )
}
