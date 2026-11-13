import { scrubSensitiveMetadata, stripSensitiveMetadata } from "../strip-sensitive-metadata"

const product = () => ({
  products: [
    {
      id: "prod_1",
      metadata: { moloni_product_id: 1, spec_pdf_url: "https://x/y.pdf", supplier_id: 9 },
      variants: [
        {
          id: "v1",
          sku: "DX1002",
          metadata: { cost_price: 12.3, cost_price_discounted: 11, supplier_id: 7, moloni_product_id: 1 },
          calculated_price: { calculated_amount: 26.1 },
        },
      ],
    },
  ],
  count: 1,
})

describe("scrubSensitiveMetadata", () => {
  it("removes cost and supplier fields from nested metadata, keeps the rest", () => {
    const body = product()
    scrubSensitiveMetadata(body)
    const p = body.products[0]
    expect(p.variants[0].metadata).toEqual({ moloni_product_id: 1 })
    expect(p.metadata).toEqual({ moloni_product_id: 1, spec_pdf_url: "https://x/y.pdf" })
    expect(p.variants[0].calculated_price).toEqual({ calculated_amount: 26.1 })
    expect(JSON.stringify(body)).not.toMatch(/cost_price|supplier_id/)
  })

  it("handles cart line items with variant snapshots", () => {
    const cart = { cart: { items: [{ variant: { metadata: { cost_price: 5 } }, metadata: null }] } }
    scrubSensitiveMetadata(cart)
    expect(cart.cart.items[0].variant.metadata).toEqual({})
  })

  it("ignores primitives, null and non-object metadata", () => {
    expect(() => scrubSensitiveMetadata(null)).not.toThrow()
    expect(() => scrubSensitiveMetadata("x")).not.toThrow()
    const odd = { metadata: "cost_price" }
    scrubSensitiveMetadata(odd)
    expect(odd.metadata).toBe("cost_price")
  })
})

describe("stripSensitiveMetadata middleware", () => {
  it("scrubs the body passed to res.json and calls next", () => {
    const sent: unknown[] = []
    const res: any = { json: (b: unknown) => { sent.push(b); return res } }
    const next = jest.fn()
    stripSensitiveMetadata({} as any, res, next)
    expect(next).toHaveBeenCalled()
    res.json(product())
    expect(JSON.stringify(sent[0])).not.toMatch(/cost_price|supplier_id/)
  })
})
