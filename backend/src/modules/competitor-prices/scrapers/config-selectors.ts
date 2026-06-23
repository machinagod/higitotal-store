import { CompetitorScraper, PageContext, ScrapeResult } from "./types"
import { parsePriceToMinor } from "./price"

/**
 * Selector-driven scraper: reads CSS selectors from the mapping/competitor
 * `metadata.scraper_hints` (passed through as `page.hints`). This is the target
 * the parser-generation routine writes to — a Claude routine inspects a new
 * competitor site and emits a selector spec, which is stored in metadata and
 * executed here. No code-gen/eval: new sites are supported by *data*, not code.
 *
 * Expected hints shape:
 *   { price, originalPrice?, title?, availability?, sku?, ean?,
 *     attr? (default "content"|"text"), currency? }
 */
export const configSelectorsScraper: CompetitorScraper = {
  key: "config-selectors",
  parse(page: PageContext): ScrapeResult {
    const h = page.hints ?? {}
    if (!h.price) {
      return { status: "error", errorMessage: "config-selectors: no price selector in hints" }
    }
    const read = (sel?: string): string | undefined => {
      if (!sel) return undefined
      try {
        const el = page.$(sel).first()
        if (!el || el.length === 0) return undefined
        const mode = h.attr ?? "text"
        const v = mode === "text" ? el.text() : el.attr(mode)
        return typeof v === "string" ? v.trim() : undefined
      } catch {
        return undefined
      }
    }

    const price = parsePriceToMinor(read(h.price))
    if (price == null) {
      return { status: "not_found", errorMessage: "config-selectors: price not found" }
    }
    const availability = read(h.availability)
    return {
      status: "ok",
      price,
      originalPrice: parsePriceToMinor(read(h.originalPrice)),
      currencyCode: h.currency ?? read(h.currencySelector) ?? "EUR",
      availability: availability ?? null,
      inStock: availability ? /em stock|in stock|dispon[ií]vel/i.test(availability) : null,
      title: read(h.title) ?? null,
      sku: read(h.sku) ?? null,
      ean: read(h.ean) ?? null,
      raw: { source: "config-selectors", hints: h },
    }
  },
}
