import { CompetitorScraper, PageContext, ScrapeResult } from "./types"
import { genericJsonLdScraper } from "./generic-jsonld"
import { parsePriceToMinor } from "./price"

/**
 * Example site-specific scraper — a template for "specific backend modules for
 * scraping" once a competitor is identified. PrestaShop (which several PT B2B
 * hygiene shops, and Higitotal's own legacy site, run) emits clean `Product`
 * JSON-LD, so we delegate to the generic parser first and only fall back to
 * PrestaShop's `#our_price_display` / `[itemprop=price]` markup via Cheerio.
 *
 * To add a bespoke scraper: copy this file, implement `parse`, and register it
 * in `registry.ts` (or from a module loader) under a new `key`.
 */
export const prestashopScraper: CompetitorScraper = {
  key: "prestashop",
  async parse(page: PageContext): Promise<ScrapeResult> {
    const generic = await genericJsonLdScraper.parse(page)
    if (generic.status === "ok") return generic

    const $ = page.$
    const raw =
      $('#our_price_display').attr?.("content") ||
      $('[itemprop="price"]').attr?.("content") ||
      $('#our_price_display').first?.().text?.()
    const price = parsePriceToMinor(raw)
    if (price == null) {
      return { status: "not_found", errorMessage: "no price found" }
    }
    const availText = ($('#availability_value').text?.() || "").trim()
    return {
      status: "ok",
      price,
      currencyCode: "EUR",
      availability: availText || null,
      inStock: availText
        ? /em stock|in stock|dispon[ií]vel/i.test(availText)
        : null,
      raw: { source: "prestashop-fallback" },
    }
  },
}
