import { MedusaService } from "@medusajs/framework/utils"
import { ProductAttribute } from "./models/product-attribute"

/**
 * Auto-generates CRUD for ProductAttribute:
 * listProductAttributes / createProductAttributes / deleteProductAttributes / ...
 */
class ProductAttributeModuleService extends MedusaService({
  ProductAttribute,
}) {}

export default ProductAttributeModuleService
