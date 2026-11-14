import {
  CAPTCHA_ERROR_MESSAGE,
  HCAPTCHA_TOKEN_MAX,
  HCAPTCHA_VERIFY_URL,
  captchaConfigFromEnv,
  clientIp,
  readCaptchaToken,
  verifyCaptcha,
} from "../captcha"
import { parseContactRequest } from "../handler"
import { POST } from "../route"

const TEST_TOKEN = "10000000-aaaa-bbbb-cccc-000000000001"
const TEST_SECRET = "0x0000000000000000000000000000000000000000"

const logger = () => ({ warn: jest.fn(), info: jest.fn() })

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

describe("captchaConfigFromEnv", () => {
  it("reads secret, sitekey and the HCAPTCHA_REQUIRED switch", () => {
    expect(captchaConfigFromEnv({})).toEqual({ secret: undefined, sitekey: undefined, required: false })
    expect(
      captchaConfigFromEnv({ HCAPTCHA_SECRET: " s ", HCAPTCHA_SITEKEY: "k", HCAPTCHA_REQUIRED: "TRUE" })
    ).toEqual({ secret: "s", sitekey: "k", required: true })
    expect(captchaConfigFromEnv({ HCAPTCHA_SECRET: "", HCAPTCHA_REQUIRED: "false" })).toEqual({
      secret: undefined,
      sitekey: undefined,
      required: false,
    })
  })
})

describe("readCaptchaToken", () => {
  it("accepts a trimmed string and ignores non-strings / blanks", () => {
    expect(readCaptchaToken(` ${TEST_TOKEN} `)).toEqual({ status: "ok", token: TEST_TOKEN })
    expect(readCaptchaToken(undefined)).toEqual({ status: "ok" })
    expect(readCaptchaToken(123)).toEqual({ status: "ok" })
    expect(readCaptchaToken("   ")).toEqual({ status: "ok" })
  })

  it("rejects an over-long token", () => {
    expect(readCaptchaToken("x".repeat(HCAPTCHA_TOKEN_MAX + 1))).toEqual({
      status: "invalid",
      message: "hcaptchaToken is too long",
    })
    expect(readCaptchaToken("x".repeat(HCAPTCHA_TOKEN_MAX)).status).toBe("ok")
  })
})

describe("parseContactRequest + hcaptchaToken", () => {
  const base = { name: "Ana", email: "ana@example.pt", message: "Olá" }

  it("returns the token outside the request (never e-mailed)", () => {
    const r = parseContactRequest({ ...base, hcaptchaToken: TEST_TOKEN })
    expect(r.status).toBe("ok")
    if (r.status !== "ok") return
    expect(r.captchaToken).toBe(TEST_TOKEN)
    expect(r.request).not.toHaveProperty("hcaptchaToken")
    expect(r.request).not.toHaveProperty("captchaToken")
  })

  it("400s an over-long token", () => {
    expect(parseContactRequest({ ...base, hcaptchaToken: "x".repeat(HCAPTCHA_TOKEN_MAX + 1) })).toEqual({
      status: "invalid",
      message: "hcaptchaToken is too long",
    })
  })

  it("keeps the honeypot first", () => {
    expect(parseContactRequest({ ...base, company: "bot", hcaptchaToken: "x".repeat(99999) })).toEqual({
      status: "honeypot",
    })
  })
})

describe("clientIp", () => {
  it("takes the first valid hop of x-forwarded-for", () => {
    expect(clientIp("203.0.113.7, 10.0.0.1")).toBe("203.0.113.7")
    expect(clientIp(["2001:db8::1"])).toBe("2001:db8::1")
    expect(clientIp("not-an-ip")).toBeUndefined()
    expect(clientIp(undefined)).toBeUndefined()
  })
})

