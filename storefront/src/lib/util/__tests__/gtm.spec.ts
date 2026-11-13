import { describe, expect, it } from "vitest"
import { DEFAULT_GTM_ID, resolveGtmId } from "../gtm"

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
