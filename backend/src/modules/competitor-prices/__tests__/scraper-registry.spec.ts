import {
  getScraper,
  listScraperKeys,
  registerScraper,
  DEFAULT_SCRAPER_KEY,
} from "../scrapers/registry"

describe("scraper registry", () => {
  it("registers the built-in scrapers", () => {
    const keys = listScraperKeys()
    expect(keys).toEqual(
      expect.arrayContaining(["generic-jsonld", "prestashop", "config-selectors"])
    )
  })

  it("resolves a known key", () => {
    expect(getScraper("prestashop").key).toBe("prestashop")
  })

  it("falls back to the default for unknown/empty keys", () => {
    expect(getScraper("nope").key).toBe(DEFAULT_SCRAPER_KEY)
    expect(getScraper(undefined).key).toBe(DEFAULT_SCRAPER_KEY)
    expect(getScraper(null).key).toBe(DEFAULT_SCRAPER_KEY)
  })

  it("allows registering a custom scraper", () => {
    registerScraper({ key: "custom-x", parse: () => ({ status: "ok", price: 1 }) })
    expect(getScraper("custom-x").key).toBe("custom-x")
  })
})
