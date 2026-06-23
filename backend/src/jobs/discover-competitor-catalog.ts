import type { MedusaContainer } from "@medusajs/framework/types"
import { COMPETITOR_PRICES_MODULE } from "../modules/competitor-prices"
import { isDiscoveryConfigured } from "../modules/competitor-prices/discovery/registry"
import { runCatalogDiscovery } from "../workflows/competitor-prices/discovery-catalog"

let running = false

/**
 * Scheduled catalog discovery — detect competitors' new products. Per-competitor
 * cadence is gated by next_catalog_discovery_at; this is just the tick. No-ops
 * unless a discovery agent is configured (ANTHROPIC_API_KEY + a loader wiring
 * the agent), so it ships inert.
 */
export default async function discoverCompetitorCatalogJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  try {
    container.resolve(COMPETITOR_PRICES_MODULE)
  } catch {
    return
  }
  if (!isDiscoveryConfigured() || running) return
  running = true
  try {
    await runCatalogDiscovery(container, {})
  } catch (e: any) {
    logger.error(`[competitor-prices] catalog discovery tick failed: ${e?.message ?? e}`)
  } finally {
    running = false
  }
}

export const config = {
  name: "discover-competitor-catalog",
  // Daily; per-competitor next_catalog_discovery_at controls real frequency.
  schedule: "0 3 * * *",
}
