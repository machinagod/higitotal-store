import type { MedusaContainer } from "@medusajs/framework/types"
import { COMPETITOR_PRICES_MODULE } from "../../modules/competitor-prices"
import {
  getDiscoveryAgent,
  isDiscoveryConfigured,
} from "../../modules/competitor-prices/discovery/registry"

export interface ProductDiscoveryOptions {
  watchIds?: string[]
  limit?: number
  force?: boolean
}

export interface ProductDiscoveryReport {
  agent: string
  considered: number
  newListings: number
}

/**
 * Product discovery: for each due product watch, ask the discovery agent which
 * other stores sell it, ensure those competitors exist, and create confirmed
 * mappings (the next scrape tick captures their prices). Cadence is per-watch
 * (discovery_interval_seconds) → global default.
 */
export async function runProductDiscovery(
  container: MedusaContainer,
  opts: ProductDiscoveryOptions = {}
): Promise<ProductDiscoveryReport> {
  const logger = container.resolve("logger")
  const svc: any = container.resolve(COMPETITOR_PRICES_MODULE)
  const agent = getDiscoveryAgent()

  const report: ProductDiscoveryReport = {
    agent: agent.key,
    considered: 0,
    newListings: 0,
  }
  if (!isDiscoveryConfigured()) {
    logger.info("[competitor-prices] product discovery: no agent configured — skipping")
    return report
  }

  const watches: any[] = opts.watchIds?.length
    ? await svc.listProductWatches({ id: opts.watchIds })
    : await svc.listDueProductWatches(opts.limit, opts.force)
  report.considered = watches.length

  for (const w of watches) {
    let listings: any[] = []
    try {
      listings = await agent.findStoresForProduct({
        productId: w.product_id,
        sku: w.product_sku,
        title: w.title ?? w.product_sku ?? w.product_id,
        brand: w.brand,
        ean: w.ean,
      })
    } catch (e: any) {
      logger.warn(`[competitor-prices] findStoresForProduct(${w.product_id}) failed: ${e?.message ?? e}`)
    }

    for (const l of listings) {
      if (!l.competitorHandle || !l.url) continue
      const competitor = await svc.ensureCompetitor({
        handle: l.competitorHandle,
        name: l.competitorName,
        base_url: l.competitorBaseUrl,
      })
      const created = await svc.upsertDiscoveredMapping(
        competitor.id,
        {
          url: l.url,
          title: l.title,
          brand: l.brand,
          sku: l.sku,
          ean: l.ean,
          characteristics: l.characteristics,
          confidence: l.confidence,
        },
        w.product_id
      )
      if (created) report.newListings++
    }

    await svc.markProductDiscovered(w)
  }

  logger.info(
    `[competitor-prices] product discovery: considered=${report.considered} new=${report.newListings}`
  )
  return report
}
