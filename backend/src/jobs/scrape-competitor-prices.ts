import type { MedusaContainer } from "@medusajs/framework/types"
import { COMPETITOR_PRICES_MODULE } from "../modules/competitor-prices"
import { runCompetitorScrape } from "../workflows/competitor-prices/scrape"

// In-process guard so a slow crawl isn't overlapped by the next tick.
let running = false

/**
 * Scheduled competitor-price scrape. Each tick processes the batch of mappings
 * whose adaptive `next_scrape_at` is due — so cadence is driven per-mapping, not
 * by this schedule. No-ops when nothing is due (e.g. before any competitor is
 * configured), so it's safe to ship inert.
 */
export default async function scrapeCompetitorPricesJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  try {
    container.resolve(COMPETITOR_PRICES_MODULE)
  } catch {
    logger.info("[competitor-prices] module not registered — skipping tick")
    return
  }
  if (running) {
    logger.info("[competitor-prices] previous crawl still running — skipping tick")
    return
  }
  running = true
  try {
    await runCompetitorScrape(container, {})
  } catch (e: any) {
    logger.error(`[competitor-prices] scrape tick failed: ${e?.message ?? e}`)
  } finally {
    running = false
  }
}

export const config = {
  name: "scrape-competitor-prices",
  // Every 15 minutes; per-mapping next_scrape_at gates what actually runs.
  schedule: "*/15 * * * *",
}
