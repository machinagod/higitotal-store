import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPETITOR_PRICES_MODULE } from "../../../../../modules/competitor-prices"
import { readProductPrices } from "../../../../../modules/competitor-prices/pricing"

/**
 * GET /admin/competitor-prices/match/review?limit=&offset=&competitor_id=&status=
 *
 * The match-review queue. By default the unreviewed fuzzy PROPOSALS (title-fuzzy
 * candidates the matcher couldn't auto-confirm), but `?status=confirmed` audits the
 * live matches and `?status=all` covers every match — overrides apply to ANY match,
 * not just fuzzy. Each item pairs the competitor listing with OUR matched product so
 * a reviewer can confirm / reject / reassign via /match/resolve. Highest score first.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: any = req.scope.resolve(COMPETITOR_PRICES_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200)
  const offset = Math.max(0, Number(req.query.offset) || 0)

  const status = (req.query.status as string) || "fuzzy"
  const filters: Record<string, any> = {
    match_status: status === "all" ? ["confirmed", "fuzzy"] : status === "confirmed" ? "confirmed" : "fuzzy",
  }
  if (req.query.competitor_id) filters.competitor_id = req.query.competitor_id as string

  const [rows, count] = await svc.listAndCountCompetitorProducts(filters, {
    relations: ["competitor"],
    take: limit,
    skip: offset,
    order: { match_score: "DESC" },
  })

  const productIds = [...new Set((rows ?? []).map((m: any) => m.product_id).filter(Boolean))] as string[]
  const products = await readProductPrices(query, productIds)

  res.json({
    count,
    limit,
    offset,
    items: (rows ?? []).map((m: any) => ({
      id: m.id,
      competitor_handle: m.competitor?.handle ?? null,
      competitor_name: m.competitor?.name ?? null,
      competitor_url: m.competitor_url,
      theirs_title: m.title,
      brand: m.brand,
      sku: m.competitor_sku,
      ean: m.competitor_ean,
      match_score: m.match_score ?? null,
      proposed_product_id: m.product_id ?? null,
      proposed_title: m.product_id ? products[m.product_id]?.title ?? null : null,
      proposed_sku: m.product_id ? products[m.product_id]?.sku ?? null : null,
    })),
  })
}
