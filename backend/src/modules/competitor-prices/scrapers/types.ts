/**
 * Pluggable competitor-scraper contract. A scraper is a *parser*: the Crawlee
 * engine (see `engine.ts`) fetches the page (handling concurrency, retries,
 * sessions, proxies), then hands the loaded page to the scraper selected by the
 * mapping/competitor `scraper_key`. Per-competitor strategies (PrestaShop, a
 * bespoke API, a headless-browser flow) drop in via the registry without
 * touching the core.
 */

export type ScrapeTarget = {
  url: string
  competitorId: string
  competitorProductId: string
  /** Resolved scraper key (mapping → competitor → default). */
  scraperKey?: string | null
  /** Per-mapping hints (from competitor_product.metadata), e.g. CSS selectors. */
  hints?: Record<string, any>
}

/** The loaded page handed to a scraper's `parse`. */
export type PageContext = {
  url: string
  html: string
  /** Pre-parsed JSON-LD blocks found on the page. */
  jsonLd: any[]
  /** Cheerio API instance from Crawlee's CheerioCrawler (loosely typed — it's a
   *  runtime object from the dynamically-imported engine). */
  $: any
  hints?: Record<string, any>
}

export type ScrapeResult = {
  status: "ok" | "not_found" | "error"
  /** Monetary values in MINOR units (cents). */
  price?: number | null
  originalPrice?: number | null
  currencyCode?: string | null
  inStock?: boolean | null
  availability?: string | null
  // Identifiers discovered on the page — fed back into matching/metadata.
  title?: string | null
  brand?: string | null
  sku?: string | null
  ean?: string | null
  raw?: any
  errorMessage?: string
}

export interface CompetitorScraper {
  /** Stable identifier referenced by competitor_product/competitor.scraper_key. */
  key: string
  parse(page: PageContext): ScrapeResult | Promise<ScrapeResult>
}
