import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { runCompetitorScrape } from "../../../../workflows/competitor-prices/scrape"

interface ScrapeBody {
  mapping_ids?: string[]
  limit?: number
  force?: boolean
}

/**
 * POST /admin/competitor-prices/scrape — trigger a scrape now (admin-auth).
 * Body (optional): { mapping_ids, limit, force }. Runs synchronously and returns
 * the report.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as ScrapeBody
  const report = await runCompetitorScrape(req.scope, {
    mappingIds: body.mapping_ids,
    limit: body.limit,
    force: body.force,
  })
  res.json({ report })
}
