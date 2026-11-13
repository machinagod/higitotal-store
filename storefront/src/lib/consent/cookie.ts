/**
 * First-party cookie consent: the stored choice (`ht_consent`) and the pure
 * helpers that read and write it. Framework-free, so every rule is unit
 * tested; the browser side effects live in ./client and the banner in
 * @modules/common/components/cookie-consent.
 *
 * Format: `v<version>:analytics=<0|1>:ts=<unix seconds>`, e.g.
 * `v1:analytics=1:ts=1794528000`. Only "statistics" (Google Analytics) is a
 * consent category: there are no ads tags, so ad consent is never asked for
 * and stays denied.
 */

export const CONSENT_COOKIE = "ht_consent"

/**
 * Bump to ask every visitor again (e.g. a new tool or purpose is added): a
 * stored choice with another version is treated as no choice at all.
 */
export const CONSENT_VERSION = 1

/** 180 days, in seconds. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

export type ConsentChoice = {
  analytics: boolean
  /** When the choice was made, unix seconds. */
  ts: number
}

const VALUE_RE = /^v(\d+):analytics=([01]):ts=(\d{1,12})$/

/** Cookie value for a choice. */
export function serializeConsent(choice: ConsentChoice): string {
  const ts = Math.max(0, Math.floor(choice.ts))
  return `v${CONSENT_VERSION}:analytics=${choice.analytics ? 1 : 0}:ts=${ts}`
}

/**
 * Parses a stored cookie value. Anything malformed, or written by another
 * CONSENT_VERSION, is `null` (= no valid choice → the banner asks again).
 */
export function parseConsent(value: string | null | undefined): ConsentChoice | null {
  if (!value) return null
  let raw = value.trim()
  try {
    raw = decodeURIComponent(raw)
  } catch {
    return null
  }
  const m = VALUE_RE.exec(raw)
  if (!m || Number(m[1]) !== CONSENT_VERSION) return null
  return { analytics: m[2] === "1", ts: Number(m[3]) }
}

/** Value of one cookie in a `document.cookie`-style header, or null. */
export function readCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=")
    if (eq < 0) continue
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}

/** The stored choice, read from a `document.cookie`-style string. */
export function readConsent(cookieHeader: string): ConsentChoice | null {
  return parseConsent(readCookie(cookieHeader, CONSENT_COOKIE))
}

/** Full `document.cookie` assignment that stores a choice. */
export function consentCookieString(
  choice: ConsentChoice,
  opts: { secure: boolean }
): string {
  return [
    `${CONSENT_COOKIE}=${serializeConsent(choice)}`,
    "Path=/",
    `Max-Age=${CONSENT_MAX_AGE}`,
    "SameSite=Lax",
    ...(opts.secure ? ["Secure"] : []),
  ].join("; ")
}

/** Google Analytics cookies: `_ga` and `_ga_<container>` (e.g. `_ga_SWG8Q2W0PQ`). */
export function isAnalyticsCookie(name: string): boolean {
  return name === "_ga" || name.startsWith("_ga_")
}

/** Names of the Google Analytics cookies present in a `document.cookie` string. */
export function analyticsCookieNames(cookieHeader: string): string[] {
  const names = cookieHeader
    .split(";")
    .map((p) => p.split("=")[0].trim())
    .filter(isAnalyticsCookie)
  return Array.from(new Set(names))
}

/**
 * Domains a cookie for this host may have been written on: the host itself
 * and each parent domain with at least two labels (GA writes on the
 * registrable domain, e.g. `.higitotal.pt` from store.higitotal.pt). An IP
 * address or a single-label host (localhost) has no domain variants.
 */
export function cookieDomainCandidates(hostname: string): string[] {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "")
  if (!host || /^[\d.]+$/.test(host) || host.includes(":")) return []
  const labels = host.split(".")
  const out: string[] = []
  for (let i = 0; i <= labels.length - 2; i++) {
    out.push(labels.slice(i).join("."))
  }
  return out
}

/**
 * `document.cookie` assignments that delete one cookie wherever it may live:
 * host-only (no Domain) and on each candidate domain, with and without a
 * leading dot (browsers treat them alike; the dot form is what GA writes).
 */
export function cookieDeletionStrings(name: string, hostname: string): string[] {
  const base = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  const out = [base]
  for (const d of cookieDomainCandidates(hostname)) {
    out.push(`${base}; Domain=${d}`, `${base}; Domain=.${d}`)
  }
  return out
}
