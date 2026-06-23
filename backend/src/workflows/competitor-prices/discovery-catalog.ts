import type { MedusaContainer } from "@medusajs/framework/types"
import { COMPETITOR_PRICES_MODULE } from "../../modules/competitor-prices"
import {
  getDiscoveryAgent,
  isDiscoveryConfigured,
} from "../../modules/competitor-prices/discovery/registry"
import { runCompetitorMatch } from "./match"

export interface CatalogDiscoveryOptions {
  competitorIds?: string[]
  limit?: number
  force?: boolean
}

export interface CatalogDiscoveryReport {
  agent: string
  considered: number
  newListings: number
  parsersGenerated: number
}

/**
 * Catalog discovery: for each due competitor, ask the discovery agent for
 * product listings we don't already track, create unmatched mappings, and
 * (optionally) have the agent synthesize a selector spec for sites flagged
 * `metadata.auto_generate_parser`. New mappings are then run through the matcher.
 */
export async function runCatalogDiscovery(
  container: MedusaContainer,
  opts: CatalogDiscoveryOptions = {}
): Promise<CatalogDiscoveryReport> {
  const logger = container.resolve("logger")
  const svc: any = container.resolve(COMPETITOR_PRICES_MODULE)
  const agent = getDiscoveryAgent()

  const report: CatalogDiscoveryReport = {
    agent: agent.key,
    considered: 0,
    newListings: 0,
    parsersGenerated: 0,
  }
  if (!isDiscoveryConfigured()) {
    logger.info("[competitor-prices] catalog discovery: no agent configured — skipping")
    return report
  }

  const competitors: any[] = opts.competitorIds?.length
    ? await svc.listCompetitors({ id: opts.competitorIds })
    : await svc.listDueCatalogDiscovery(opts.limit, opts.force)
  report.considered = competitors.length

  for (const c of competitors) {
    const known = await svc.listCompetitorProducts(
      { competitor_id: c.id },
      { take: 1000 }
    )
    const knownUrls = known.map((k: any) => k.competitor_url).filter(Boolean)

    let listings: any[] = []
    try {
      listings = await agent.discoverCatalog({
        competitorId: c.id,
        competitorHandle: c.handle,
        baseUrl: c.base_url,
        knownUrls,
      })
    } catch (e: any) {
      logger.warn(`[competitor-prices] discoverCatalog(${c.handle}) failed: ${e?.message ?? e}`)
    }

    for (const l of listings) {
      const created = await svc.upsertDiscoveredMapping(c.id, l)
      if (created && created.match_status === "unmatched") report.newListings++
    }

    // Optionally synthesize a site-specific parser the first time.
    if (c.metadata?.auto_generate_parser && listings[0]?.url) {
      try {
        const spec = await agent.generateParser({
          competitorHandle: c.handle,
          sampleUrl: listings[0].url,
        })
        if (spec) {
          await svc.updateCompetitors({
            id: c.id,
            scraper_key: spec.scraperKey || "config-selectors",
            metadata: { ...(c.metadata ?? {}), scraper_hints: spec.hints, generated_parser: spec },
          })
          report.parsersGenerated++
        }
      } catch (e: any) {
        logger.warn(`[competitor-prices] generateParser(${c.handle}) failed: ${e?.message ?? e}`)
      }
    }

    await svc.markCatalogDiscovered(c)
  }

  if (report.newListings > 0) {
    await runCompetitorMatch(container, {})
  }

  logger.info(
    `[competitor-prices] catalog discovery: considered=${report.considered} new=${report.newListings} parsers=${report.parsersGenerated}`
  )
  return report
}
