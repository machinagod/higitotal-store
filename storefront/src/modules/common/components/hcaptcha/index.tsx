"use client"

import { clx } from "@medusajs/ui"
import { AlertCircle } from "lucide-react"
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import {
  CAPTCHA_REQUIRED_MESSAGE,
  HCAPTCHA_LANGUAGE,
  HCAPTCHA_SITEKEY,
  HcaptchaApi,
  hcaptchaSize,
  loadHcaptcha,
} from "@lib/util/hcaptcha"

export type HCaptchaHandle = {
  /** Current token, or null when unsolved / expired. */
  getToken(): string | null
  /**
   * Submit-time check: true when solved — or when the widget could not load
   * at all (blocked / offline): the backend decides then, so a blocked script
   * never stops a real lead. Otherwise shows "Confirme que não é um robô."
   * and, with `focus`, scrolls to / focuses the widget.
   */
  check(opts?: { focus?: boolean }): boolean
  /** Clears the token and resets the widget; optional message shown inline. */
  reset(message?: string): void
}

type Props = {
  /** Unique prefix for ids (several forms can share a page). */
  idPrefix: string
  ref?: React.Ref<HCaptchaHandle>
  className?: string
}

/**
 * hCaptcha checkbox for the contact-request forms.
 *
 * - The script (`js.hcaptcha.com/1/api.js?render=explicit&hl=pt`) is requested
 *   only once the form is actually displayed — the product sheet keeps its
 *   form mounted while hidden, so it waits for the sheet to open — and only
 *   once per page (shared loader).
 * - Rendered explicitly (`hcaptcha.render`), compact on narrow screens /
 *   containers so it fits a 320px viewport.
 * - React Strict Mode safe: one widget per mount; the widget is removed on
 *   unmount.
 * - Inline error under the widget in an `aria-live` region.
 */
export default function HCaptcha({ idPrefix, ref, className }: Props) {
  const groupRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<HcaptchaApi | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<"idle" | "ready" | "unavailable">("idle")
  const [size, setSize] = useState<"normal" | "compact">("normal")
  const errorId = `${idPrefix}-captcha-error`

  const setToken = useCallback((token: string | null) => {
    tokenRef.current = token
    if (token) setError(null)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    const render = (api: HcaptchaApi) => {
      if (cancelled || widgetIdRef.current !== null) return
      apiRef.current = api
      const s = hcaptchaSize(container.clientWidth || window.innerWidth, window.innerWidth)
      setSize(s)
      try {
        widgetIdRef.current = api.render(container, {
          sitekey: HCAPTCHA_SITEKEY,
          size: s,
          theme: "light",
          hl: HCAPTCHA_LANGUAGE,
          callback: (token) => setToken(token),
          "expired-callback": () => setToken(null),
          "error-callback": () => {
            setToken(null)
            if (widgetIdRef.current !== null) api.reset(widgetIdRef.current)
          },
        })
        setState("ready")
      } catch {
        setState("unavailable")
      }
    }

    const start = () => {
      loadHcaptcha().then(render, () => {
        if (!cancelled) setState("unavailable")
      })
    }

    // Wait until the form is on screen (or close to it). A hidden product
    // sheet doesn't intersect, so nothing loads until it opens.
    const target = container.closest("form") ?? container
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver === "undefined") {
      start()
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer?.disconnect()
            observer = null
            start()
          }
        },
        { rootMargin: "300px 0px" }
      )
      observer.observe(target)
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      const id = widgetIdRef.current
      widgetIdRef.current = null
      tokenRef.current = null
      if (id !== null) {
        try {
          apiRef.current?.remove(id)
        } catch {
          // already gone
        }
      }
    }
  }, [setToken])

  useImperativeHandle(
    ref,
    () => ({
      getToken: () => tokenRef.current,
      check: ({ focus = false } = {}) => {
        if (tokenRef.current || state === "unavailable") return true
        setError(CAPTCHA_REQUIRED_MESSAGE)
        if (focus) {
          // After the error line has rendered, so it is scrolled into view
          // too (not left behind the product sheet's sticky "Enviar pedido").
          requestAnimationFrame(() => {
            const g = groupRef.current
            g?.focus({ preventScroll: true })
            g?.scrollIntoView?.({ block: "center" })
          })
        }
        return false
      },
      reset: (message) => {
        tokenRef.current = null
        setError(message ?? null)
        if (message) {
          // Keep the message (and the widget to solve again) in view, clear
          // of the product sheet's sticky "Enviar pedido" bar.
          requestAnimationFrame(() =>
            groupRef.current?.scrollIntoView?.({ block: "center" })
          )
        }
        const id = widgetIdRef.current
        if (id !== null) {
          try {
            apiRef.current?.reset(id)
          } catch {
            // widget gone; nothing to reset
          }
        }
      },
    }),
    [state]
  )

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label="Verificação anti-spam"
      aria-describedby={error ? errorId : undefined}
      tabIndex={-1}
      className={clx("min-w-0 rounded-btn outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/25", className)}
      data-testid="hcaptcha"
      data-state={state}
    >
      <div
        ref={containerRef}
        className={clx(
          "max-w-full",
          state === "unavailable"
            ? "hidden"
            : size === "compact"
              ? "min-h-[140px]"
              : "min-h-[78px]"
        )}
        data-testid="hcaptcha-widget"
      />
      <p
        id={errorId}
        aria-live="polite"
        className={clx(
          "flex items-start gap-1.5 text-[13px] font-medium leading-snug text-rose-700",
          error && "mt-1.5"
        )}
        data-testid="hcaptcha-error"
      >
        {error && (
          <>
            <AlertCircle className="mt-px h-4 w-4 flex-none" aria-hidden="true" />
            {error}
          </>
        )}
      </p>
    </div>
  )
}
