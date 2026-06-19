import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  PRODUCT_ATTRIBUTES_MODULE,
  groupAttributes,
  type AttrRow,
} from "../../../../../modules/product-attributes"
import type ProductAttributeModuleService from "../../../../../modules/product-attributes/service"

/** Public read of a product's Amazon-style characteristics for the storefront. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<ProductAttributeModuleService>(PRODUCT_ATTRIBUTES_MODULE)
  const rows = (await svc.listProductAttributes(
    { product_id: req.params.id },
    { take: 1000, order: { rank: "ASC" } }
  )) as unknown as AttrRow[]
  res.json(groupAttributes(rows))
}
