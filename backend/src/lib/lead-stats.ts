/**
 * Server-side lead count (no cookies, no personal data).
 *
 * Every accepted storefront form (product enquiry, quote list, contact,
 * assistência) goes through `POST /store/contact-request`, which sends ONE
 * staff e-mail through the Notification module. That module persists a
 * `notification` row per send (template, data, status, created_at), so the
 * staff rows (`template = "contact-request"`) are the lead log since launch —
 * no extra table. The customer acknowledgement (`contact-request-ack`) is a
 * second row per lead and is ignored.
 *
 * Only non-personal fields are ever derived from a row: the kind, the number
 * of quote-list lines and the landing page PATH (no host, query or hash).
 * Names, e-mails, phones, messages, companies and IPs never leave this file.
 */
import type { INotificationModuleService } from '@medusajs/framework/types'
import { inferContactKind } from '../modules/email-notifications/contact-request-copy'

/** Template of the staff e-mail — one row per lead. */
export const LEAD_TEMPLATE = 'contact-request'

export const LEAD_TIMEZONE = 'Europe/Lisbon'

/** "orcamento" = a quote list (items > 0); the others follow the handler's kind. */
export type LeadKind = 'produto' | 'orcamento' | 'assistencia' | 'geral'

export const LEAD_KINDS: readonly LeadKind[] = ['produto', 'orcamento', 'assistencia', 'geral']

/** What one lead contributes to the stats — nothing personal. */
export type LeadSummary = {
  kind: LeadKind
  /** Quote-list lines (0 for a single-product / contact / assistência request). */
  items: number
  /** Landing page path (e.g. "/dk/products/drip-floor"), null when unknown. */
  path: string | null
}

export type LeadRecord = LeadSummary & {
  createdAt: Date
  /** The staff e-mail went out (status "success"). Failed sends are reported apart. */
  delivered: boolean
}

const MAX_PATH_LENGTH = 200

/**
 * Path of a page URL: host, query string and hash are dropped (they can carry
 * tracking ids or search terms). Non-http(s) schemes and junk → null.
 */
export function landingPath(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const s = url.trim()
  if (!s) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:/i.test(s)) return null
  let path: string
  try {
    path = new URL(s, 'https://placeholder.invalid').pathname
  } catch {
    return null
  }
  path = path.replace(/\/{2,}/g, '/')
  if (path.length > 1) path = path.replace(/\/+$/, '')
  return path.length > MAX_PATH_LENGTH ? path.slice(0, MAX_PATH_LENGTH) : path
}

const text = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined)

/**
 * Summary of one request — works on the parsed `ContactRequest` (route) and on
 * a stored notification's `data` (the request spread with `emailOptions`),
 * including rows written before `kind` / `items` existed (kind inferred the
 * same way the handler does).
 */
export function summarizeLead(data: unknown): LeadSummary {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const items = Array.isArray(d.items) ? d.items.length : 0
  const first = items ? ((d.items as unknown[])[0] as Record<string, unknown> | null) : null
  const kind = inferContactKind({
    kind: d.kind,
    productTitle: text(d.productTitle),
    sku: text(d.sku) ?? text(first?.sku) ?? text(first?.title),
  })
  return {
    kind: items > 0 ? 'orcamento' : kind,
    items,
    path: landingPath(d.productUrl),
  }
}

/** One structured, PII-free log line per accepted lead (Railway logs). */
export const leadLogLine = (lead: LeadSummary): string =>
  `lead: kind=${lead.kind} items=${lead.items} path=${lead.path ?? '-'}`

/** The slice of a notification row used here. */
export type LeadNotificationRow = {
  created_at: Date | string
  status?: string | null
  data?: Record<string, unknown> | null
}

export function leadFromNotification(row: LeadNotificationRow): LeadRecord {
  return {
    ...summarizeLead(row.data),
    createdAt: new Date(row.created_at),
    delivered: row.status === 'success',
  }
}

