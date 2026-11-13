/**
 * Google Tag Manager container id. Defaults to the Higitotal container so the
 * production image loads it without extra build config; set
 * NEXT_PUBLIC_GTM_ID to another id to switch containers, or to an empty string
 * to disable GTM. Only loaded in production builds (never in `next dev`).
 *
 * Consent: per the business decision, cookie consent (Consent Mode defaults,
 * banner/CMP) is configured INSIDE the GTM container, not in this code.
 */
export const DEFAULT_GTM_ID = "GTM-KFXNPF5W"

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/

export function resolveGtmId(
  env: { NEXT_PUBLIC_GTM_ID?: string; NODE_ENV?: string } = process.env
): string | null {
  if (env.NODE_ENV !== "production") return null
  const id = (env.NEXT_PUBLIC_GTM_ID ?? DEFAULT_GTM_ID).trim()
  return GTM_ID_RE.test(id) ? id : null
}
