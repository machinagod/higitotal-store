import { isIP } from 'net'

/**
 * hCaptcha server-side verification for `POST /store/contact-request`.
 *
 * Env (backend, runtime):
 *  - `HCAPTCHA_SECRET`   — enables verification. Unset → no check at all
 *                          (local dev / CI).
 *  - `HCAPTCHA_REQUIRED` — "true" rejects requests WITHOUT a token (400
 *                          `captcha`). Anything else accepts and logs them:
 *                          the rollout switch, so the backend can ship before
 *                          the storefront that sends the token.
 *  - `HCAPTCHA_SITEKEY`  — optional; when set it is sent to siteverify so a
 *                          token issued for another site key is refused.
 *
 * A present token is always verified (when the secret is set) and an invalid
 * one is rejected. A network error / timeout / hCaptcha outage — or a
 * configuration error on our side (wrong secret) — fails OPEN: the request is
 * accepted and a warning logged, so an outage never loses a real lead.
 */

export const HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify'

/** hCaptcha response tokens are a few KB; anything far larger is not one. */
export const HCAPTCHA_TOKEN_MAX = 8192

export const HCAPTCHA_TIMEOUT_MS = 5000

/** Message of the 400 the storefront maps to "A verificação expirou…". */
export const CAPTCHA_ERROR_MESSAGE = 'captcha'

/**
 * siteverify error codes that mean OUR configuration is wrong (not the
 * visitor's token). Rejecting on them would reject every real lead, so they
 * fail open like an outage (logged as a warning).
 */
const CONFIG_ERROR_CODES = new Set([
  'missing-input-secret',
  'invalid-input-secret',
  'sitekey-secret-mismatch',
])

export type CaptchaLogger = {
  warn(msg: string): void
  info?(msg: string): void
}

export type CaptchaConfig = {
  secret?: string
  required: boolean
  sitekey?: string
}

/** Reads the hCaptcha settings from the environment (see module doc). */
export function captchaConfigFromEnv(env: Record<string, string | undefined>): CaptchaConfig {
  const secret = env.HCAPTCHA_SECRET?.trim() || undefined
  const sitekey = env.HCAPTCHA_SITEKEY?.trim() || undefined
  const required = ['true', '1', 'yes', 'on'].includes((env.HCAPTCHA_REQUIRED ?? '').trim().toLowerCase())
  return { secret, required, sitekey }
}

export type CaptchaTokenResult =
  | { status: 'ok'; token?: string }
  | { status: 'invalid'; message: string }

/** The optional `hcaptchaToken` body field: trimmed string, length-capped. */
export function readCaptchaToken(raw: unknown): CaptchaTokenResult {
  if (typeof raw !== 'string') return { status: 'ok' }
  const token = raw.trim()
  if (!token) return { status: 'ok' }
  if (token.length > HCAPTCHA_TOKEN_MAX) {
    return { status: 'invalid', message: 'hcaptchaToken is too long' }
  }
  return { status: 'ok', token }
}

/** Client IP from `x-forwarded-for` (first hop), only when it is a valid IP. */
export function clientIp(forwardedFor: string | string[] | undefined): string | undefined {
  const header = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  const first = header?.split(',')[0]?.trim()
  return first && isIP(first) ? first : undefined
}

export type CaptchaOutcome =
  | { ok: true; checked: 'skipped' | 'verified' | 'missing-allowed' | 'fail-open' }
  | { ok: false; reason: 'missing' | 'invalid' }

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean
  status: number
  json(): Promise<unknown>
}>

/**
 * Decides whether a contact request passes the captcha (see module doc).
 * Never throws.
 */
export async function verifyCaptcha(
  token: string | undefined,
  config: CaptchaConfig,
  deps: {
    logger: CaptchaLogger
    remoteip?: string
    fetchImpl?: FetchLike
    timeoutMs?: number
  }
): Promise<CaptchaOutcome> {
  const { logger } = deps
  if (!config.secret) return { ok: true, checked: 'skipped' }

  if (!token) {
    if (config.required) return { ok: false, reason: 'missing' }
    const log = logger.info?.bind(logger) ?? logger.warn.bind(logger)
    log('contact-request: no hCaptcha token (accepted: HCAPTCHA_REQUIRED is not "true")')
    return { ok: true, checked: 'missing-allowed' }
  }

  const form = new URLSearchParams({ secret: config.secret, response: token })
  if (config.sitekey) form.set('sitekey', config.sitekey)
  if (deps.remoteip) form.set('remoteip', deps.remoteip)

  const doFetch = deps.fetchImpl ?? (globalThis.fetch as unknown as FetchLike)
  let data: { success?: unknown; 'error-codes'?: unknown }
  try {
    const res = await doFetch(HCAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(deps.timeoutMs ?? HCAPTCHA_TIMEOUT_MS),
    })
    if (!res.ok) {
      logger.warn(`contact-request: hCaptcha siteverify returned HTTP ${res.status}; accepting (fail-open)`)
      return { ok: true, checked: 'fail-open' }
    }
    data = ((await res.json()) ?? {}) as typeof data
  } catch (error) {
    logger.warn(
      `contact-request: hCaptcha siteverify unreachable (${(error as Error)?.name ?? 'Error'}: ${
        (error as Error)?.message ?? error
      }); accepting (fail-open)`
    )
    return { ok: true, checked: 'fail-open' }
  }

  if (data.success === true) return { ok: true, checked: 'verified' }

  const codes = Array.isArray(data['error-codes']) ? data['error-codes'].map(String) : []
  if (codes.some((c) => CONFIG_ERROR_CODES.has(c))) {
    logger.warn(
      `contact-request: hCaptcha configuration error (${codes.join(', ')}) — check HCAPTCHA_SECRET / HCAPTCHA_SITEKEY; accepting (fail-open)`
    )
    return { ok: true, checked: 'fail-open' }
  }
  logger.warn(`contact-request: hCaptcha token rejected (${codes.join(', ') || 'no error code'})`)
  return { ok: false, reason: 'invalid' }
}
