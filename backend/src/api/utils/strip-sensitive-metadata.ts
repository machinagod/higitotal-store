import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Internal commercial data the Moloni sync keeps in `metadata` (product variants
 * mostly) — needed by admin / competitor-pricing, never by shoppers. Medusa's
 * Store API returns `metadata` as-is, so without this anyone holding the public
 * publishable key could read cost prices and supplier ids.
 */
export const SENSITIVE_METADATA_KEYS = [
  "cost_price",
  "cost_price_discounted",
  "supplier_id",
] as const

const MAX_DEPTH = 12

/** Remove sensitive keys from every `metadata` object found in `value` (in place). */
export function scrubSensitiveMetadata(value: unknown, depth = 0): void {
  if (!value || typeof value !== "object" || depth > MAX_DEPTH) {
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      scrubSensitiveMetadata(item, depth + 1)
    }
    return
  }
  const obj = value as Record<string, unknown>
  for (const [key, child] of Object.entries(obj)) {
    if (key === "metadata" && child && typeof child === "object" && !Array.isArray(child)) {
      for (const k of SENSITIVE_METADATA_KEYS) {
        delete (child as Record<string, unknown>)[k]
      }
    }
    scrubSensitiveMetadata(child, depth + 1)
  }
}

/** Store-route middleware: scrub sensitive metadata from every JSON response. */
export function stripSensitiveMetadata(
  _req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const json = res.json.bind(res)
  res.json = ((body: unknown) => {
    scrubSensitiveMetadata(body)
    return json(body)
  }) as typeof res.json
  next()
}
