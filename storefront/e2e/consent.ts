import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  serializeConsent,
} from "../src/lib/consent/cookie"

/**
 * The cookie banner (production builds, where GTM loads) is a fixed card at
 * the bottom of the viewport. e2e runs start with a stored choice instead, so
 * the banner never covers what a test clicks and the test intent is
 * unchanged. Statistics are REFUSED: test traffic (incl. the post-deploy
 * prod suite) never sets GA cookies or counts as consented analytics.
 */
export function consentCookie(baseURL: string) {
  const url = new URL(baseURL)
  return {
    name: CONSENT_COOKIE,
    value: serializeConsent({
      analytics: false,
      ts: Math.floor(Date.now() / 1000),
    }),
    domain: url.hostname,
    path: "/",
    expires: Math.floor(Date.now() / 1000) + CONSENT_MAX_AGE,
    httpOnly: false,
    secure: url.protocol === "https:",
    sameSite: "Lax" as const,
  }
}

/** A Playwright `storageState` holding only the consent cookie. */
export function consentStorageState(baseURL: string | undefined) {
  if (!baseURL) return undefined
  return { cookies: [consentCookie(baseURL)], origins: [] }
}
