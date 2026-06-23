import type { MedusaContainer } from "@medusajs/framework/types"
import { COMPETITOR_PRICES_MODULE } from "../modules/competitor-prices"
import { isDiscoveryConfigured } from "../modules/competitor-prices/discovery/registry"
import { runProductDiscovery } from "../workflows/competitor-prices/discovery-product"

let running = false

/**
 * Scheduled product discovery — find new stores selling our watched products.
 * Per-watch cadence is gated by next_discovery_at; this is just the tick.
 * No-ops unless a discovery agent is configured, so it ships inert.
 */
export default async function discoverProductCompetitorsJob(
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
    await runProductDiscovery(container, {})
  } catch (e: any) {
    logger.error(`[competitor-prices] product discovery tick failed: ${e?.message ?? e}`)
  } finally {
    running = false
  }
}

export const config = {
  name: "discover-product-competitors",
  // Daily; per-watch next_discovery_at controls real frequency.
  schedule: "0 4 * * *",
}
