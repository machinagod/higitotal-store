import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createMedusaContainer } from "@medusajs/framework/utils"
import { asValue } from "awilix"
import { ensureVariantPriceSetsWorkflow } from "../ensure-variant-price-sets"

describe("ensureVariantPriceSetsWorkflow", () => {
  const setup = (linkCreate: jest.Mock) => {
    const pricing = {
      createPriceSets: jest.fn(async (data: any[]) =>
        data.map((d, i) => ({ id: `pset_${i}`, prices: d.prices }))
      ),
      deletePriceSets: jest.fn(async () => undefined),
    }
    const link = { create: linkCreate, dismiss: jest.fn(async () => undefined) }
    const container = createMedusaContainer()
    container.register({
      [Modules.PRICING]: asValue(pricing),
      [ContainerRegistrationKeys.LINK]: asValue(link),
      [ContainerRegistrationKeys.LOGGER]: asValue(console),
    })
    return { container, pricing, link }
  }

  it("creates one price set per variant and links it like createProductVariantsWorkflow", async () => {
    const { container, pricing, link } = setup(jest.fn(async () => undefined))
    const { result } = await ensureVariantPriceSetsWorkflow(container).run({
      input: {
        variants: [
          { variant_id: "var_a", prices: [{ amount: 2.08, currency_code: "eur" }] },
          { variant_id: "var_b", prices: [{ amount: 1, currency_code: "eur" }] },
        ],
      },
    })
    expect(pricing.createPriceSets).toHaveBeenCalledWith([
      { prices: [{ amount: 2.08, currency_code: "eur" }] },
      { prices: [{ amount: 1, currency_code: "eur" }] },
    ])
    expect(link.create).toHaveBeenCalledWith([
      { [Modules.PRODUCT]: { variant_id: "var_a" }, [Modules.PRICING]: { price_set_id: "pset_0" } },
      { [Modules.PRODUCT]: { variant_id: "var_b" }, [Modules.PRICING]: { price_set_id: "pset_1" } },
    ])
    expect(result).toEqual({
      links: [
        { variant_id: "var_a", price_set_id: "pset_0" },
        { variant_id: "var_b", price_set_id: "pset_1" },
      ],
    })
  })

  it("rolls the created price sets back when linking fails", async () => {
    const { container, pricing } = setup(
      jest.fn(async () => {
        throw new Error("link failed")
      })
    )
    await expect(
      ensureVariantPriceSetsWorkflow(container).run({
        input: { variants: [{ variant_id: "var_a", prices: [{ amount: 1, currency_code: "eur" }] }] },
      })
    ).rejects.toMatchObject({ message: "link failed" }) // workflows reject with a serialized error
    expect(pricing.deletePriceSets).toHaveBeenCalledWith(["pset_0"])
  })
})
