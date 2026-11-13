/**
 * Browser side of the cookie consent: store the choice, tell Google Consent
 * Mode, and clear Google Analytics cookies when statistics are refused. Every
 * call is wrapped so a failure never breaks the page (consent then simply
 * stays denied).
 */
import {
  analyticsCookieNames,
  consentCookieString,
  cookieDeletionStrings,
  readConsent,
  type ConsentChoice,
} from "./cookie"

/** Window event that (re)opens the banner on its "Personalizar" panel. */
export const CONSENT_OPEN_EVENT = "ht:consent-open"

type DataLayerWindow = Window & { dataLayer?: unknown[] }

/** The stored, valid choice for this browser, or null. */
export function getStoredConsent(): ConsentChoice | null {
  try {
    return readConsent(document.cookie)
  } catch {
    return null
  }
}

/**
 * Same as the standard `gtag()` shim: Consent Mode commands must reach the
 * dataLayer as an `arguments` object, not an array.
 */
function gtag(..._args: unknown[]) {
  const w = window as DataLayerWindow
  w.dataLayer = w.dataLayer || []
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments)
}

/** Deletes `_ga` / `_ga_*` on this host and its parent domains. */
export function deleteAnalyticsCookies(): void {
  try {
    const host = window.location.hostname
    for (const name of analyticsCookieNames(document.cookie)) {
      for (const s of cookieDeletionStrings(name, host)) {
        document.cookie = s
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Records the visitor's choice: stores `ht_consent`, sends the Consent Mode
 * update (statistics only — ad consent is never granted) plus a
 * `consent_update` dataLayer event, and deletes GA cookies on refusal.
 */
export function saveConsent(analytics: boolean): ConsentChoice {
  const choice: ConsentChoice = {
    analytics,
    ts: Math.floor(Date.now() / 1000),
  }
  try {
    document.cookie = consentCookieString(choice, {
      secure: window.location.protocol === "https:",
    })
  } catch {
    // ignore: the banner will ask again on the next visit
  }
  const state = analytics ? "granted" : "denied"
  try {
    gtag("consent", "update", { analytics_storage: state })
    const w = window as DataLayerWindow
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({ event: "consent_update", analytics: state })
  } catch {
    // ignore
  }
  if (!analytics) deleteAnalyticsCookies()
  return choice
}

/** Opens the consent banner on its preferences panel (footer / cookie policy). */
export function openConsentPreferences(): void {
  try {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
  } catch {
    // ignore
  }
}
