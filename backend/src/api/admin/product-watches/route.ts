import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COMPETITOR_PRICES_MODULE } from "../../../modules/competitor-prices"

/** GET /admin/product-watches — list products monitored for new competitor stores. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: any = req.scope.resolve(COMPETITOR_PRICES_MODULE)
  const product_watches = await svc.listProductWatches({})
  res.json({ product_watches })
}

interface CreateWatchBody {
  product_id: string
  product_sku?: string
  title?: string
  brand?: string
  ean?: string
  discovery_interval_seconds?: number
  is_active?: boolean
  metadata?: Record<string, any>
}

/** POST /admin/product-watches — start monitoring one of our products. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as CreateWatchBody
  const svc: any = req.scope.resolve(COMPETITOR_PRICES_MODULE)
  const product_watch = await svc.createProductWatches(body)
  res.status(201).json({ product_watch })
}
