import { CompetitorScraper } from "./types"
import { genericJsonLdScraper } from "./generic-jsonld"
import { prestashopScraper } from "./prestashop"
import { configSelectorsScraper } from "./config-selectors"

/**
 * Registry of pluggable scraper strategies. Built-ins are registered on import;
 * additional strategies can be registered from a module loader at boot via
 * `registerScraper(...)`. Resolution order at scrape time:
 *   competitor_product.scraper_key → competitor.scraper_key → DEFAULT_SCRAPER_KEY
 */
export const DEFAULT_SCRAPER_KEY = "generic-jsonld"

const registry = new Map<string, CompetitorScraper>()

export function registerScraper(scraper: CompetitorScraper): void {
  registry.set(scraper.key, scraper)
}

export function getScraper(key?: string | null): CompetitorScraper {
  return (
    (key && registry.get(key)) ||
    registry.get(DEFAULT_SCRAPER_KEY)!
  )
}

export function listScraperKeys(): string[] {
  return [...registry.keys()]
}

registerScraper(genericJsonLdScraper)
registerScraper(prestashopScraper)
registerScraper(configSelectorsScraper)
