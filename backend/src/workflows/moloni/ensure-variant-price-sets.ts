/**
 * Create a price set (with the given prices) for existing variants that have
 * none, and link it — the same two steps `createProductVariantsWorkflow` runs
 * for new variants (`createPriceSetsStep` + `createVariantPricingLinkStep`), so
 * the result is indistinguishable from a normally created variant. Both steps
 * compensate, so a failed run leaves no orphan price set behind.
 */
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  createPriceSetsStep,
  createVariantPricingLinkStep,
} from "@medusajs/medusa/core-flows"

export interface EnsureVariantPriceSetsInput {
  variants: {
    variant_id: string
    prices: { amount: number; currency_code: string }[]
  }[]
}

export const ensureVariantPriceSetsWorkflow = createWorkflow(
  "moloni-ensure-variant-price-sets",
  (input: EnsureVariantPriceSetsInput) => {
    const toCreate = transform({ input }, ({ input }) =>
      input.variants.map((v) => ({ prices: v.prices }))
    )
    // Relies on createPriceSets returning sets in input order, as core-flows does.
    const priceSets = createPriceSetsStep(toCreate)
    const links = transform({ input, priceSets }, ({ input, priceSets }) => ({
      links: input.variants.map((v, i) => ({
        variant_id: v.variant_id,
        price_set_id: priceSets[i].id,
      })),
    }))
    createVariantPricingLinkStep(links)
    return new WorkflowResponse(links)
  }
)
