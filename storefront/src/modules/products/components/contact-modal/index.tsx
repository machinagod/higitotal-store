"use client"

import { clx } from "@medusajs/ui"
import { X } from "lucide-react"
import { RefObject, useCallback, useEffect, useRef, useState } from "react"

import ContactRequestForm, {
  EnquiryProduct,
} from "@modules/common/components/contact-request-form"
import { isFormDirty } from "@modules/common/components/contact-request-form/fields"

type Props = {
  open: boolean
  onClose: () => void
  product: EnquiryProduct
  /** Element to focus again when the dialog closes (the button that opened it). */
  returnFocusRef?: RefObject<HTMLElement | null>
  /** Used when the opener is gone (e.g. opened from the `?pedido=1` deep link). */
  fallbackFocusRef?: RefObject<HTMLElement | null>
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), select, textarea'

const isVisible = (el: HTMLElement) =>
  el.isConnected && (el.offsetParent !== null || el.getClientRects().length > 0)

/**
 * "Pedir orçamento" dialog on the product page — a thin wrapper around the
 * shared ContactRequestForm. Centered card on desktop, bottom sheet on mobile.
 *
 * Stays mounted while closed (hidden), so whatever the visitor typed survives
 * closing and reopening; after a successful send the form starts fresh. Esc /
 * ✕ close; a tap on the backdrop closes only while nothing has been typed.
 * Focus moves into the dialog on open (first field with a mouse/keyboard, the
 * dialog itself on touch so the keyboard doesn't cover the sheet) and back to
 * the opener on close. Page scroll is locked while open.
 */
const ContactModal = ({
  open,
  onClose,
  product,
  returnFocusRef,
  fallbackFocusRef,
}: Props) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const [formKey, setFormKey] = useState(0)
  const sentRef = useRef(false)
  // Latest callbacks without re-running the open/close effect.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    // Move focus in once the dialog is displayed.
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? true
    const first = panel?.querySelector<HTMLElement>("input:not([tabindex='-1'])")
    if (finePointer && first) first.focus({ preventScroll: true })
    else panel?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      // Keep Tab inside the dialog.
      if (e.key === "Tab" && panel) {
        const visible = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE)
        ).filter(isVisible)
        if (!visible.length) return
        const firstEl = visible[0]
        const lastEl = visible[visible.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === firstEl || active === panel)) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && active === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // On close (open → false): focus back to the opener, and start a fresh form
  // if the last one was sent.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      return
    }
    if (!wasOpen.current) return
    wasOpen.current = false
    const target = [returnFocusRef?.current, fallbackFocusRef?.current].find(
      (el): el is HTMLElement => !!el && isVisible(el)
    )
    target?.focus({ preventScroll: true })
    if (sentRef.current) {
      sentRef.current = false
      setFormKey((k) => k + 1)
    }
  }, [open, returnFocusRef, fallbackFocusRef])

  const onBackdrop = useCallback(() => {
    const form = panelRef.current?.querySelector("form")
    if (isFormDirty(form)) return // don't throw away a half-filled form
    onClose()
  }, [onClose])

  return (
    <div
      className={clx(
        "fixed inset-0 z-[2000] items-end justify-center bg-black/50 small:items-center small:p-4",
        open ? "flex" : "hidden"
      )}
      onClick={onBackdrop}
      data-testid="contact-modal-overlay"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        tabIndex={-1}
        data-testid="contact-modal"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card bg-white shadow-xl outline-none small:max-h-[calc(100dvh-2rem)] small:max-w-[580px] small:rounded-card"
      >
        <div className="flex flex-none items-center justify-between gap-4 border-b border-hairline py-2 pl-5 pr-2 small:pl-7 small:pr-4 small:pt-3">
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
            data-testid="contact-modal-close"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-grey-60 transition-colors hover:bg-grey-10 hover:text-brand-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div
          className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-3 small:px-7"
          data-testid="contact-modal-body"
        >
          <ContactRequestForm
            key={formKey}
            kind="produto"
            product={product}
            idPrefix="enquiry"
            layout="sheet"
            onSuccess={() => {
              sentRef.current = true
            }}
            className="flex-1"
            successAction={
              <button
                type="button"
                onClick={onClose}
                className="mb-6 mt-5 inline-flex h-11 items-center rounded-pill border-[1.5px] border-hairline px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
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