// ── Calendar dates (YYYY-MM-DD) ────────────────────────────────────────────

const LISBON_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: LEAD_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Calendar date of an instant in Lisbon, "YYYY-MM-DD". */
export function lisbonDate(instant: Date): string {
  const parts = Object.fromEntries(
    LISBON_PARTS.formatToParts(instant).map((p) => [p.type, p.value])
  ) as Record<string, string>
  return `${parts.year}-${parts.month}-${parts.day}`
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** A real calendar date in YYYY-MM-DD form. */
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string') return false
  const m = ISO_DATE_RE.exec(v)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.toISOString().slice(0, 10) === v
}

/** Calendar arithmetic on "YYYY-MM-DD". */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Days from `from` to `to`, both included. */
export function daysInclusive(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
}

// ── Query (GET /admin/lead-stats) ──────────────────────────────────────────

export const DEFAULT_RANGE_DAYS = 90
export const MAX_RANGE_DAYS = 731
/** "Last N days vs the N days before", anchored at the range's `to`. */
export const COMPARISON_PERIODS = [7, 30, 90] as const

export type LeadStatsQuery =
  | { status: 'ok'; from: string; to: string }
  | { status: 'invalid'; message: string }

/**
 * `from` / `to` are optional Lisbon calendar dates (YYYY-MM-DD, inclusive).
 * Defaults: `to` = today, `from` = the 90-day window ending at `to`.
 */
export function parseLeadStatsQuery(query: unknown, today: string): LeadStatsQuery {
  const q = (query && typeof query === 'object' ? query : {}) as Record<string, unknown>
  for (const key of ['from', 'to'] as const) {
    if (q[key] !== undefined && q[key] !== '' && !isIsoDate(q[key])) {
      return { status: 'invalid', message: `${key} must be a date (YYYY-MM-DD)` }
    }
  }
  const to = isIsoDate(q.to) ? q.to : today
  const from = isIsoDate(q.from) ? q.from : addDays(to, -(DEFAULT_RANGE_DAYS - 1))
  if (from > to) {
    return { status: 'invalid', message: 'from must not be after to' }
  }
  if (daysInclusive(from, to) > MAX_RANGE_DAYS) {
    return { status: 'invalid', message: `the range is limited to ${MAX_RANGE_DAYS} days` }
  }
  return { status: 'ok', from, to }
}

/**
 * UTC instants to load so that the range AND the comparison periods are
 * covered. One spare day before the start absorbs Lisbon's UTC offset (0/+1);
 * the aggregation filters by Lisbon date exactly.
 */
export function fetchWindow(from: string, to: string): { gte: string; lt: string } {
  const longest = Math.max(...COMPARISON_PERIODS)
  const earliestComparison = addDays(to, -(2 * longest - 1))
  const start = earliestComparison < from ? earliestComparison : from
  return {
    gte: `${addDays(start, -1)}T00:00:00.000Z`,
    lt: `${addDays(to, 1)}T00:00:00.000Z`,
  }
}

const PAGE_SIZE = 500
const MAX_PAGES = 200

/** Staff contact-request rows created in [gte, lt), oldest first, as lead records. */
export async function loadLeadRecords(
  notification: Pick<INotificationModuleService, 'listNotifications'>,
  window: { gte: string; lt: string }
): Promise<LeadRecord[]> {
  const records: LeadRecord[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await notification.listNotifications(
      { template: LEAD_TEMPLATE, created_at: { $gte: window.gte, $lt: window.lt } },
      {
        select: ['id', 'created_at', 'status', 'data'],
        order: { created_at: 'ASC', id: 'ASC' },
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      }
    )
    for (const row of rows) records.push(leadFromNotification(row))
    if (rows.length < PAGE_SIZE) break
  }
  return records
}

// ── Aggregation ────────────────────────────────────────────────────────────

export const TOP_PAGES_LIMIT = 50

export type PeriodTotal = { from: string; to: string; leads: number }

