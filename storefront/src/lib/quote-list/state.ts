/**
 * Quote list ("carrinho de orçamento") — pure state and helpers.
 *
 * In catalog mode visitors collect products with quantities and send ONE
 * quote request (`/orcamento`). The list lives in the visitor's browser only
 * (localStorage, see ./store); this module is framework-free so every rule is
 * unit-tested: identity of a line, quantity / note limits, list size, the
 * versioned storage format and the request payload.
 */

/** localStorage key. The `_v1` suffix and the `v` field both version the format. */
export const QUOTE_STORAGE_KEY = "ht_quote_v1"
export const QUOTE_STORAGE_VERSION = 1

/** Most lines a list may hold (the backend accepts the same maximum). */
export const MAX_QUOTE_LINES = 100
export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 9999
export const MAX_NOTE_LENGTH = 300

/** One product line. */
export type QuoteItem = {
  productId: string
  /** Set when the product has several variants and one was chosen. */
  variantId?: string
  handle: string
  title: string
  sku?: string
  thumbnail?: string
  /** Integer 1–9999. */
  quantity: number
  /** Optional per-line note (≤ 300 characters). */
  note?: string
}

/** What a caller passes to add a product (quantity and note come separately). */
export type QuoteProductInput = Omit<QuoteItem, "quantity" | "note">

export type StoredQuote = { v: typeof QUOTE_STORAGE_VERSION; items: QuoteItem[] }

/** Shared empty list (stable reference for useSyncExternalStore snapshots). */
export const EMPTY_QUOTE: readonly QuoteItem[] = Object.freeze([])

/** Integer 1–9999; anything non-numeric becomes 1. */
export function clampQuantity(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
      ? Number(value.trim())
      : NaN
  if (!Number.isFinite(n)) return MIN_QUANTITY
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.floor(n)))
}

/**
 * Quantity typed into an input: digits only, or null while the field is
 * empty / not a number (the input keeps its text until blur).
 */
export function parseQuantityInput(text: string): number | null {
  const digits = text.replace(/\D/g, "")
  if (!digits) return null
  return clampQuantity(digits)
}

/** Note as stored: at most 300 characters; blank → undefined. */
export function cleanNote(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const s = value.slice(0, MAX_NOTE_LENGTH)
  return s.trim() ? s : undefined
}

/** Same product + same variant (or both without one) = same line. */
export function sameLine(
  a: Pick<QuoteItem, "productId" | "variantId">,
  b: Pick<QuoteItem, "productId" | "variantId">
): boolean {
  return a.productId === b.productId && (a.variantId ?? "") === (b.variantId ?? "")
}

export function findLine(
  items: readonly QuoteItem[],
  key: Pick<QuoteItem, "productId" | "variantId">
): QuoteItem | undefined {
  return items.find((i) => sameLine(i, key))
}

export type AddResult = {
  items: readonly QuoteItem[]
  /** added = new line; increased = existing line; full = list at the limit, nothing changed. */
  status: "added" | "increased" | "full"
  /** The line after the change (undefined when full). */
  line?: QuoteItem
}

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined

/**
 * Adds a product. An existing line (same product/variant) has its quantity
 * increased (capped at 9999) and keeps its position; a new line goes to the
 * end. At 100 lines a new product is refused (`status: "full"`).
 */
export function addItem(
  items: readonly QuoteItem[],
  product: QuoteProductInput,
  quantity: number = 1
): AddResult {
  const qty = clampQuantity(quantity)
  const existing = findLine(items, product)
  if (existing) {
    const line = { ...existing, quantity: clampQuantity(existing.quantity + qty) }
    return {
      items: items.map((i) => (i === existing ? line : i)),
      status: "increased",
      line,
    }
  }
  if (items.length >= MAX_QUOTE_LINES) return { items, status: "full" }
  const line = normaliseItem({ ...product, quantity: qty })
  if (!line) return { items, status: "full" }
  return { items: [...items, line], status: "added", line }
}

/** Sets a line's quantity (clamped). Unknown line → unchanged. */
export function setQuantity(
  items: readonly QuoteItem[],
  key: Pick<QuoteItem, "productId" | "variantId">,
  quantity: number
): readonly QuoteItem[] {
  const qty = clampQuantity(quantity)
  let changed = false
  const next = items.map((i) => {
    if (!sameLine(i, key) || i.quantity === qty) return i
    changed = true
    return { ...i, quantity: qty }
  })
  return changed ? next : items
}

