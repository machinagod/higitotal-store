import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  MoloniSyncEntity,
  runMoloniSync,
} from "../../../../workflows/moloni/sync"

interface SyncBody {
  dry_run?: boolean
  limit?: number
  entities?: MoloniSyncEntity[]
  product_status?: "draft" | "published"
}

/**
 * POST /admin/moloni/sync — manually trigger a Moloni sync (admin-authenticated).
 * Body (all optional): { dry_run, limit, entities, product_status }.
 * Runs synchronously and returns the report.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as SyncBody
  const report = await runMoloniSync(req.scope, {
    dryRun: body.dry_run ?? false,
    limit: body.limit,
    entities: body.entities,
    productStatus: body.product_status,
  })
  res.json({ report })
}
