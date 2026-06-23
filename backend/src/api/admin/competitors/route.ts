import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COMPETITOR_PRICES_MODULE } from "../../../modules/competitor-prices"

/** GET /admin/competitors — list configured competitors. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: any = req.scope.resolve(COMPETITOR_PRICES_MODULE)
  const competitors = await svc.listCompetitors({})
  res.json({ competitors })
}

interface CreateCompetitorBody {
  name: string
  handle: string
  base_url?: string
  scraper_key?: string
  is_active?: boolean
  refresh_interval_seconds?: number
  metadata?: Record<string, any>
}

/** POST /admin/competitors — create a competitor. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as CreateCompetitorBody
  const svc: any = req.scope.resolve(COMPETITOR_PRICES_MODULE)
  const competitor = await svc.createCompetitors(body)
  res.status(201).json({ competitor })
}
