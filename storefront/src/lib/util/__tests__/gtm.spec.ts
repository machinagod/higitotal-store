import { describe, expect, it } from "vitest"
import {
  CONSENT_DEFAULTS,
  DEFAULT_GTM_ID,
  analyticsEnabled,
  consentDefaultScript,
  resolveGtmId,
} from "../gtm"
import {
  CONSENT_VERSION,
  parseConsent,
  serializeConsent,
} from "@lib/consent/cookie"

describe("resolveGtmId", () => {
  it("uses the Higitotal container by default in production", () => {
    expect(resolveGtmId({ NODE_ENV: "production" })).toBe(DEFAULT_GTM_ID)
  })
  it("never loads outside production builds", () => {
    expect(resolveGtmId({ NODE_ENV: "development" })).toBeNull()
    expect(resolveGtmId({ NODE_ENV: "test", NEXT_PUBLIC_GTM_ID: "GTM-ABC123" })).toBeNull()
  })
  it("can be overridden or disabled by NEXT_PUBLIC_GTM_ID", () => {
    expect(resolveGtmId({ NODE_ENV: "production", NEXT_PUBLIC_GTM_ID: "GTM-ABC123" })).toBe("GTM-ABC123")
    expect(resolveGtmId({ NODE_ENV: "production", NEXT_PUBLIC_GTM_ID: "" })).toBeNull()
  })
  it("rejects malformed ids (never interpolates arbitrary strings into a script)", () => {
    expect(resolveGtmId({ NODE_ENV: "production", NEXT_PUBLIC_GTM_ID: "GTM-1');alert(1)//" })).toBeNull()
  })
})

describe("consentDefaultScript", () => {
  function run(script: string) {
    const w: { dataLayer?: unknown[] } = {}
    // Evaluate as the browser would: globals live on `window`.
    new Function("window", `var dataLayer; ${script.replace(
      "window.dataLayer=window.dataLayer||[];",
      "window.dataLayer=window.dataLayer||[];dataLayer=window.dataLayer;"
    )}`)(w)
    return w.dataLayer as IArguments[]
  }

  it("denies every non-essential storage type by default (Consent Mode v2)", () => {
    expect(CONSENT_DEFAULTS).toMatchObject({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    })
  })

  it("pushes a single gtag('consent','default', …) command onto dataLayer", () => {
    const dl = run(consentDefaultScript())
    expect(dl).toHaveLength(1)
    const args = Array.from(dl[0])
    expect(args[0]).toBe("consent")
    expect(args[1]).toBe("default")
    expect(args[2]).toEqual(CONSENT_DEFAULTS)
  })

  it("keeps an existing dataLayer (never clobbers earlier pushes)", () => {
    const script = consentDefaultScript()
    expect(script.startsWith("window.dataLayer=window.dataLayer||[];")).toBe(true)
    expect(script).toContain("function gtag(){dataLayer.push(arguments);}")
  })
})

describe("analyticsEnabled", () => {
  it("is on when GTM loads (production) or a GA4 id is set", () => {
    expect(analyticsEnabled({ NODE_ENV: "production" })).toBe(true)
    expect(
      analyticsEnabled({
        NODE_ENV: "development",
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC",
      })
    ).toBe(true)
  })
  it("is off when no Google tag loads", () => {
    expect(analyticsEnabled({ NODE_ENV: "development" })).toBe(false)
    expect(
      analyticsEnabled({ NODE_ENV: "production", NEXT_PUBLIC_GTM_ID: "" })
    ).toBe(false)
  })
})

describe("consentDefaultScript — stored choice", () => {
  /** Runs the script with a fake window/document, as the browser would. */
  function runWith(cookie: string | (() => string)) {
    const w: { dataLayer?: unknown[] } = {}
    const doc = {
      get cookie() {
        return typeof cookie === "function" ? cookie() : cookie
      },
    }
    new Function(
      "window",
      "document",
      `var dataLayer; ${consentDefaultScript().replace(
        "window.dataLayer=window.dataLayer||[];",
        "window.dataLayer=window.dataLayer||[];dataLayer=window.dataLayer;"
      )}`
    )(w, doc)
    return (w.dataLayer as IArguments[]).map((a) => Array.from(a))
  }
  const granted = serializeConsent({ analytics: true, ts: 1794528000 })
  const denied = serializeConsent({ analytics: false, ts: 1794528000 })

  it("grants analytics_storage right after the defaults when statistics were accepted", () => {
    const dl = runWith(`_ga=GA1.1.1; ht_consent=${granted}; other=1`)
    expect(dl).toHaveLength(2)
    expect(dl[0].slice(0, 2)).toEqual(["consent", "default"])
    expect(dl[1]).toEqual([
      "consent",
      "update",
      { analytics_storage: "granted" },
    ])
  })

  it("never grants anything else (ad consent stays denied)", () => {
    const dl = runWith(`ht_consent=${granted}`)
    expect(Object.keys(dl[1][2] as object)).toEqual(["analytics_storage"])
  })

  it("stays denied when statistics were refused, or nothing is stored", () => {
    expect(runWith(`ht_consent=${denied}`)).toHaveLength(1)
    expect(runWith("")).toHaveLength(1)
    expect(runWith("foo=bar")).toHaveLength(1)
  })

  it("stays denied for another consent version, a look-alike name or a malformed value", () => {
    expect(
      runWith(`ht_consent=v${CONSENT_VERSION + 1}:analytics=1:ts=1`)
    ).toHaveLength(1)
    expect(runWith(`xht_consent=${granted}`)).toHaveLength(1)
    expect(runWith(`ht_consent=${granted}x`)).toHaveLength(1)
    expect(runWith("ht_consent=v1:analytics=1")).toHaveLength(1)
  })

  it("is fail-safe: a throwing document.cookie leaves everything denied", () => {
    const dl = runWith(() => {
      throw new Error("blocked")
    })
    expect(dl).toHaveLength(1)
    expect(dl[0][1]).toBe("default")
  })

  it("agrees with parseConsent on what counts as granted", () => {
    const values = [
      granted,
      denied,
      "v1:analytics=1:ts=0",
      "v1:analytics=1:ts=",
      "v1:analytics=2:ts=5",
      `v${CONSENT_VERSION + 1}:analytics=1:ts=5`,
      "v1:analytics=1:ts=5:extra",
      "garbage",
    ]
    for (const v of values) {
      const headGrants = runWith(`a=1; ht_consent=${v}; b=2`).length === 2
      expect(headGrants, v).toBe(parseConsent(v)?.analytics === true)
    }
  })
})
