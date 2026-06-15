import type { MedusaContainer } from "@medusajs/framework/types"
import { MOLONI_MODULE } from "../modules/moloni"
import { runMoloniSync } from "../workflows/moloni/sync"

// In-process guard so a slow run (e.g. the initial full sync) isn't overlapped
// by the next 5-minute tick.
let running = false

/**
 * Scheduled Moloni -> Medusa sync. Idempotent; safe to run repeatedly.
 * No-ops when the Moloni module isn't configured (credentials absent).
 */
export default async function moloniSyncJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  try {
    container.resolve(MOLONI_MODULE)
  } catch {
    logger.info("[moloni-sync] module not configured — skipping scheduled run")
    return
  }
  if (running) {
    logger.info("[moloni-sync] previous run still in progress — skipping tick")
    return
  }
  running = true
  try {
    await runMoloniSync(container, {})
  } finally {
    running = false
  }
}

export const config = {
  name: "moloni-sync",
  // Every 5 minutes. Incremental by default (driven by per-entity cursors), so
  // each tick only fetches what changed in Moloni. https://crontab.guru/
  schedule: "*/5 * * * *",
}
