/**
 * Discovery layer — the "find new things" half of the module, designed to be
 * driven by a Claude routine (or any agent/LLM + web search):
 *
 *   • Product discovery   — given one of OUR products, find other stores selling
 *                           it, with their URL + price/characteristics.
 *   • Catalog discovery   — given a competitor, find product listings (esp. new
 *                           ones we haven't mapped yet).
 *   • Parser generation   — given a new competitor site (sample listing), emit a
 *                           selector spec so `config-selectors` can scrape it
 *                           without bespoke code.
 *
 * Implement `DiscoveryAgent`, register it via `setDiscoveryAgent(...)` from a
 * module loader, and the scheduled discovery jobs start using it. The default
 * agent is a no-op so the jobs ship inert.
 */

export type DiscoveredListing = {
  /** The competitor store, by handle (created if unknown). */
  competitorHandle: string
  competitorName?: string
  competitorBaseUrl?: string
  /** The product listing URL to scrape. */
  url: string
  title?: string
  brand?: string
  sku?: string
  ean?: string
  /** Observed price in MINOR units (cents), if the agent already captured it. */
  price?: number | null
  currencyCode?: string
  /** Free-form characteristics the agent extracted (pack size, specs, …). */
  characteristics?: Record<string, any>
  /** Confidence 0..100 that this listing is the same product. */
  confidence?: number
}

/** A selector spec the `config-selectors` scraper can execute (see that file). */
export type GeneratedParser = {
  /** Suggested scraper key — usually "config-selectors". */
  scraperKey: string
  /** Selector hints stored on the competitor/mapping metadata. */
  hints: Record<string, any>
  notes?: string
}

export type ProductDiscoveryInput = {
  productId: string
  sku?: string | null
  title: string
  brand?: string | null
  ean?: string | null
}

export type CatalogDiscoveryInput = {
  competitorId: string
  competitorHandle: string
  baseUrl?: string | null
  /** URLs we already track for this competitor — agent should return NEW ones. */
  knownUrls: string[]
}

export type ParserGenerationInput = {
  competitorHandle: string
  sampleUrl: string
  sampleHtml?: string
}

export interface DiscoveryAgent {
  key: string
  /** Find other stores selling a given product. */
  findStoresForProduct(input: ProductDiscoveryInput): Promise<DiscoveredListing[]>
  /** Find (new) product listings on a competitor site. */
  discoverCatalog(input: CatalogDiscoveryInput): Promise<DiscoveredListing[]>
  /** Synthesize a selector spec for a new competitor site. */
  generateParser(input: ParserGenerationInput): Promise<GeneratedParser | null>
}
