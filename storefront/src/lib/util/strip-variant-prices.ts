import { HttpTypes } from "@medusajs/types"

/**
 * Returns copies of the products with every variant's `calculated_price`
 * removed (catalog mode — see ./catalog-mode-flag). Inputs are not mutated, so
 * the shared fetch cache keeps the priced objects.
 */
export function stripVariantPrices<T extends HttpTypes.StoreProduct>(
  products: T[]
): T[] {
  return products.map((p) => ({
    ...p,
    variants: p.variants?.map((v) => {
      const rest = { ...v }
      delete rest.calculated_price
      return rest
    }),
  }))
}
