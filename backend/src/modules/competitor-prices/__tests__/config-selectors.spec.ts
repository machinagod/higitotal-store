import { configSelectorsScraper } from "../scrapers/config-selectors"
import { makeCheerio } from "./cheerio-mock"

const run = (hints: any, $: any) =>
  configSelectorsScraper.parse({ url: "http://x", html: "", jsonLd: [], $, hints })

describe("configSelectorsScraper", () => {
  it("errors when no price selector is configured", () => {
    expect(run({}, makeCheerio()).status).toBe("error")
    expect(run(undefined, makeCheerio()).status).toBe("error")
  })

  it("reads the price via text mode by default", () => {
    const $ = makeCheerio({ selectorMap: { ".price": { text: "12,34 €" } } })
    expect(run({ price: ".price" }, $)).toMatchObject({ status: "ok", price: 1234 })
  })

  it("reads via an attribute when attr is set, plus availability/title/sku/ean", () => {
    const $ = makeCheerio({
      selectorMap: {
        "#price": { attrs: { content: "5,00" } },
        "#old": { attrs: { content: "9,00" } },
        "#avail": { attrs: { content: "Em stock" } },
        "#title": { attrs: { content: "Prod" } },
        "#sku": { attrs: { content: "REF1" } },
        "#ean": { attrs: { content: "123" } },
      },
    })
    const r = run(
      {
        price: "#price",
        originalPrice: "#old",
        availability: "#avail",
        title: "#title",
        sku: "#sku",
        ean: "#ean",
        attr: "content",
        currency: "EUR",
      },
      $
    )
    expect(r).toMatchObject({
      status: "ok",
      price: 500,
      originalPrice: 900,
      availability: "Em stock",
      inStock: true,
      title: "Prod",
      sku: "REF1",
      ean: "123",
    })
  })

  it("returns not_found when the price selector matches nothing", () => {
    const $ = makeCheerio({ selectorMap: {} })
    expect(run({ price: ".missing" }, $).status).toBe("not_found")
  })

  it("tolerates a selector that throws", () => {
    const $ = makeCheerio({ throwOnSelector: ".boom" })
    expect(run({ price: ".boom" }, $).status).toBe("not_found")
  })
})
