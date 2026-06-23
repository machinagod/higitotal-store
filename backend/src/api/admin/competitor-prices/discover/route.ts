import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { runCatalogDiscovery } from "../../../../workflows/competitor-prices/discovery-catalog"
import { runProductDiscovery } from "../../../../workflows/competitor-prices/discovery-product"

interface DiscoverBody {
  mode?: "catalog" | "product" | "both"
  competitor_ids?: string[]
  watch_ids?: string[]
  limit?: number
  force?: boolean
}

/**
 * POST /admin/competitor-prices/discover — trigger discovery now (admin-auth).
 * Body: { mode = "both", competitor_ids?, watch_ids?, limit?, force? }.
 * Requires a configured discovery agent (otherwise reports run inert).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as DiscoverBody
  const mode = body.mode ?? "both"
  const out: Record<string, any> = {}

  if (mode === "catalog" || mode === "both") {
    out.catalog = await runCatalogDiscovery(req.scope, {
      competitorIds: body.competitor_ids,
      limit: body.limit,
      force: body.force,
    })
  }
  if (mode === "product" || mode === "both") {
    out.product = await runProductDiscovery(req.scope, {
      watchIds: body.watch_ids,
      limit: body.limit,
      force: body.force,
    })
  }
  res.json(out)
}
