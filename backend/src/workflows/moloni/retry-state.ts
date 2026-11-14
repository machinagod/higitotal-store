/**
 * Persisted list of Moloni products whose last sync failed (pure helpers).
 *
 * The products cursor always advances at the end of a run — otherwise one
 * poisoned product turns every 5-minute run into a full re-sync that floods
 * the event bus. Failed products are remembered here instead and fetched by id
 * on the next run until they succeed.
 *
 * Stored as JSON in the Moloni module's cursor table (key
 * `PRODUCT_RETRY_STATE_KEY`), so no new migration is needed.
 */

export const PRODUCT_RETRY_STATE_KEY = "products:retry"

/** Drop a retry entry after Moloni says "no such product" this many runs in a row. */
export const MAX_NOT_FOUND = 3

/** Max products fetched by id per run (keeps a systemic failure from hammering Moloni). */
export const MAX_RETRY_FETCH = 100

const MAX_ERROR_LENGTH = 300

export interface RetryEntry {
  /** Consecutive failed attempts. */
  attempts: number
  firstFailedAt: string
  lastError: string
  /** Consecutive runs where Moloni returned no product for this id. */
  notFound?: number
}

/** moloni product id (as string) → entry */
export type RetryState = Record<string, RetryEntry>

/** Tolerant parse: anything malformed yields an empty state (never throws). */
export function parseRetryState(raw: string | null | undefined): RetryState {
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
  const out: RetryState = {}
  for (const [k, v] of Object.entries(parsed as Record<string, any>)) {
    if (!/^\d+$/.test(k) || !v || typeof v !== "object") continue
    out[k] = {
      attempts: Number(v.attempts) || 1,
      firstFailedAt: String(v.firstFailedAt ?? ""),
      lastError: String(v.lastError ?? ""),
      ...(Number(v.notFound) > 0 ? { notFound: Number(v.notFound) } : {}),
    }
  }
  return out
}

export function serializeRetryState(state: RetryState): string {
  return JSON.stringify(state)
}

/** Moloni ids to retry, oldest failure first (stable for the fetch cap). */
export function retryIds(state: RetryState): number[] {
  return Object.entries(state)
    .sort(
      ([a, ea], [b, eb]) =>
        ea.firstFailedAt.localeCompare(eb.firstFailedAt) || Number(a) - Number(b)
    )
    .map(([k]) => Number(k))
}

/**
 * Next retry state after a run.
 *  - `processed`: every Moloni id that went through the products step this run;
 *    those not in `failed` succeeded and are dropped.
 *  - `failed`: id → error message; added (or attempts incremented).
 *  - `notFound`: retry ids Moloni no longer returns (deleted); dropped after
 *    `maxNotFound` consecutive misses (guards against a transient bad reply).
 *  - previous entries that were neither processed nor looked up (e.g. the fetch
 *    cap, or a transient fetch error) are kept unchanged.
 */
export function mergeRetryState(
  prev: RetryState,
  run: {
    processed: Iterable<number>
    failed: Map<number, string>
    notFound?: Iterable<number>
    now: string
    maxNotFound?: number
  }
): RetryState {
  const maxNotFound = run.maxNotFound ?? MAX_NOT_FOUND
  const next: RetryState = { ...prev }

  for (const id of run.processed) {
    if (!run.failed.has(id)) delete next[String(id)]
  }
  for (const id of run.notFound ?? []) {
    const key = String(id)
    const entry = next[key]
    if (!entry) continue
    const misses = (entry.notFound ?? 0) + 1
    if (misses >= maxNotFound) delete next[key]
    else next[key] = { ...entry, notFound: misses }
  }
  for (const [id, error] of run.failed) {
    const key = String(id)
    const entry = prev[key]
    next[key] = {
      attempts: (entry?.attempts ?? 0) + 1,
      firstFailedAt: entry?.firstFailedAt || run.now,
      lastError: error.slice(0, MAX_ERROR_LENGTH),
    }
  }
  return next
}
