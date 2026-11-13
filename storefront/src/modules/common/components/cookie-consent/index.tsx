"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { X } from "lucide-react"

import {
  CONSENT_OPEN_EVENT,
  getStoredConsent,
  saveConsent,
} from "@lib/consent/client"

/**
 * First-party cookie banner (Google Consent Mode v2, statistics only).
 *
 * - Shown only when there is no valid stored choice (`ht_consent`), or when
 *   reopened through "Preferências de cookies" (footer / cookie policy page),
 *   which dispatch CONSENT_OPEN_EVENT and land on the "Personalizar" panel.
 * - Not a modal: a fixed card at the bottom of the viewport (no focus trap,
 *   no content push). It sits early in the DOM so keyboard users reach it
 *   first. Escape does not dismiss it: only a choice does.
 * - "Aceitar" and "Rejeitar" have the same size, weight and colour (CNPD /
 *   EDPB: refusing must be as easy as accepting).
 * - On phones it is lifted above the product page's sticky action bar
 *   (`--ht-bottom-bar`, set by MobileActions) and publishes its own top edge
 *   as `--ht-consent-stack` so the quote toast stacks above it.
 * - SSR-safe: renders nothing on the server; the decision is made on mount.
 */

const STACK_VAR = "--ht-consent-stack"

type View = "main" | "prefs"

const choiceButton =
  "inline-flex min-h-[44px] items-center justify-center rounded-pill bg-brand-ink px-5 text-sm font-bold text-white transition-colors hover:bg-black"

