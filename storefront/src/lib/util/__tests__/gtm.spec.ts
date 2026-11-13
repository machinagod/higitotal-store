import { describe, expect, it } from "vitest"
import {
  CONSENT_DEFAULTS,
  DEFAULT_GTM_ID,
  consentDefaultScript,
  resolveGtmId,
} from "../gtm"

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
