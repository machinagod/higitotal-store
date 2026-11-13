/**
 * Google Tag Manager container id. Defaults to the Higitotal container so the
 * production image loads it without extra build config; set
 * NEXT_PUBLIC_GTM_ID to another id to switch containers, or to an empty string
 * to disable GTM. Only loaded in production builds (never in `next dev`).
 *
 * Consent: the storefront has its own first-party cookie banner
 * (@modules/common/components/cookie-consent, choice stored in `ht_consent`,
 * see @lib/consent). The <head> script below declares the Google Consent
 * Mode v2 *defaults* (everything non-essential denied) before GTM loads and
 * immediately restores a returning visitor's "statistics" consent, so no tag
 * can set analytics cookies without consent, and the first page view after
 * accepting is measured. Ad consent is never granted (there are no ads tags).
 */
import { CONSENT_COOKIE, CONSENT_VERSION } from "@lib/consent/cookie"

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
 * True when a Google tag (GTM or a direct GA4 measurement id) loads, i.e.
 * when there is something to ask consent for. Gates the consent defaults,
 * the banner and the "Preferências de cookies" buttons alike.
 */
export function analyticsEnabled(
  env: {
    NEXT_PUBLIC_GTM_ID?: string
    NEXT_PUBLIC_GA_MEASUREMENT_ID?: string
    NODE_ENV?: string
  } = {
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NODE_ENV: process.env.NODE_ENV,
  }
): boolean {
  return !!resolveGtmId(env) || !!env.NEXT_PUBLIC_GA_MEASUREMENT_ID
}

/**
 * Google Consent Mode v2 defaults: deny all analytics/ads storage until the
 * visitor accepts statistics in the cookie banner. `functionality_storage`
 * and `security_storage` cover strictly necessary cookies and stay granted.
 * `wait_for_update` is kept as a safety margin for any consent update that
 * arrives after the defaults (the stored choice itself is restored
 * synchronously by the same script).
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
 * Matches a stored `ht_consent` cookie that grants statistics in the current
 * consent version, inside `document.cookie`. Must accept exactly what
 * parseConsent() accepts as `analytics: true` (asserted by the tests).
 */
export const GRANTED_COOKIE_PATTERN = `(?:^|;\\s*)${CONSENT_COOKIE}=v${CONSENT_VERSION}:analytics=1:ts=\\d{1,12}(?:;|$)`

/**
 * Inline script for <head>, run before GTM/gtag load: defines the standard
 * `gtag` shim on `dataLayer`, pushes the consent defaults and then, if the
 * visitor already accepted statistics (`ht_consent` cookie), grants
 * `analytics_storage` straight away — before gtm.js is even requested.
 * Fail-safe: any error leaves everything denied. Static content (no
 * interpolated user/env input).
 */
export function consentDefaultScript(): string {
  return [
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){dataLayer.push(arguments);}",
    `gtag('consent','default',${JSON.stringify(CONSENT_DEFAULTS)});`,
    `try{if(/${GRANTED_COOKIE_PATTERN}/.test(document.cookie)){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}`,
  ].join("")
}
