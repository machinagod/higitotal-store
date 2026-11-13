/**
 * Quote-list analytics: plain `dataLayer` pushes for Google Tag Manager.
 * Never any personal data — only product references and counts. Tags inside
 * GTM still respect the visitor's consent (Consent Mode v2 defaults).
 */

type DataLayerHost = { dataLayer?: unknown[] }

export type QuoteAnalyticsEvent =
  | { event: "add_to_quote"; item_id: string; quantity: number }
  | { event: "generate_lead"; lead_type: "quote"; items: number }

/** Pushes one event; a no-op on the server or when anything goes wrong. */
export function pushDataLayer(
  evt: QuoteAnalyticsEvent,
  host: DataLayerHost | undefined = typeof window === "undefined"
    ? undefined
    : (window as unknown as DataLayerHost)
): void {
  if (!host) return
  try {
    host.dataLayer = host.dataLayer || []
    host.dataLayer.push(evt)
  } catch {
    // Analytics must never break the page.
  }
}

/** `add_to_quote` — item_id is the product reference (handle when there is no SKU). */
export function addToQuoteEvent(
  item: { sku?: string; handle: string },
  quantity: number
): QuoteAnalyticsEvent {
  return { event: "add_to_quote", item_id: item.sku || item.handle, quantity }
}

/** `generate_lead` after a quote request was sent. */
export function quoteLeadEvent(lines: number): QuoteAnalyticsEvent {
  return { event: "generate_lead", lead_type: "quote", items: lines }
}
