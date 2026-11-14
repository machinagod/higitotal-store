import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  LeadRecord,
  aggregateLeads,
  fetchWindow,
  lisbonDate,
  loadLeadRecords,
  parseLeadStatsQuery,
} from "../../../lib/lead-stats"

/**
 * GET /admin/lead-stats?from=YYYY-MM-DD&to=YYYY-MM-DD (admin-authenticated,
 * like every /admin route). Lisbon calendar dates, both inclusive; default =
 * the last 90 days. Counts the storefront form leads from the persisted staff
 * contact-request notifications — no cookies, and the JSON carries no
 * personal data (kinds, counts and landing page paths only). Shape:
 * `LeadStats` in src/lib/lead-stats.ts.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parsed = parseLeadStatsQuery(req.query, lisbonDate(new Date()))
  if (parsed.status === "invalid") {
    return res.status(400).json({ message: parsed.message })
  }
  const { from, to } = parsed

  let notification: INotificationModuleService | undefined
  try {
    notification = req.scope.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  } catch {
    // No e-mail provider configured → the module is not loaded → no leads.
    notification = undefined
  }
  const records: LeadRecord[] = notification
    ? await loadLeadRecords(notification, fetchWindow(from, to))
    : []

  res.json(aggregateLeads(records, { from, to }))
}
