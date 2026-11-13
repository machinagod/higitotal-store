import { describe, expect, it } from "vitest"
import { stripSensitiveMetadata } from "../strip-sensitive-metadata"

describe("stripSensitiveMetadata", () => {
  const product = {
    id: "p1",
    metadata: { spec_pdf_url: "x.pdf", supplier_id: 3 },
    variants: [
      { id: "v1", metadata: { cost_price: 12.3, cost_price_discounted: 11, supplier_id: 7, moloni_product_id: 1 } },
      { id: "v2", metadata: null },
    ],
  } as any

  it("drops cost/supplier keys from product and variant metadata", () => {
    const [out] = stripSensitiveMetadata([product])
    expect(out.metadata).toEqual({ spec_pdf_url: "x.pdf" })
    expect(out.variants?.[0].metadata).toEqual({ moloni_product_id: 1 })
    expect(out.variants?.[1].metadata).toBeNull()
    expect(JSON.stringify(out)).not.toMatch(/cost_price|supplier_id/)
  })

  it("does not mutate the input and tolerates missing variants", () => {
    stripSensitiveMetadata([product])
    expect(product.variants[0].metadata.cost_price).toBe(12.3)
    expect(stripSensitiveMetadata([{ id: "p" } as any])[0].variants).toBeUndefined()
  })
})
