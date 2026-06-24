import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COMPETITOR_PRICES_MODULE } from "../../../../../../modules/competitor-prices"

/**
 * GET /admin/competitor-prices/discovery/catalog/next-batch?limit=N
 *
 * Reverse-discovery queue (pull side). Returns the next batch of competitors due
 * for a CATALOG crawl, each with the listing URLs we already track so the worker
 * can skip them. An external worker — a Claude Code skill driving the matching
 * MCP, NOT the Anthropic API — enumerates each competitor's catalog (sitemap /
 * category pages / search) and POSTs the listings back to /catalog/submit, which
 * matches them against our products. The forward queue is product-anchored; this
 * one is competitor-anchored.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: any = req.scope.resolve(COMPETITOR_PRICES_MODULE)
  const limit = Math.min(Number((req.query.limit as string) ?? 5) || 5, 50)
  const force = req.query.force === "true"

  const competitors = await svc.listDueCatalogCrawl(limit, force)

  const out = await Promise.all(
    competitors.map(async (c: any) => {
      const known = await svc.listCompetitorProducts(
        { competitor_id: c.id },
        { take: 2000, fields: ["competitor_url"] }
      )
      return {
        competitor_id: c.id,
        handle: c.handle,
        name: c.name,
        base_url: c.base_url,
        country: c.country,
        scraper_key: c.scraper_key,
        scraper_hints: c.scraper_hints,
        known_urls: known.map((k: any) => k.competitor_url).filter(Boolean),
      }
    })
  )

  res.json({ count: out.length, competitors: out })
}
