/**
 * hCaptcha on the contact / quote / assistência forms. Framework-free helpers
 * (site key, script loader, widget size, error mapping); the React widget is
 * `@modules/common/components/hcaptcha`. The backend verifies the token
 * (`POST /store/contact-request`, see backend `contact-request/captcha.ts`).
 *
 * Privacy: the script is only requested when a form is shown (never
 * site-wide); see the privacy and cookie policies.
 */

/** Higitotal production site key (public). */
export const DEFAULT_HCAPTCHA_SITEKEY = "5040463c-f2f2-469a-96ae-ce5ed27a9c44"

/** hCaptcha's official always-pass test site key (local / automated testing). */
export const TEST_HCAPTCHA_SITEKEY = "10000000-ffff-ffff-ffff-000000000001"

const SITEKEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Build-time override (`NEXT_PUBLIC_HCAPTCHA_SITEKEY`), else the production
 * key. Blank or malformed values fall back to the default.
 */
export function resolveHcaptchaSiteKey(value: string | undefined | null): string {
  const v = (value ?? "").trim()
  return SITEKEY_RE.test(v) ? v : DEFAULT_HCAPTCHA_SITEKEY
}

/** Site key used by the forms (inlined at build time). */
export const HCAPTCHA_SITEKEY = resolveHcaptchaSiteKey(
  process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY
)

/** Widget language. */
export const HCAPTCHA_LANGUAGE = "pt"

/** Explicit rendering, Portuguese UI. */
export const HCAPTCHA_SCRIPT_SRC =
  "https://js.hcaptcha.com/1/api.js?render=explicit&hl=pt"

/** hCaptcha's privacy policy (linked from the privacy / cookie policies). */
export const HCAPTCHA_PRIVACY_URL = "https://www.hcaptcha.com/privacy"

/** Inline error when the form is submitted without solving the widget. */
export const CAPTCHA_REQUIRED_MESSAGE = "Confirme que não é um robô."

/** Shown (and the widget reset) when the backend refuses the token (400 "captcha"). */
export const CAPTCHA_EXPIRED_MESSAGE = "A verificação expirou. Tente novamente."

/** Message of the backend's 400 for a refused / missing token. */
export const CAPTCHA_SERVER_MESSAGE = "captcha"

/** The "normal" checkbox widget is 303 × 78 px; "compact" is 164 × 144 px. */
export const NORMAL_WIDGET_WIDTH = 303
export const COMPACT_VIEWPORT_MAX = 380

export type HcaptchaSize = "normal" | "compact"

/** Compact below ~380px viewports or when the container can't fit 303px. */
export function hcaptchaSize(containerWidth: number, viewportWidth: number): HcaptchaSize {
  return viewportWidth < COMPACT_VIEWPORT_MAX || containerWidth < NORMAL_WIDGET_WIDTH
    ? "compact"
    : "normal"
}

/** True for the backend's 400 `{ message: "captcha" }` (Medusa js-sdk FetchError). */
export function isCaptchaRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const e = error as { status?: unknown; message?: unknown }
  return e.status === 400 && e.message === CAPTCHA_SERVER_MESSAGE
}

/** The part of `window.hcaptcha` the widget uses. */
export type HcaptchaApi = {
  render(
    container: HTMLElement,
    params: {
      sitekey: string
      size?: HcaptchaSize
      theme?: "light" | "dark"
      /** UI language (also set on the script URL, which the API doesn't always apply). */
      hl?: string
      callback?: (token: string) => void
      "expired-callback"?: () => void
      "error-callback"?: (error?: string) => void
    }
  ): string
  reset(widgetId?: string): void
  remove(widgetId?: string): void
  getResponse(widgetId?: string): string
}

type LoaderWindow = { hcaptcha?: HcaptchaApi }

type LoaderScript = {
  src: string
  async: boolean
  defer: boolean
  addEventListener(type: "load" | "error", fn: () => void): void
  remove(): void
}

type LoaderDocument = {
  createElement(tag: "script"): LoaderScript
  head: { appendChild(node: LoaderScript): unknown }
}

/**
 * Loads the hCaptcha script once, shared by every widget on the page. A
 * failed load (blocked / offline) is rejected and forgotten, so a later
 * widget can retry.
 */
export function createHcaptchaLoader(src: string = HCAPTCHA_SCRIPT_SRC) {
  let pending: Promise<HcaptchaApi> | null = null
  return function loadHcaptcha(
    win: LoaderWindow = window as unknown as LoaderWindow,
    doc: LoaderDocument = document as unknown as LoaderDocument
  ): Promise<HcaptchaApi> {
    if (win.hcaptcha) return Promise.resolve(win.hcaptcha)
    if (pending) return pending
    pending = new Promise<HcaptchaApi>((resolve, reject) => {
      const script = doc.createElement("script")
      script.src = src
      script.async = true
      script.defer = true
      script.addEventListener("load", () => {
        if (win.hcaptcha) resolve(win.hcaptcha)
        else fail(new Error("hCaptcha script loaded without window.hcaptcha"))
      })
      script.addEventListener("error", () => fail(new Error("hCaptcha script failed to load")))
      const fail = (error: Error) => {
        pending = null
        script.remove()
        reject(error)
      }
      doc.head.appendChild(script)
    })
    return pending
  }
}

/** Page-wide loader (one script tag for all forms). */
export const loadHcaptcha = createHcaptchaLoader()
