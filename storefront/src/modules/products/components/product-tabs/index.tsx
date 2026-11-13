import { HttpTypes } from "@medusajs/types"

import { getProductAttributes } from "@lib/data/products"
import { buildSpecRows } from "@lib/util/product-specs"

import SpecsTable from "./specs-table"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

/**
 * "Características" — curated specs (product_attributes module) plus the core
 * product fields (weight in kg/g, dimensions in mm). The description is shown
 * once, under the title (ProductInfo), so there is no "Descrição" tab.
 * Async server component; renders nothing without specs.
 */
const ProductTabs = async ({ product }: ProductTabsProps) => {
  const { specs: attributeSpecs } = await getProductAttributes(product.id)
  const rows = buildSpecRows(
    product as Parameters<typeof buildSpecRows>[0],
    [...(attributeSpecs ?? [])].sort((a, b) => a.rank - b.rank)
  )

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="w-full" data-testid="product-specs">
      <SpecsTable rows={rows} />
    </div>
  )
}

export default ProductTabs
