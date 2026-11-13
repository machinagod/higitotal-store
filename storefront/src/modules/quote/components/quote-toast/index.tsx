"use client"

import { ClipboardCheck, Info, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useQuoteList } from "@lib/quote-list/context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/** How long the toast stays up (paused while hovered / focused). */
const TOAST_MS = 6000

/**
 * Feedback after "Adicionar ao orçamento": a small toast with "Ver orçamento
 * (N)", plus the polite live region every quote change is announced through
 * (the toast itself is not live, so nothing is read twice). Renders nothing
 * when the quote list is off (catalog mode disabled).
 */
export default function QuoteToast() {
  const quote = useQuoteList()
  const toast = quote?.toast ?? null
  const dismiss = quote?.dismissToast
  const [paused, setPaused] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!toast || paused || !dismiss) return
    const t = window.setTimeout(dismiss, TOAST_MS)
    return () => window.clearTimeout(t)
  }, [toast, paused, dismiss])

  // A new toast starts unpaused.
  useEffect(() => setPaused(false), [toast?.id])

  if (!quote) return null
  const { announcement, count } = quote
  const full = toast?.status === "full"

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only" data-testid="quote-live">
        {announcement && <span key={announcement.id}>{announcement.text}</span>}
      </div>

      {toast && (
        <div
          ref={boxRef}
          key={toast.id}
          // Phones: above the PDP sticky bar, and above the cookie banner
          // while it is open (--ht-consent-stack = its top edge).
          className="fixed inset-x-4 bottom-[max(calc(96px+env(safe-area-inset-bottom)),calc(var(--ht-consent-stack,0px)+8px))] z-[70] mx-auto max-w-[420px] small:inset-x-auto small:bottom-6 small:right-6 small:mx-0 small:w-[400px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(e) => {
            if (!boxRef.current?.contains(e.relatedTarget as Node | null)) {
              setPaused(false)
            }
          }}
          data-testid="quote-toast"
        >
          <div className="flex items-start gap-3 rounded-large border border-hairline bg-white p-3 pl-4 shadow-[0_18px_40px_rgba(16,24,40,0.16)]">
            <span
              className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${
                full ? "bg-grey-10 text-grey-60" : "bg-brand-cyan-50 text-brand-cyan"
              }`}
              aria-hidden="true"
            >
              {full ? <Info className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-ink">
                {full
                  ? "A lista atingiu o limite de 100 produtos"
                  : toast.status === "increased"
                  ? "Quantidade atualizada no orçamento"
                  : "Adicionado ao orçamento"}
              </p>
              {!full && (
                <p className="mt-0.5 line-clamp-1 text-[13px] text-grey-60">
                  {toast.title} · {toast.quantity} un.
                </p>
              )}
              <LocalizedClientLink
                href="/orcamento"
                onClick={dismiss}
                className="mt-1 inline-flex min-h-[44px] items-center text-sm font-bold text-brand-cyan underline-offset-2 hover:text-brand-cyan-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                data-testid="quote-toast-link"
              >
                Ver orçamento ({count})
              </LocalizedClientLink>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar aviso"
              className="-mr-1 -mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-full text-grey-60 transition-colors hover:bg-grey-10 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
