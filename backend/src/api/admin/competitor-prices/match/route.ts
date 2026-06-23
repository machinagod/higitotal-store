import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { runCompetitorMatch } from "../../../../workflows/competitor-prices/match"

interface MatchBody {
  mapping_ids?: string[]
  limit?: number
  rematch?: boolean
}

/**
 * POST /admin/competitor-prices/match — run fuzzy/exact matching of competitor
 * listings against our catalog (admin-auth). Body (optional):
 * { mapping_ids, limit, rematch }. Returns the report.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as MatchBody
  const report = await runCompetitorMatch(req.scope, {
    mappingIds: body.mapping_ids,
    limit: body.limit,
    rematch: body.rematch,
  })
  res.json({ report })
}
