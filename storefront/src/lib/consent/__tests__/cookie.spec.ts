import { describe, expect, it } from "vitest"
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_VERSION,
  analyticsCookieNames,
  consentCookieString,
  cookieDeletionStrings,
  cookieDomainCandidates,
  isAnalyticsCookie,
  parseConsent,
  readConsent,
  readCookie,
  serializeConsent,
} from "../cookie"

describe("serializeConsent / parseConsent", () => {
  it("round-trips a choice", () => {
    for (const analytics of [true, false]) {
      const choice = { analytics, ts: 1794528000 }
      expect(parseConsent(serializeConsent(choice))).toEqual(choice)
    }
  })

  it("uses the compact versioned format", () => {
    expect(serializeConsent({ analytics: true, ts: 1794528000.7 })).toBe(
      `v${CONSENT_VERSION}:analytics=1:ts=1794528000`
    )
    expect(serializeConsent({ analytics: false, ts: -5 })).toBe(
      `v${CONSENT_VERSION}:analytics=0:ts=0`
    )
  })

  it("treats another version as no choice (bumping the version re-asks)", () => {
    expect(parseConsent(`v${CONSENT_VERSION + 1}:analytics=1:ts=1`)).toBeNull()
    expect(parseConsent("v0:analytics=1:ts=1")).toBeNull()
  })

  it("rejects malformed values", () => {
    for (const v of [
      null,
      undefined,
      "",
      "1",
      "v1",
      "v1:analytics=yes:ts=1",
      "v1:analytics=1",
      "v1:analytics=1:ts=abc",
      "v1:analytics=1:ts=1:x=2",
      "%E0%A4%A",
    ]) {
      expect(parseConsent(v as string | null | undefined)).toBeNull()
    }
  })

  it("accepts a URL-encoded value", () => {
    expect(parseConsent("v1%3Aanalytics%3D1%3Ats%3D10")).toEqual({
      analytics: true,
      ts: 10,
    })
  })
})

describe("readCookie / readConsent", () => {
  const header = `_ga=GA1.1.2; ${CONSENT_COOKIE}=v1:analytics=0:ts=42; x=1`
  it("finds one cookie by exact name", () => {
    expect(readCookie(header, "x")).toBe("1")
    expect(readCookie(header, "_g")).toBeNull()
    expect(readCookie("", "x")).toBeNull()
  })
  it("reads the stored choice", () => {
    expect(readConsent(header)).toEqual({ analytics: false, ts: 42 })
    expect(readConsent("_ga=1")).toBeNull()
  })
})

describe("consentCookieString", () => {
  it("is first-party, 180 days, SameSite=Lax on path /", () => {
    const s = consentCookieString({ analytics: true, ts: 1 }, { secure: false })
    expect(s).toBe(
      `ht_consent=v1:analytics=1:ts=1; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax`
    )
    expect(CONSENT_MAX_AGE).toBe(180 * 24 * 60 * 60)
  })
  it("adds Secure on https", () => {
    expect(
      consentCookieString({ analytics: false, ts: 1 }, { secure: true })
    ).toMatch(/; Secure$/)
  })
})

describe("Google Analytics cookie cleanup", () => {
  it("recognises _ga and _ga_<id> only", () => {
    expect(isAnalyticsCookie("_ga")).toBe(true)
    expect(isAnalyticsCookie("_ga_SWG8Q2W0PQ")).toBe(true)
    expect(isAnalyticsCookie("_gat")).toBe(false)
    expect(isAnalyticsCookie("ht_consent")).toBe(false)
  })

  it("lists the GA cookies present, once each", () => {
    expect(
      analyticsCookieNames(
        "_ga=1; ht_consent=v1:analytics=1:ts=1; _ga_SWG8Q2W0PQ=GS1; _ga=2"
      )
    ).toEqual(["_ga", "_ga_SWG8Q2W0PQ"])
    expect(analyticsCookieNames("")).toEqual([])
  })

  it("targets the host and every parent domain (GA writes on .higitotal.pt)", () => {
    expect(cookieDomainCandidates("store.higitotal.pt")).toEqual([
      "store.higitotal.pt",
      "higitotal.pt",
    ])
    expect(cookieDomainCandidates("www.higitotal.pt.")).toEqual([
      "www.higitotal.pt",
      "higitotal.pt",
    ])
    expect(cookieDomainCandidates("localhost")).toEqual([])
    expect(cookieDomainCandidates("127.0.0.1")).toEqual([])
    expect(cookieDomainCandidates("::1")).toEqual([])
  })

  it("expires the cookie host-only and on each domain", () => {
    const s = cookieDeletionStrings("_ga", "store.higitotal.pt")
    expect(s).toHaveLength(5)
    expect(s[0]).toBe(
      "_ga=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    )
    expect(s).toContain(`${s[0]}; Domain=.higitotal.pt`)
    expect(s).toContain(`${s[0]}; Domain=store.higitotal.pt`)
    expect(cookieDeletionStrings("_ga", "localhost")).toEqual([s[0]])
  })
})
