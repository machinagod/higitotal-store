/**
 * Google Tag Manager container id. Defaults to the Higitotal container so the
 * production image loads it without extra build config; set
 * NEXT_PUBLIC_GTM_ID to another id to switch containers, or to an empty string
 * to disable GTM. Only loaded in production builds (never in `next dev`).
 *
 * Consent: per the business decision, the cookie banner (CMP template) is
 * configured INSIDE the GTM container. This code only declares the Google
 * Consent Mode v2 *defaults* (everything non-essential denied) in <head>,
 * before GTM loads, so no tag can set analytics/ads cookies until the CMP
 * calls gtag('consent', 'update', …) after the visitor accepts.
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

/**
 * Google Consent Mode v2 defaults: deny all analytics/ads storage until the
 * CMP (inside GTM) records consent. `functionality_storage` and
 * `security_storage` cover strictly necessary cookies and stay granted.
 * `wait_for_update` gives the CMP 500 ms to restore a returning visitor's
 * choice before tags fire.
 */
export const CONSENT_DEFAULTS = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  security_storage: "granted",
  wait_for_update: 500,
} as const

/**
 * Inline script for <head>, run before GTM/gtag load: defines the standard
 * `gtag` shim on `dataLayer` and pushes the consent defaults. Static content
 * (no interpolated user/env input).
 */
export function consentDefaultScript(): string {
  return [
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){dataLayer.push(arguments);}",
    `gtag('consent','default',${JSON.stringify(CONSENT_DEFAULTS)});`,
  ].join("")
}