describe("verifyCaptcha", () => {
  const config = { secret: TEST_SECRET, required: false }

  it("skips everything when HCAPTCHA_SECRET is unset", async () => {
    const fetchImpl = jest.fn()
    const log = logger()
    await expect(
      verifyCaptcha(undefined, { required: true }, { logger: log, fetchImpl })
    ).resolves.toEqual({ ok: true, checked: "skipped" })
    await expect(verifyCaptcha("bad", { required: false }, { logger: log, fetchImpl })).resolves.toEqual({
      ok: true,
      checked: "skipped",
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("accepts a valid token (form-encoded siteverify with sitekey + remoteip)", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ success: true }))
    const out = await verifyCaptcha(
      TEST_TOKEN,
      { ...config, sitekey: "10000000-ffff-ffff-ffff-000000000001" },
      { logger: logger(), fetchImpl, remoteip: "203.0.113.7" }
    )
    expect(out).toEqual({ ok: true, checked: "verified" })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(HCAPTCHA_VERIFY_URL)
    expect(init.method).toBe("POST")
    expect(init.headers["content-type"]).toBe("application/x-www-form-urlencoded")
    expect(init.signal).toBeDefined()
    const sent = new URLSearchParams(init.body)
    expect(Object.fromEntries(sent)).toEqual({
      secret: TEST_SECRET,
      response: TEST_TOKEN,
      sitekey: "10000000-ffff-ffff-ffff-000000000001",
      remoteip: "203.0.113.7",
    })
  })

  it("omits sitekey / remoteip when not known", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ success: true }))
    await verifyCaptcha(TEST_TOKEN, config, { logger: logger(), fetchImpl })
    const sent = new URLSearchParams(fetchImpl.mock.calls[0][1].body)
    expect(sent.has("sitekey")).toBe(false)
    expect(sent.has("remoteip")).toBe(false)
  })

  it("rejects an invalid token", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }))
    const log = logger()
    await expect(verifyCaptcha("bad", config, { logger: log, fetchImpl })).resolves.toEqual({
      ok: false,
      reason: "invalid",
    })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("invalid-input-response"))
  })

  it("rejects success:false without error codes", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ success: false }))
    const log = logger()
    await expect(verifyCaptcha("bad", config, { logger: log, fetchImpl })).resolves.toEqual({
      ok: false,
      reason: "invalid",
    })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("no error code"))
  })

  it("fails open on a network error", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError("fetch failed"))
    const log = logger()
    await expect(verifyCaptcha(TEST_TOKEN, config, { logger: log, fetchImpl })).resolves.toEqual({
      ok: true,
      checked: "fail-open",
    })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("fail-open"))
  })

  it("fails open on a timeout (aborted after timeoutMs)", async () => {
    // A siteverify that never answers on its own: only the abort signal ends it.
    const fetchImpl = jest.fn(
      (_url: string, init: { signal?: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason))
        })
    )
    const log = logger()
    await expect(
      verifyCaptcha(TEST_TOKEN, config, { logger: log, fetchImpl, timeoutMs: 20 })
    ).resolves.toEqual({ ok: true, checked: "fail-open" })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("TimeoutError"))
  })

  it("fails open on an hCaptcha 5xx", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({}, 503))
    const log = logger()
    await expect(verifyCaptcha(TEST_TOKEN, config, { logger: log, fetchImpl })).resolves.toEqual({
      ok: true,
      checked: "fail-open",
    })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("HTTP 503"))
  })

  it("fails open on our own configuration errors (wrong secret)", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse({ success: false, "error-codes": ["invalid-input-secret"] }))
    const log = logger()
    await expect(verifyCaptcha(TEST_TOKEN, config, { logger: log, fetchImpl })).resolves.toEqual({
      ok: true,
      checked: "fail-open",
    })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("configuration error"))
  })

  it("fails open on an unparsable body", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <")
      },
    })
    await expect(verifyCaptcha(TEST_TOKEN, config, { logger: logger(), fetchImpl })).resolves.toEqual({
      ok: true,
      checked: "fail-open",
    })
  })

  it("missing token: accepted and logged when not required", async () => {
    const fetchImpl = jest.fn()
    const log = logger()
    await expect(verifyCaptcha(undefined, config, { logger: log, fetchImpl })).resolves.toEqual({
      ok: true,
      checked: "missing-allowed",
    })
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("no hCaptcha token"))
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("missing token: logs through warn when the logger has no info", async () => {
    const warn = jest.fn()
    await verifyCaptcha(undefined, config, { logger: { warn }, fetchImpl: jest.fn() })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no hCaptcha token"))
  })

  it("missing token: rejected when HCAPTCHA_REQUIRED=true", async () => {
    const fetchImpl = jest.fn()
    await expect(
      verifyCaptcha(undefined, { ...config, required: true }, { logger: logger(), fetchImpl })
    ).resolves.toEqual({ ok: false, reason: "missing" })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("uses the global fetch by default", async () => {
    const spy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ success: true }) as unknown as Response)
    await expect(verifyCaptcha(TEST_TOKEN, config, { logger: logger() })).resolves.toEqual({
      ok: true,
      checked: "verified",
    })
    expect(spy).toHaveBeenCalledWith(HCAPTCHA_VERIFY_URL, expect.objectContaining({ method: "POST" }))
    spy.mockRestore()
  })
})

