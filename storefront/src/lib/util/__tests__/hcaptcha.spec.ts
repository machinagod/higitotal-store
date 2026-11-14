import { describe, expect, it, vi } from "vitest"
import {
  CAPTCHA_SERVER_MESSAGE,
  DEFAULT_HCAPTCHA_SITEKEY,
  HCAPTCHA_SCRIPT_SRC,
  HCAPTCHA_SITEKEY,
  TEST_HCAPTCHA_SITEKEY,
  createHcaptchaLoader,
  hcaptchaSize,
  isCaptchaRejection,
  resolveHcaptchaSiteKey,
  type HcaptchaApi,
} from "../hcaptcha"

describe("resolveHcaptchaSiteKey", () => {
  it("defaults to the Higitotal production key", () => {
    expect(resolveHcaptchaSiteKey(undefined)).toBe(DEFAULT_HCAPTCHA_SITEKEY)
    expect(resolveHcaptchaSiteKey(null)).toBe(DEFAULT_HCAPTCHA_SITEKEY)
    expect(resolveHcaptchaSiteKey("  ")).toBe(DEFAULT_HCAPTCHA_SITEKEY)
  })
  it("accepts a build-time override (e.g. the test key)", () => {
    expect(resolveHcaptchaSiteKey(` ${TEST_HCAPTCHA_SITEKEY} `)).toBe(TEST_HCAPTCHA_SITEKEY)
  })
  it("ignores malformed overrides", () => {
    expect(resolveHcaptchaSiteKey("not-a-key")).toBe(DEFAULT_HCAPTCHA_SITEKEY)
    expect(resolveHcaptchaSiteKey('x"><script>')).toBe(DEFAULT_HCAPTCHA_SITEKEY)
  })
  it("exports a well-formed key for the forms", () => {
    expect(HCAPTCHA_SITEKEY).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe("HCAPTCHA_SCRIPT_SRC", () => {
  it("renders explicitly, in Portuguese", () => {
    const url = new URL(HCAPTCHA_SCRIPT_SRC)
    expect(url.origin).toBe("https://js.hcaptcha.com")
    expect(url.searchParams.get("render")).toBe("explicit")
    expect(url.searchParams.get("hl")).toBe("pt")
  })
})

describe("hcaptchaSize", () => {
  it("is compact on narrow viewports or containers", () => {
    expect(hcaptchaSize(600, 1440)).toBe("normal")
    expect(hcaptchaSize(340, 390)).toBe("normal")
    expect(hcaptchaSize(280, 320)).toBe("compact")
    expect(hcaptchaSize(350, 379)).toBe("compact")
    expect(hcaptchaSize(300, 1440)).toBe("compact")
  })
})

describe("isCaptchaRejection", () => {
  it("matches the backend's 400 { message: 'captcha' }", () => {
    expect(isCaptchaRejection({ status: 400, message: CAPTCHA_SERVER_MESSAGE })).toBe(true)
    expect(isCaptchaRejection({ status: 400, message: "name and a valid email are required" })).toBe(false)
    expect(isCaptchaRejection({ status: 502, message: CAPTCHA_SERVER_MESSAGE })).toBe(false)
    expect(isCaptchaRejection(null)).toBe(false)
    expect(isCaptchaRejection("captcha")).toBe(false)
  })
})

describe("createHcaptchaLoader", () => {
  const api = { render: vi.fn(), reset: vi.fn(), remove: vi.fn(), getResponse: vi.fn() } as unknown as HcaptchaApi

  function fakeDom() {
    const win: { hcaptcha?: HcaptchaApi } = {}
    const scripts: Array<{
      src: string
      async: boolean
      defer: boolean
      listeners: Record<string, () => void>
      removed: boolean
      addEventListener(t: string, fn: () => void): void
      remove(): void
    }> = []
    const doc = {
      createElement: () => {
        const s = {
          src: "",
          async: false,
          defer: false,
          listeners: {} as Record<string, () => void>,
          removed: false,
          addEventListener(t: string, fn: () => void) {
            s.listeners[t] = fn
          },
          remove() {
            s.removed = true
          },
        }
        return s
      },
      head: { appendChild: (s: (typeof scripts)[number]) => scripts.push(s) },
    }
    return { win, doc, scripts }
  }

  it("adds one script for every caller and resolves with window.hcaptcha", async () => {
    const { win, doc, scripts } = fakeDom()
    const load = createHcaptchaLoader()
    const a = load(win, doc)
    const b = load(win, doc)
    expect(a).toBe(b)
    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toBe(HCAPTCHA_SCRIPT_SRC)
    expect(scripts[0].async).toBe(true)
    win.hcaptcha = api
    scripts[0].listeners.load()
    await expect(a).resolves.toBe(api)
    // Already loaded: no new script.
    await expect(load(win, doc)).resolves.toBe(api)
    expect(scripts).toHaveLength(1)
  })

  it("rejects on a failed load and lets a later caller retry", async () => {
    const { win, doc, scripts } = fakeDom()
    const load = createHcaptchaLoader("https://example.test/api.js")
    const first = load(win, doc)
    scripts[0].listeners.error()
    await expect(first).rejects.toThrow("failed to load")
    expect(scripts[0].removed).toBe(true)
    const second = load(win, doc)
    expect(scripts).toHaveLength(2)
    expect(scripts[1].src).toBe("https://example.test/api.js")
    win.hcaptcha = api
    scripts[1].listeners.load()
    await expect(second).resolves.toBe(api)
  })

  it("rejects when the script loads but defines no API", async () => {
    const { win, doc, scripts } = fakeDom()
    const load = createHcaptchaLoader()
    const p = load(win, doc)
    scripts[0].listeners.load()
    await expect(p).rejects.toThrow("without window.hcaptcha")
  })
})
