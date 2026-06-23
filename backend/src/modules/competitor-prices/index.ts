import { Module } from "@medusajs/framework/utils"
import CompetitorPricesModuleService from "./service"

export const COMPETITOR_PRICES_MODULE = "competitor_prices"

export default Module(COMPETITOR_PRICES_MODULE, {
  service: CompetitorPricesModuleService,
})

export { default as CompetitorPricesModuleService } from "./service"
export * from "./scrapers/types"
export { registerScraper, getScraper, listScraperKeys, DEFAULT_SCRAPER_KEY } from "./scrapers/registry"
export type { CatalogItem, Listing, MatchCandidate } from "./matching/fuzzy"

// Discovery layer (find new stores / new competitor products via an agent).
export * from "./discovery/types"
export {
  setDiscoveryAgent,
  getDiscoveryAgent,
  isDiscoveryConfigured,
  noopDiscoveryAgent,
} from "./discovery/registry"
export { createAnthropicDiscoveryAgent } from "./discovery/anthropic"
