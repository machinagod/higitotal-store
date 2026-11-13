import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  CONSENT_OPEN_EVENT,
  deleteAnalyticsCookies,
  getStoredConsent,
  openConsentPreferences,
  saveConsent,
} from "../client"

/** Minimal document.cookie jar: records every write, honours Max-Age=0. */
function fakeDocument(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial))
  const writes: string[] = []
  return {
    jar,
    writes,
    doc: {
      get cookie() {
        return Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ")
      },
      set cookie(s: string) {
        writes.push(s)
        const [pair, ...attrs] = s.split(";").map((p) => p.trim())
        const eq = pair.indexOf("=")
        const name = pair.slice(0, eq)
        if (attrs.some((a) => /^max-age=0$/i.test(a))) jar.delete(name)
        else jar.set(name, pair.slice(eq + 1))
      },
    },
  }
}

function fakeWindow(protocol = "https:", hostname = "store.higitotal.pt") {
  const events: string[] = []
  return {
    events,
    win: {
      location: { protocol, hostname },
      dataLayer: undefined as unknown[] | undefined,
      dispatchEvent: (e: Event) => {
        events.push(e.type)
        return true
      },
    },
  }
}

describe("consent client", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-13T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("reads the stored choice (null when absent or unreadable)", () => {
    const { doc } = fakeDocument({ ht_consent: "v1:analytics=1:ts=5" })
    vi.stubGlobal("document", doc)
    expect(getStoredConsent()).toEqual({ analytics: true, ts: 5 })
    vi.stubGlobal("document", fakeDocument().doc)
    expect(getStoredConsent()).toBeNull()
    vi.stubGlobal("document", {
      get cookie(): string {
        throw new Error("blocked")
      },
    })
    expect(getStoredConsent()).toBeNull()
  })

  it("accepting stores the cookie (Secure on https) and grants analytics_storage only", () => {
    const { doc, jar, writes } = fakeDocument({ _ga: "GA1.1.1" })
    const { win } = fakeWindow()
    vi.stubGlobal("document", doc)
    vi.stubGlobal("window", win)

    const choice = saveConsent(true)
    const ts = Math.floor(Date.parse("2026-11-13T12:00:00Z") / 1000)
    expect(choice).toEqual({ analytics: true, ts })
    expect(jar.get("ht_consent")).toBe(`v1:analytics=1:ts=${ts}`)
    expect(writes[0]).toMatch(/; SameSite=Lax; Secure$/)
    expect(jar.has("_ga")).toBe(true) // never deleted on accept

    const [cmd, evt] = win.dataLayer as unknown[]
    expect(Array.from(cmd as IArguments)).toEqual([
      "consent",
      "update",
      { analytics_storage: "granted" },
    ])
    expect(evt).toEqual({ event: "consent_update", analytics: "granted" })
  })

  it("refusing stores analytics=0, denies, and deletes GA cookies on host + parent domain", () => {
    const { doc, jar, writes } = fakeDocument({
      _ga: "GA1.1.1",
      _ga_SWG8Q2W0PQ: "GS1",
      ht_access: "x",
    })
    const { win } = fakeWindow("http:")
    vi.stubGlobal("document", doc)
    vi.stubGlobal("window", win)

    saveConsent(false)
    expect(jar.get("ht_consent")).toMatch(/^v1:analytics=0:ts=\d+$/)
    expect(writes[0]).not.toMatch(/Secure/)
    expect(jar.has("_ga")).toBe(false)
    expect(jar.has("_ga_SWG8Q2W0PQ")).toBe(false)
    expect(jar.get("ht_access")).toBe("x")
    expect(writes).toContain(
      "_ga=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=.higitotal.pt"
    )
    const dl = win.dataLayer as unknown[]
    expect(Array.from(dl[0] as IArguments)[2]).toEqual({ analytics_storage: "denied" })
    expect(dl[1]).toEqual({ event: "consent_update", analytics: "denied" })
  })

  it("never throws, even when cookies and the dataLayer are unusable", () => {
    vi.stubGlobal("document", {
      get cookie(): string {
        throw new Error("blocked")
      },
      set cookie(_v: string) {
        throw new Error("blocked")
      },
    })
    vi.stubGlobal("window", {
      location: { protocol: "https:", hostname: "x.pt" },
      get dataLayer(): unknown[] {
        throw new Error("nope")
      },
    })
    expect(() => saveConsent(false)).not.toThrow()
    expect(() => deleteAnalyticsCookies()).not.toThrow()
    expect(() => openConsentPreferences()).not.toThrow()
  })

  it("opens the preferences panel through a window event", () => {
    const { win, events } = fakeWindow()
    vi.stubGlobal("window", win)
    openConsentPreferences()
    expect(events).toEqual([CONSENT_OPEN_EVENT])
  })
})