export type LeadStats = {
  range: { from: string; to: string; days: number; timezone: typeof LEAD_TIMEZONE }
  totals: {
    /** Delivered leads in the range (the staff e-mail went out). */
    leads: number
    /** Requests whose staff e-mail failed — not counted in `leads`. */
    failed: number
    /** Quote-list requests and their total number of lines. */
    quote_lists: number
    quote_lines: number
  }
  /** Every day of the range, oldest first (zero days included). */
  by_day: { date: string; leads: number }[]
  /** All four kinds, fixed order. */
  by_kind: { kind: LeadKind; leads: number }[]
  /** Landing pages by leads (desc, then path), at most {@link TOP_PAGES_LIMIT}; path null = unknown. */
  by_page: { path: string | null; leads: number }[]
  /** Distinct landing pages in the range (including "unknown"). */
  pages_distinct: number
  /** Last N days vs the previous N days, both ending at `range.to`. */
  comparisons: {
    days: number
    current: PeriodTotal
    previous: PeriodTotal
    change: number
    /** Relative change in %, rounded to 1 decimal; null when the previous period had none. */
    change_pct: number | null
  }[]
}

/**
 * Aggregates lead records for the Lisbon calendar range [from, to]. Records
 * outside the range only feed the period comparisons. Only delivered leads
 * count; failed sends are tallied in `totals.failed` (range only).
 */
export function aggregateLeads(
  records: readonly LeadRecord[],
  range: { from: string; to: string }
): LeadStats {
  const { from, to } = range
  const days = daysInclusive(from, to)

  const dayCounts = new Map<string, number>()
  const kindCounts = new Map<LeadKind, number>(LEAD_KINDS.map((k) => [k, 0]))
  const pageCounts = new Map<string | null, number>()
  const totals = { leads: 0, failed: 0, quote_lists: 0, quote_lines: 0 }
  const delivered: string[] = []

  for (const r of records) {
    const date = lisbonDate(r.createdAt)
    if (r.delivered) delivered.push(date)
    if (date < from || date > to) continue
    if (!r.delivered) {
      totals.failed++
      continue
    }
    totals.leads++
    dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1)
    kindCounts.set(r.kind, (kindCounts.get(r.kind) ?? 0) + 1)
    pageCounts.set(r.path, (pageCounts.get(r.path) ?? 0) + 1)
    if (r.items > 0) {
      totals.quote_lists++
      totals.quote_lines += r.items
    }
  }

  const by_day = Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i)
    return { date, leads: dayCounts.get(date) ?? 0 }
  })

  const by_page = [...pageCounts.entries()]
    .map(([path, leads]) => ({ path, leads }))
    .sort((a, b) => b.leads - a.leads || (a.path ?? '￿').localeCompare(b.path ?? '￿'))
    .slice(0, TOP_PAGES_LIMIT)

  const countBetween = (start: string, end: string) =>
    delivered.reduce((n, d) => (d >= start && d <= end ? n + 1 : n), 0)

  const comparisons = COMPARISON_PERIODS.map((n) => {
    const current: PeriodTotal = { from: addDays(to, -(n - 1)), to, leads: 0 }
    const previous: PeriodTotal = { from: addDays(to, -(2 * n - 1)), to: addDays(to, -n), leads: 0 }
    current.leads = countBetween(current.from, current.to)
    previous.leads = countBetween(previous.from, previous.to)
    const change = current.leads - previous.leads
    return {
      days: n,
      current,
      previous,
      change,
      change_pct: previous.leads ? Math.round((change / previous.leads) * 1000) / 10 : null,
    }
  })

  return {
    range: { from, to, days, timezone: LEAD_TIMEZONE },
    totals,
    by_day,
    by_kind: LEAD_KINDS.map((kind) => ({ kind, leads: kindCounts.get(kind) ?? 0 })),
    by_page,
    pages_distinct: pageCounts.size,
    comparisons,
  }
}
