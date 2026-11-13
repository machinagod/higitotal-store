"use client"

import { HttpTypes } from "@medusajs/types"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
  images: HttpTypes.StoreProductImage[]
  title: string
  /** Index shown when opened. */
  startIndex: number
  onClose: (lastIndex: number) => void
}

const navButton =
  "absolute top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white/90 text-brand-ink shadow-md transition-colors hover:border-brand-cyan hover:text-brand-cyan"

/**
 * Full-screen image viewer (tap/click the product image). Swipe (scroll-snap)
 * or ← / → between images, Esc or ✕ to close. Focus moves to the close button
 * and is trapped inside; the page doesn't scroll behind it. Rendered in a
 * portal so it sits above the sticky header.
 */
export default function Lightbox({ images, title, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const indexRef = useRef(startIndex)
  indexRef.current = index
  const trackRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const count = images.length

  const close = useCallback(() => onClose(indexRef.current), [onClose])

  const goTo = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const el = trackRef.current
      if (!el) return
      const next = (i + count) % count
      el.scrollTo({ left: next * el.clientWidth, behavior })
      setIndex(next)
    },
    [count]
  )

  // Start on the image that was tapped, without animating.
  useLayoutEffect(() => {
    const el = trackRef.current
    if (el) el.scrollLeft = startIndex * el.clientWidth
  }, [startIndex])

  useEffect(() => {
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
      } else if (e.key === "ArrowRight" && count > 1) {
        e.preventDefault()
        goTo(indexRef.current + 1)
      } else if (e.key === "ArrowLeft" && count > 1) {
        e.preventDefault()
        goTo(indexRef.current - 1)
      } else if (e.key === "Tab" && dialogRef.current) {
        const items = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>('button, [tabindex="0"]')
        ).filter((b) => b.getClientRects().length > 0)
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [close, goTo, count])

  const onScroll = () => {
    const el = trackRef.current
    if (!el || !el.clientWidth) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== indexRef.current && i >= 0 && i < count) setIndex(i)
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — imagens ampliadas`}
      className="fixed inset-0 z-[2100] flex flex-col bg-white"
      data-testid="gallery-lightbox"
    >
      <div className="flex flex-none items-center justify-between gap-4 py-2 pl-5 pr-2">
        <p className="text-sm font-semibold text-grey-60" aria-live="polite">
          {count > 1 ? `Imagem ${index + 1} de ${count}` : title}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Fechar imagens"
          className="flex h-11 w-11 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-grey-10"
          data-testid="gallery-lightbox-close"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          onScroll={onScroll}
          tabIndex={0}
          role="region"
          aria-label="Imagens (deslize ou use as setas)"
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-cyan/25"
        >
          {images.map((image, i) => (
            <div
              key={image.id}
              className="relative h-full w-full flex-none snap-center"
              aria-hidden={i !== index}
            >
              <Image
                src={image.url}
                alt={count > 1 ? `${title} — imagem ${i + 1} de ${count}` : title}
                fill
                sizes="100vw"
                className="object-contain p-4 mix-blend-multiply small:p-10"
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Imagem anterior"
              className={`${navButton} left-2 xsmall:left-4`}
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Imagem seguinte"
              className={`${navButton} right-2 xsmall:right-4`}
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
