import { loadVariantsWithoutPriceSet, variantsWithoutPriceSet } from "../price-sets"

describe("variantsWithoutPriceSet", () => {
  it("returns the variants with no (complete) price-set link, deduplicated", () => {
    expect(
      variantsWithoutPriceSet(
        ["v1", "v2", "v3", "v4", "v1"],
        [
          { variant_id: "v1", price_set_id: "pset_1" },
          { variant_id: "v3", price_set_id: null },
          { variant_id: null, price_set_id: "pset_x" },
        ]
      )
    ).toEqual(["v2", "v3", "v4"])
  })

  it("is empty when every variant is linked", () => {
    expect(variantsWithoutPriceSet(["v1"], [{ variant_id: "v1", price_set_id: "p" }])).toEqual([])
  })
})

describe("loadVariantsWithoutPriceSet", () => {
  it("queries the link table in chunks of 200", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `v${i}`)
    const graphAll = jest.fn(async (_e: string, _f: string[], filters: any) =>
      filters.variant_id
        .filter((id: string) => id !== "v7" && id !== "v240")
        .map((id: string) => ({ variant_id: id, price_set_id: `p_${id}` }))
    )
    expect(await loadVariantsWithoutPriceSet(graphAll, ids)).toEqual(["v7", "v240"])
    expect(graphAll).toHaveBeenCalledTimes(2)
    expect(graphAll.mock.calls[0][0]).toBe("product_variant_price_set")
    expect(graphAll.mock.calls[0][2].variant_id).toHaveLength(200)
  })
})