/** Sets (or clears, when blank) a line's note, capped at 300 characters. */
export function setNote(
  items: readonly QuoteItem[],
  key: Pick<QuoteItem, "productId" | "variantId">,
  note: string
): readonly QuoteItem[] {
  const value = cleanNote(note)
  let changed = false
  const next = items.map((i) => {
    if (!sameLine(i, key) || i.note === value) return i
    changed = true
    const { note: _old, ...rest } = i
    return value === undefined ? rest : { ...rest, note: value }
  })
  return changed ? next : items
}

export function removeItem(
  items: readonly QuoteItem[],
  key: Pick<QuoteItem, "productId" | "variantId">
): readonly QuoteItem[] {
  const next = items.filter((i) => !sameLine(i, key))
  return next.length === items.length ? items : next
}

export function clearItems(): readonly QuoteItem[] {
  return EMPTY_QUOTE
}

/** Number of lines (what the header badge shows). */
export function lineCount(items: readonly QuoteItem[]): number {
  return items.length
}

/** Sum of quantities. */
export function unitCount(items: readonly QuoteItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0)
}

/** A stored / untrusted line → a valid QuoteItem, or null. */
export function normaliseItem(raw: unknown): QuoteItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const productId = str(r.productId)
  const handle = str(r.handle)
  const title = str(r.title)
  if (!productId || !handle || !title) return null
  const item: QuoteItem = {
    productId,
    handle,
    title,
    quantity: clampQuantity(r.quantity),
  }
  const variantId = str(r.variantId)
  if (variantId) item.variantId = variantId
  const sku = str(r.sku)
  if (sku) item.sku = sku
  // Only absolute http(s) image URLs (rendered through next/image).
  const thumbnail = str(r.thumbnail)
  if (thumbnail && /^https?:\/\//i.test(thumbnail)) item.thumbnail = thumbnail
  const note = cleanNote(r.note)
  if (note) item.note = note
  return item
}

/**
 * Reads the stored JSON. Anything unreadable, of another version or not a
 * list gives an empty list; bad lines are dropped, duplicates merged
 * (quantities added), and the list cut at 100 lines.
 */
export function parseStored(raw: string | null | undefined): QuoteItem[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!data || typeof data !== "object") return []
  const { v, items } = data as { v?: unknown; items?: unknown }
  if (v !== QUOTE_STORAGE_VERSION || !Array.isArray(items)) return []
  let out: readonly QuoteItem[] = []
  for (const entry of items) {
    const item = normaliseItem(entry)
    if (!item) continue
    // A new line keeps its note (normaliseItem); a duplicate adds its quantity.
    out = addItem(out, item, item.quantity).items
  }
  return [...out]
}

export function serialize(items: readonly QuoteItem[]): string {
  const stored: StoredQuote = { v: QUOTE_STORAGE_VERSION, items: [...items] }
  return JSON.stringify(stored)
}

/** One line of the `items` array sent to `POST /store/contact-request`. */
export type QuoteRequestItem = {
  sku?: string
  title: string
  quantity: number
  note?: string
  url?: string
}

/**
 * Lines for the request body: the product page URL is built on the public
 * site URL (the backend keeps only links to the public storefront hosts).
 */
export function buildQuoteRequestItems(
  items: readonly QuoteItem[],
  opts: { baseUrl: string; countryCode: string }
): QuoteRequestItem[] {
  const base = opts.baseUrl.replace(/\/+$/, "")
  const cc = encodeURIComponent(opts.countryCode)
  return items.map((i) => {
    const out: QuoteRequestItem = {
      title: i.title,
      quantity: clampQuantity(i.quantity),
      url: `${base}/${cc}/products/${encodeURIComponent(i.handle)}`,
    }
    if (i.sku) out.sku = i.sku
    const note = i.note?.trim()
    if (note) out.note = note
    return out
  })
}

/** "1 produto" / "3 produtos". */
export function productCountLabel(n: number): string {
  return `${n} ${n === 1 ? "produto" : "produtos"}`
}

/** Accessible name of the header control, e.g. "Orçamento: 3 produtos". */
export function quoteControlLabel(n: number): string {
  return n > 0
    ? `Orçamento: ${productCountLabel(n)}`
    : "Pedir orçamento (lista vazia)"
}
