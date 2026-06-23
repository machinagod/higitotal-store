import { genericJsonLdScraper, findProduct } from "../scrapers/generic-jsonld"
import { makeCheerio } from "./cheerio-mock"

const run = (jsonLd: any[], $ = makeCheerio()) =>
  genericJsonLdScraper.parse({ url: "http://x", html: "", jsonLd, $ })

describe("genericJsonLdScraper", () => {
  it("extracts price/brand/sku/ean from a Product with a single offer", () => {
    const product = {
      "@type": "Product",
      name: "Suma Ultra L2",
      brand: { name: "Diversey" },
      sku: "7010074",
      gtin13: "5011231000019",
      offers: {
        price: "37.17",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
    }
    expect(run([product])).toMatchObject({
      status: "ok",
      price: 3717,
      currencyCode: "EUR",
      inStock: true,
      title: "Suma Ultra L2",
      brand: "Diversey",
      sku: "7010074",
      ean: "5011231000019",
      originalPrice: null,
    })
  })

  it("handles offer arrays, lowPrice/highPrice, string brand, gtin fallback", () => {
    const product = {
      "@type": ["Product", "Thing"],
      name: "X",
      brand: "BrandStr",
      gtin: "123",
      offers: [
        { lowPrice: "5,00", highPrice: "9,00", availability: "OutOfStock", priceCurrency: "GBP" },
      ],
    }
    expect(run([product])).toMatchObject({
      status: "ok",
      price: 500,
      originalPrice: 900,
      currencyCode: "GBP",
      inStock: false,
      brand: "BrandStr",
      ean: "123",
      sku: null,
    })
  })

  it("falls back to meta tags when no JSON-LD product price", () => {
    const $ = makeCheerio({
      selectorMap: {
        '"price"': { attrs: { content: "9,99" } },
        "product:price:currency": { attrs: { content: "USD" } },
      },
    })
    expect(run([], $)).toMatchObject({
      status: "ok",
      price: 999,
      currencyCode: "USD",
      inStock: null,
      title: null,
    })
  })

  it("ok product without brand/sku/gtin yields nulls", () => {
    const r = run([{ "@type": "Product", name: "Bare", offers: { price: "4.00" } }])
    expect(r).toMatchObject({ status: "ok", price: 400, brand: null, sku: null, ean: null })
  })

  it("reads price + fields from schema.org microdata (itemprop)", () => {
    const $ = makeCheerio({
      selectorMap: {
        '[itemprop="price"]': { attrs: { content: "92.11" } },
        '[itemprop="priceCurrency"]': { attrs: { content: "EUR" } },
        '[itemprop="availability"]': { text: "Em stock" },
        '[itemprop="name"]': { text: "Suma Ultra L2 20L" },
        '[itemprop="brand"]': { text: "Diversey" },
        '[itemprop="sku"]': { attrs: { content: "SKU1" } },
        '[itemprop="gtin13"]': { attrs: { content: "123" } },
      },
    })
    expect(run([], $)).toMatchObject({
      status: "ok",
      price: 9211,
      currencyCode: "EUR",
      inStock: true,
      title: "Suma Ultra L2 20L",
      brand: "Diversey",
      sku: "SKU1",
      ean: "123",
    })
  })

  it("treats a non-positive (login-gated) price as not_found", () => {
    const $ = makeCheerio({
      selectorMap: {
        '[itemprop="price"]': { attrs: { content: "0" } },
        '[itemprop="name"]': { text: "Gated Product" },
      },
    })
    const r = run([], $)
    expect(r.status).toBe("not_found")
    expect(r.title).toBe("Gated Product")
    expect(r.errorMessage).toMatch(/gated/)
  })

  it("returns not_found when no price anywhere", () => {
    const r = run([{ "@type": "Product", name: "NoPrice" }])
    expect(r.status).toBe("not_found")
    expect(r.title).toBe("NoPrice")
    expect(r.raw).toMatchObject({ jsonLdFound: true })
  })

  it("tolerates a throwing selector in the meta fallback", () => {
    const $ = makeCheerio({ throwOnSelector: "price" })
    expect(run([], $).status).toBe("not_found")
  })

  it("finds a Product nested under @graph", () => {
    const r = run([
      { "@context": "x", "@graph": [{ "@type": "WebPage" }, { "@type": "Product", name: "G", offers: { price: "1.00" } }] },
    ])
    expect(r).toMatchObject({ status: "ok", title: "G", price: 100 })
  })

  it("finds a Product inside a nested array", () => {
    const r = run([[{ "@type": "Product", name: "A", offers: { price: "2.00" } }]])
    expect(r).toMatchObject({ status: "ok", title: "A", price: 200 })
  })
})

describe("findProduct", () => {
  it("returns undefined when no product is present", () => {
    expect(findProduct([{ "@type": "Article" }, null, "str"])).toBeUndefined()
  })
})
