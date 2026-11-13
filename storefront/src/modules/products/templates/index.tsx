import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import BoughtTogether from "@modules/products/components/bought-together"
import ProductInfo from "@modules/products/templates/product-info"
import ProductHighlights from "@modules/products/components/product-highlights"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import EquipmentServicePanel from "./equipment-service-panel"
import PathBar from "@modules/products/components/path-bar"
import { HttpTypes } from "@medusajs/types"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { isEquipmentProduct } from "@lib/util/product-specs"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const catalogMode = isCatalogMode()
  const isEquipment = isEquipmentProduct(product)

  return (
    <>
      <Suspense fallback={null}>
        <PathBar product={product} countryCode={countryCode} />
      </Suspense>

      {/* Two-column: gallery (sticky) | info + actions */}
      <div
        className="content-container grid grid-cols-1 py-4 small:grid-cols-2 small:items-start small:gap-x-12 small:py-6"
        data-testid="product-container"
      >
        <div className="w-full small:sticky small:top-32">
          <ImageGallery images={product?.images || []} title={product.title} />
        </div>

        <div className="flex w-full flex-col gap-y-6 py-6 small:py-0">
          <ProductInfo product={product} />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
                catalogMode={catalogMode}
              />
            }
          >
            <ProductActionsWrapper
              id={product.id}
              region={region}
              catalogMode={catalogMode}
              metadata={product.metadata}
            />
          </Suspense>
          {isEquipment && <EquipmentServicePanel />}
          <Suspense fallback={null}>
            <ProductHighlights productId={product.id} />
          </Suspense>
        </div>
      </div>

      {/* Full-width details: characteristics */}
      <div className="content-container pb-6">
        <Suspense fallback={null}>
          <ProductTabs product={product} />
        </Suspense>
      </div>

      <div
        className="content-container my-16 small:my-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <BoughtTogether product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
