import { HttpTypes } from "@medusajs/types"

/**
 * Internal commercial data the Moloni sync keeps in variant/product metadata.
 * The backend strips it from Store API responses too; this is the storefront's
 * own guard so it can never reach the page payload (RSC props are serialized
 * into the HTML).
 */
const SENSITIVE_KEYS = ["cost_price", "cost_price_discounted", "supplier_id"]

const clean = (metadata: Record<string, unknown> | null | undefined) => {
  if (!metadata) return metadata
  const out = { ...metadata }
  for (const k of SENSITIVE_KEYS) delete out[k]
  return out
}

/** Copies of the products without cost/supplier fields in product or variant metadata. */
export function stripSensitiveMetadata<T extends HttpTypes.StoreProduct>(products: T[]): T[] {
  return products.map((p) => ({
    ...p,
    metadata: clean(p.metadata),
    variants: p.variants?.map((v) => ({ ...v, metadata: clean(v.metadata) })),
  }))
}
