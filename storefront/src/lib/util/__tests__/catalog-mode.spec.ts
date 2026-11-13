import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }))

import { unstable_noStore } from "next/cache"
import { catalogModeFromEnv } from "../catalog-mode-flag"
import { isCatalogMode } from "../catalog-mode"
import { stripVariantPrices } from "../strip-variant-prices"

const ORIGINAL = process.env.STOREFRONT_CATALOG_MODE

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.STOREFRONT_CATALOG_MODE
  else process.env.STOREFRONT_CATALOG_MODE = ORIGINAL
})

describe("catalogModeFromEnv", () => {
  it("is off when unset or empty", () => {
    delete process.env.STOREFRONT_CATALOG_MODE
    expect(catalogModeFromEnv()).toBe(false)
    process.env.STOREFRONT_CATALOG_MODE = ""
    expect(catalogModeFromEnv()).toBe(false)
  })

  it.each(["true", "TRUE", "1", "yes", "on", " true "])("is on for %j", (v) => {
    process.env.STOREFRONT_CATALOG_MODE = v
    expect(catalogModeFromEnv()).toBe(true)
  })

  it.each(["false", "0", "no", "off", "nope"])("is off for %j", (v) => {
    process.env.STOREFRONT_CATALOG_MODE = v
    expect(catalogModeFromEnv()).toBe(false)
  })
})

describe("isCatalogMode", () => {
  it("reads the env flag and opts the render out of static caching", () => {
    process.env.STOREFRONT_CATALOG_MODE = "true"
    expect(isCatalogMode()).toBe(true)
    process.env.STOREFRONT_CATALOG_MODE = "false"
    expect(isCatalogMode()).toBe(false)
    expect(unstable_noStore).toHaveBeenCalled()
  })
})

describe("stripVariantPrices", () => {
  const product = {
    id: "prod_1",
    title: "Drip Floor (2L)",
    variants: [
      { id: "v1", sku: "DX1002", calculated_price: { calculated_amount: 26.1 } },
      { id: "v2", sku: "DX1002B" },
    ],
  } as any

  it("removes calculated_price from every variant", () => {
    const [out] = stripVariantPrices([product])
    expect(out.variants?.map((v: any) => v.calculated_price)).toEqual([
      undefined,
      undefined,
    ])
    expect(out.variants?.map((v: any) => v.sku)).toEqual(["DX1002", "DX1002B"])
    expect(JSON.stringify(out)).not.toContain("26.1")
  })

  it("does not mutate the input", () => {
    stripVariantPrices([product])
    expect(product.variants[0].calculated_price).toEqual({ calculated_amount: 26.1 })
  })

  it("tolerates products without variants", () => {
    expect(stripVariantPrices([{ id: "p" } as any])).toEqual([
      { id: "p", variants: undefined },
    ])
  })
})