export default function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>("main")
  const [analytics, setAnalytics] = useState(false)
  /** Reopened from "Preferências de cookies" while a choice already exists. */
  const [hasChoice, setHasChoice] = useState(false)
  const boxRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const focusOnOpen = useRef(false)
  const params = useParams()
  const id = useId()
  const titleId = `${id}-title`
  const descId = `${id}-desc`

  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : null
  const policyHref = `${countryCode ? `/${countryCode}` : ""}/content/cookie-policy`

  // Decide on mount (never on the server → no hydration mismatch).
  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) setOpen(true)

    const onOpen = () => {
      const current = getStoredConsent()
      setAnalytics(current?.analytics ?? false)
      setHasChoice(!!current)
      setView("prefs")
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      focusOnOpen.current = true
      setOpen(true)
    }
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  }, [])

  // Reopened on purpose (button far down the page): move focus to the panel.
  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false
      headingRef.current?.focus()
    }
  }, [open, view])

  // Publish the banner's top edge (distance from the viewport bottom) so the
  // quote toast can stack above it on phones.
  useEffect(() => {
    const root = document.documentElement
    const el = boxRef.current
    if (!open || !el) {
      root.style.removeProperty(STACK_VAR)
      return
    }
    // From layout values (bottom offset + height), not getBoundingClientRect:
    // the rise-in animation's transform would skew the first measurement.
    const update = () => {
      const bottom = parseFloat(getComputedStyle(el).bottom) || 0
      root.style.setProperty(STACK_VAR, `${Math.round(bottom + el.offsetHeight)}px`)
    }
    update()
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update)
    ro?.observe(el)
    window.addEventListener("resize", update)
    return () => {
      ro?.disconnect()
      window.removeEventListener("resize", update)
      root.style.removeProperty(STACK_VAR)
    }
  }, [open, view])

  const close = useCallback(() => {
    setOpen(false)
    setView("main")
    const back = returnFocusRef.current
    returnFocusRef.current = null
    if (back && document.contains(back)) back.focus()
  }, [])

  const decide = useCallback(
    (granted: boolean) => {
      saveConsent(granted)
      setAnalytics(granted)
      setHasChoice(true)
      close()
    },
    [close]
  )

  if (!open) return null

  return (
    <section
      ref={boxRef}
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-testid="cookie-consent"
      data-surface="light"
      className="ht-consent-in fixed inset-x-3 bottom-[calc(var(--ht-bottom-bar,env(safe-area-inset-bottom,0px))+12px)] z-[65] mx-auto max-h-[min(80vh,calc(100dvh-24px))] max-w-[560px] overflow-y-auto overscroll-contain rounded-large border border-hairline bg-white p-4 text-brand-ink shadow-[0_18px_48px_rgba(16,24,40,0.22)] xsmall:p-5 small:inset-x-auto small:bottom-6 small:left-6 small:mx-0 small:w-[460px]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-bold leading-tight outline-none"
        >
          Consentimento de cookies
        </h2>
        {hasChoice && (
          <button
            type="button"
            onClick={close}
            className="-mr-2 -mt-2 inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-grey-60 transition-colors hover:bg-grey-10 hover:text-brand-ink"
            aria-label="Fechar sem alterar as preferências"
            data-testid="cookie-consent-close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {view === "main" ? (
        <>
          <p id={descId} className="mt-2 text-[13px] leading-relaxed text-grey-70 xsmall:text-sm">
            Utilizamos cookies estritamente necessários ao funcionamento do site
            e, com o seu consentimento, cookies de estatística (Google
            Analytics) para perceber como o site é usado.{" "}
            <Link
              href={policyHref}
              className="font-semibold text-brand-cyan-ink underline underline-offset-2 hover:text-brand-cyan"
            >
              Política de cookies
            </Link>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => decide(false)}
              className={choiceButton}
              data-testid="cookie-consent-reject"
            >
              Rejeitar
            </button>
            <button
              type="button"
              onClick={() => decide(true)}
              className={choiceButton}
              data-testid="cookie-consent-accept"
            >
              Aceitar
            </button>
            <button
              type="button"
              onClick={() => setView("prefs")}
              className="col-span-2 inline-flex min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-hairline bg-white px-5 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-ink"
              data-testid="cookie-consent-customize"
            >
              Personalizar
            </button>
          </div>
        </>
      ) : (
        <>
          <p id={descId} className="mt-2 text-[13px] leading-relaxed text-grey-70 xsmall:text-sm">
            Escolha os cookies que aceita. Pode alterar a escolha a qualquer
            momento em «Preferências de cookies», no rodapé do site.{" "}
            <Link
              href={policyHref}
              className="font-semibold text-brand-cyan-ink underline underline-offset-2 hover:text-brand-cyan"
            >
              Política de cookies
            </Link>
          </p>
          <ul className="mt-3 flex flex-col divide-y divide-hairline border-y border-hairline">
            <ConsentToggle
              id={`${id}-necessary`}
              label="Necessários"
              status="Sempre ativos"
              description="Indispensáveis ao funcionamento do site, por exemplo para guardar esta escolha e a sua lista de orçamento. Não podem ser desativados."
              checked
              disabled
            />
            <ConsentToggle
              id={`${id}-analytics`}
              label="Estatísticas"
              status={analytics ? "Ativos" : "Desativados"}
              description="Google Analytics: medição agregada das visitas e das páginas vistas, para melhorarmos o site."
              checked={analytics}
              onChange={setAnalytics}
              testId="cookie-consent-analytics"
            />
          </ul>
          <button
            type="button"
            onClick={() => decide(analytics)}
            className={`${choiceButton} mt-4 w-full`}
            data-testid="cookie-consent-save"
          >
            Guardar preferências
          </button>
        </>
      )}
    </section>
  )
}

function ConsentToggle({
  id,
  label,
  status,
  description,
  checked,
  disabled = false,
  onChange,
  testId,
}: {
  id: string
  label: string
  status: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (v: boolean) => void
  testId?: string
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-bold">
          {label}{" "}
          <span className="text-[12px] font-semibold text-grey-60">· {status}</span>
        </p>
        <p id={`${id}-desc`} className="mt-1 text-[13px] leading-snug text-grey-70">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className="-mr-1 inline-flex h-11 w-[60px] flex-none items-center justify-center rounded-pill disabled:cursor-not-allowed"
        data-testid={testId}
      >
        <span
          aria-hidden="true"
          className={`relative inline-block h-6 w-11 rounded-full transition-colors motion-reduce:transition-none ${
            checked
              ? disabled
                ? "bg-brand-cyan/60"
                : "bg-brand-cyan"
              : "bg-grey-40"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </button>
    </li>
  )
}
