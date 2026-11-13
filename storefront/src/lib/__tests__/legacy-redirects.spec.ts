import { describe, expect, it } from "vitest"
import { legacyRedirect } from "../legacy-redirects"
import { LEGACY_PRODUCTS } from "../legacy-redirects-data"

const r = (url: string) => {
  const u = new URL(url, "https://www.higitotal.pt")
  return legacyRedirect(u.pathname, u.searchParams)
}

describe("legacyRedirect", () => {
  it("ignores non-legacy paths", () => {
    expect(r("/pt/store")).toBeNull()
    expect(r("/basement")).toBeNull()
  })
  it("maps old product URLs (with/without category, with EAN) to the same product", () => {
    expect(r("/base/detergentes/2-drip-floor-ultraconcentrado-2l-8436536083804.html")).toBe(
      "/pt/products/dx1002-159978153"
    )
    expect(r("/base/2-drip-floor.html")).toBe("/pt/products/dx1002-159978153")
    expect(r("/base/index.php?id_product=2&controller=product")).toBe("/pt/products/dx1002-159978153")
  })
  it("maps discontinued products to a category, unknown ids to the catalogue", () => {
    expect(r("/base/utensilios-de-limpeza/160-papel-higienico-domestico-renova-2f-96-rolos.html")).toBe(
      "/pt/categories/papel"
    )
    expect(r("/base/x/99999-nada.html")).toBe("/pt/store")
  })
  it("maps categories, CMS and system pages", () => {
    expect(r("/base/3-detergentes")).toBe("/pt/categories/detergentes")
    expect(r("/base/16-carros-de-limpeza")).toBe("/pt/categories/utensilios-limpeza")
    expect(r("/base/index.php?id_category=15&controller=category")).toBe("/pt/categories/maquinas-de-limpeza")
    expect(r("/base/content/4-about-us")).toBe("/pt")
    expect(r("/base/content/3-terms-and-conditions-of-use")).toBe("/pt/content/terms-of-use")
    expect(r("/base/contact-us")).toBe("/pt/contact")
    expect(r("/base/stores")).toBe("/pt/contact")
    expect(r("/base/login")).toBe("/pt/account")
    expect(r("/base/")).toBe("/pt")
    expect(r("/base")).toBe("/pt")
    expect(r("/base/index.php?controller=contact")).toBe("/pt/contact")
  })
  it("maps searches and falls back to the catalogue", () => {
    expect(r("/base/search?search_query=luvas+nitrilo")).toBe("/pt/results/luvas%20nitrilo")
    expect(r("/base/something/odd")).toBe("/pt/store")
  })
  it("covers every product of the crawl (70 active + 104 inactive + 1 deleted)", () => {
    expect(Object.keys(LEGACY_PRODUCTS).length).toBe(175)
    for (const path of Object.values(LEGACY_PRODUCTS)) {
      expect(path).toMatch(/^\/(products|categories)\/[a-z0-9-]+$/)
    }
  })
})
