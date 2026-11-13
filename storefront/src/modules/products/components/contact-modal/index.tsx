"use client"

import { X } from "lucide-react"
import { useEffect, useRef } from "react"

import ContactRequestForm, {
  EnquiryProduct,
} from "@modules/common/components/contact-request-form"

type Props = {
  open: boolean
  onClose: () => void
  product: EnquiryProduct
}

/**
 * "Pedir orçamento" dialog on the product page — a thin wrapper around the
 * shared ContactRequestForm. Centered card on desktop, bottom sheet on mobile.
 * Closes on Esc / overlay click, focuses the first field, locks page scroll.
 */
const ContactModal = ({ open, onClose, product }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      // Keep Tab inside the dialog.
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), select, textarea'
        )
        const visible = Array.from(focusables).filter(
          (el) => el.offsetParent !== null || el.getClientRects().length > 0
        )
        if (!visible.length) return
        const first = visible[0]
        const last = visible[visible.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      returnFocusRef.current?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 small:items-center small:p-6"
      onClick={onClose}
      data-testid="contact-modal-overlay"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        data-testid="contact-modal"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card bg-white shadow-xl small:max-h-[90vh] small:max-w-[560px] small:rounded-card"
      >
        {/* Grab handle (mobile bottom sheet) */}
        <div className="flex justify-center pt-2.5 small:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-pill bg-grey-20" />
        </div>
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 small:px-7 small:pt-6">
          <h2
            id="enquiry-title"
            className="text-xl font-extrabold tracking-[-0.02em] text-brand-ink small:text-2xl"
          >
            Pedir orçamento
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-2 -mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full text-grey-50 transition-colors hover:bg-grey-10 hover:text-brand-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] small:px-7 small:pb-7">
          <ContactRequestForm
            kind="produto"
            product={product}
            idPrefix="enquiry"
            autoFocus
            successAction={
              <button
                type="button"
                onClick={onClose}
                className="mt-5 inline-flex h-11 items-center rounded-pill border-[1.5px] border-hairline px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
              >
                Fechar
              </button>
            }
          />
        </div>
      </div>
    </div>
  )
}

export default ContactModal
