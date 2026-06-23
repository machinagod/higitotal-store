import { prestashopScraper } from "../scrapers/prestashop"
import { makeCheerio } from "./cheerio-mock"

const run = (jsonLd: any[], $: any) =>
  prestashopScraper.parse({ url: "http://x", html: "", jsonLd, $ })

describe("prestashopScraper", () => {
  it("delegates to the generic JSON-LD parser when that succeeds", async () => {
    const product = { "@type": "Product", name: "P", offers: { price: "10.00" } }
    const r = await run([product], makeCheerio())
    expect(r).toMatchObject({ status: "ok", price: 1000, title: "P" })
  })

  it("falls back to PrestaShop price markup + availability", async () => {
    const $ = makeCheerio({
      selectorMap: {
        "#our_price_display": { attrs: { content: "7,50" } },
        "#availability_value": { text: "Disponível" },
      },
    })
    const r = await run([], $)
    expect(r).toMatchObject({
      status: "ok",
      price: 750,
      currencyCode: "EUR",
      inStock: true,
      raw: { source: "prestashop-fallback" },
    })
  })

  it("uses the itemprop=price fallback when our_price_display is empty", async () => {
    const $ = makeCheerio({ selectorMap: { '[itemprop="price"]': { attrs: { content: "3,00" } } } })
    const r = await run([], $)
    expect(r).toMatchObject({ status: "ok", price: 300 })
  })

  it("uses the text of #our_price_display and handles empty availability", async () => {
    const $ = makeCheerio({ selectorMap: { "#our_price_display": { text: "4,20" } } })
    const r = await run([], $)
    expect(r).toMatchObject({ status: "ok", price: 420, inStock: null })
  })

  it("returns not_found when no price is found", async () => {
    const r = await run([], makeCheerio())
    expect(r.status).toBe("not_found")
  })
})
