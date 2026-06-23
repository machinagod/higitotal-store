import type { MedusaContainer } from "@medusajs/framework/types"
import { COMPETITOR_PRICES_MODULE } from "../../modules/competitor-prices"
import { crawlTargets } from "../../modules/competitor-prices/scrapers/engine"
import { DEFAULT_SCRAPER_KEY } from "../../modules/competitor-prices/scrapers/registry"
import type { ScrapeTarget } from "../../modules/competitor-prices/scrapers/types"

export interface ScrapeOptions {
  limit?: number
  mappingIds?: string[]
  /** Ignore next_scrape_at and scrape now. */
  force?: boolean
}

export interface ScrapeReport {
  due: number
  scraped: number
  changed: number
  unchanged: number
  failed: number
  notFound: number
}

/**
 * Resolve which mappings are due, crawl them with Crawlee, and persist each
 * observation (advancing the adaptive schedule). Used by the scheduled job and
 * the admin "scrape now" route.
 */
export async function runCompetitorScrape(
  container: MedusaContainer,
  opts: ScrapeOptions = {}
): Promise<ScrapeReport> {
  const logger = container.resolve("logger")
  const svc: any = container.resolve(COMPETITOR_PRICES_MODULE)
  const cfg = svc.getConfig()

  const due: any[] = opts.mappingIds?.length
    ? await svc.listCompetitorProducts(
        { id: opts.mappingIds },
        { relations: ["competitor"] }
      )
    : await svc.listDueMappings(opts.limit, opts.force)

  const targets: ScrapeTarget[] = due
    .filter((m) => m.is_active && m.competitor_url)
    .map((m) => ({
      url: m.competitor_url,
      competitorId: m.competitor?.id ?? m.competitor_id,
      competitorProductId: m.id,
      scraperKey:
        m.scraper_key ?? m.competitor?.scraper_key ?? DEFAULT_SCRAPER_KEY,
      hints: m.metadata?.scraper_hints,
    }))

  const report: ScrapeReport = {
    due: due.length,
    scraped: 0,
    changed: 0,
    unchanged: 0,
    failed: 0,
    notFound: 0,
  }
  if (!targets.length) {
    logger.info("[competitor-prices] no due mappings to scrape")
    return report
  }

  const results = await crawlTargets(targets, { concurrency: cfg.concurrency })

  for (const m of due) {
    const r = results.get(m.id)
    if (!r) continue
    const outcome = await svc.recordObservation(m, r)
    report.scraped++
    if (r.status === "not_found") report.notFound++
    if (outcome === "error") report.failed++
    else if (outcome === "changed") report.changed++
    else report.unchanged++
  }

  logger.info(
    `[competitor-prices] scraped=${report.scraped} changed=${report.changed} unchanged=${report.unchanged} failed=${report.failed} notFound=${report.notFound}`
  )
  return report
}
