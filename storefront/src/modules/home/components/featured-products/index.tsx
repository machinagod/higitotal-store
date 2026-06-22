import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

export default function FeaturedProducts({
  products,
  region,
}: {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}) {
  if (!products?.length) {
    return null
  }

  return (
    <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-3 gap-y-4 small:gap-x-6 small:gap-y-8">
      {products.map((product) => (
        <li key={product.id}>
          {/* @ts-ignore */}
          <ProductPreview product={product} region={region} isFeatured />
        </li>
      ))}
    </ul>
  )
}
