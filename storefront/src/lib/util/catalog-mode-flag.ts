/**
 * Catalog mode ("modo catálogo"): the storefront shows products but no prices
 * and no cart — every product CTA becomes "Pedir informação" (the B2B
 * contact-request form), like the legacy PrestaShop site.
 *
 * Enabled by the RUNTIME env var STOREFRONT_CATALOG_MODE=true (also 1/yes/on).
 * It is deliberately NOT a NEXT_PUBLIC_* var: it is read on the server at
 * request time, so it can be flipped on Railway (service restart) without
 * rebuilding the image.
 *
 * This module has no Next.js imports so the edge middleware can use it too.
 */
export const CATALOG_MODE_ENV = "STOREFRONT_CATALOG_MODE"

export function catalogModeFromEnv(): boolean {
  const raw = (process.env.STOREFRONT_CATALOG_MODE ?? "").trim().toLowerCase()
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}