describe("POST /store/contact-request (captcha gate)", () => {
  const ENV_KEYS = ["HCAPTCHA_SECRET", "HCAPTCHA_REQUIRED", "HCAPTCHA_SITEKEY", "CONTACT_REQUEST_EMAIL"]
  const saved: Record<string, string | undefined> = {}
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k]
    for (const k of ENV_KEYS) delete process.env[k]
    fetchSpy = jest.spyOn(globalThis, "fetch")
  })
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
    fetchSpy.mockRestore()
  })

  const call = async (body: Record<string, unknown>, headers: Record<string, string> = {}) => {
    const createNotifications = jest.fn().mockResolvedValue([{ status: "success" }])
    const log = logger()
    const req = {
      body,
      headers,
      scope: {
        resolve: (key: string) => (key === "logger" ? log : { createNotifications }),
      },
    }
    const res = {
      statusCode: 200,
      payload: undefined as unknown,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(p: unknown) {
        this.payload = p
        return this
      },
    }
    await POST(req as never, res as never)
    return { res, createNotifications, log }
  }

  const body = { name: "Ana", email: "ana@example.pt", message: "Olá" }

  it("no secret: no verification, e-mails sent", async () => {
    const { res, createNotifications } = await call(body)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ ok: true })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(createNotifications).toHaveBeenCalledTimes(2)
    // The token never reaches the e-mail data.
    expect(createNotifications.mock.calls[0][0].data).not.toHaveProperty("hcaptchaToken")
  })

  it("valid token: verified before the e-mail, with remoteip from x-forwarded-for", async () => {
    process.env.HCAPTCHA_SECRET = TEST_SECRET
    fetchSpy.mockResolvedValue(jsonResponse({ success: true }) as unknown as Response)
    const { res, createNotifications } = await call(
      { ...body, hcaptchaToken: TEST_TOKEN },
      { "x-forwarded-for": "198.51.100.4, 10.0.0.2" }
    )
    expect(res.statusCode).toBe(200)
    expect(new URLSearchParams(fetchSpy.mock.calls[0][1].body).get("remoteip")).toBe("198.51.100.4")
    expect(fetchSpy.mock.invocationCallOrder[0]).toBeLessThan(
      createNotifications.mock.invocationCallOrder[0]
    )
    expect(createNotifications.mock.calls[0][0].data).not.toHaveProperty("hcaptchaToken")
    expect(createNotifications.mock.calls[0][0].data).not.toHaveProperty("captchaToken")
  })

  it("invalid token: 400 captcha and no e-mail", async () => {
    process.env.HCAPTCHA_SECRET = TEST_SECRET
    fetchSpy.mockResolvedValue(
      jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }) as unknown as Response
    )
    const { res, createNotifications } = await call({ ...body, hcaptchaToken: "forged" })
    expect(res.statusCode).toBe(400)
    expect(res.payload).toEqual({ message: CAPTCHA_ERROR_MESSAGE })
    expect(createNotifications).not.toHaveBeenCalled()
  })

  it("network error: fails open (e-mail sent, warning logged)", async () => {
    process.env.HCAPTCHA_SECRET = TEST_SECRET
    fetchSpy.mockRejectedValue(new TypeError("fetch failed"))
    const { res, createNotifications, log } = await call({ ...body, hcaptchaToken: TEST_TOKEN })
    expect(res.statusCode).toBe(200)
    expect(createNotifications).toHaveBeenCalledTimes(2)
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("fail-open"))
  })

  it("missing token, HCAPTCHA_REQUIRED unset/false: accepted and logged", async () => {
    process.env.HCAPTCHA_SECRET = TEST_SECRET
    process.env.HCAPTCHA_REQUIRED = "false"
    const { res, createNotifications, log } = await call(body)
    expect(res.statusCode).toBe(200)
    expect(createNotifications).toHaveBeenCalledTimes(2)
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("no hCaptcha token"))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("missing token, HCAPTCHA_REQUIRED=true: 400 captcha and no e-mail", async () => {
    process.env.HCAPTCHA_SECRET = TEST_SECRET
    process.env.HCAPTCHA_REQUIRED = "true"
    const { res, createNotifications } = await call(body)
    expect(res.statusCode).toBe(400)
    expect(res.payload).toEqual({ message: CAPTCHA_ERROR_MESSAGE })
    expect(createNotifications).not.toHaveBeenCalled()
  })

  it("honeypot still pretends success without verifying", async () => {
    process.env.HCAPTCHA_SECRET = TEST_SECRET
    process.env.HCAPTCHA_REQUIRED = "true"
    const { res, createNotifications } = await call({ ...body, company: "bot" })
    expect(res.payload).toEqual({ ok: true })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(createNotifications).not.toHaveBeenCalled()
  })

  it("invalid body: 400 before any verification", async () => {
    process.env.HCAPTCHA_SECRET = TEST_SECRET
    const { res } = await call({ email: "x" })
    expect(res.statusCode).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("staff e-mail failure still 502s after a valid captcha", async () => {
    const createNotifications = jest.fn().mockResolvedValue([{ status: "failure" }])
    const log = logger()
    const req = {
      body,
      headers: {},
      scope: { resolve: (key: string) => (key === "logger" ? log : { createNotifications }) },
    }
    const res = { statusCode: 200, status: jest.fn(), json: jest.fn() }
    res.status.mockReturnValue(res)
    await POST(req as never, res as never)
    expect(res.status).toHaveBeenCalledWith(502)
    // Not a lead: nothing logged as one.
    expect(log.info).not.toHaveBeenCalledWith(expect.stringMatching(/^lead:/))
  })

  it("accepted lead: one PII-free structured log line", async () => {
    const { log } = await call({
      ...body,
      kind: "produto",
      productTitle: "Drip Floor",
      productUrl: "https://www.higitotal.pt/dk/products/drip-floor?utm_source=x#top",
      phone: "912345678",
    })
    expect(log.info).toHaveBeenCalledWith("lead: kind=produto items=0 path=/dk/products/drip-floor")
    const line = log.info.mock.calls.map((c: unknown[]) => String(c[0])).join("\n")
    for (const pii of ["Ana", "ana@example.pt", "912345678", "Olá", "utm_source"]) {
      expect(line).not.toContain(pii)
    }
  })

  it("accepted quote list: logged as orcamento with its line count", async () => {
    const { log } = await call({
      ...body,
      kind: "produto",
      items: [{ sku: "A1", quantity: 2 }, { title: "Balde", quantity: 1 }],
      productUrl: "https://www.higitotal.pt/dk/orcamento",
    })
    expect(log.info).toHaveBeenCalledWith("lead: kind=orcamento items=2 path=/dk/orcamento")
  })
})
