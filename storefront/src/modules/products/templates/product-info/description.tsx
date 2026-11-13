"use client"

import { clx } from "@medusajs/ui"
import { ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"

/** Server-side guess (before measuring) of whether the text needs clamping. */
const looksLong = (text: string) =>
  text.length > 200 || text.split("\n").filter(Boolean).length > 3

/**
 * Product description clamped to 4 lines on mobile / 3 on desktop so price and
 * CTAs stay in the first viewport, with an accessible "Ler mais" / "Ler
 * menos" toggle. The full text stays in the DOM (the clamp is visual), so
 * screen readers and search engines get all of it. The toggle only shows when
 * the text actually overflows.
 */
export default function ProductDescription({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(() => looksLong(text))

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [expanded, text])

  return (
    <div className="mt-1">
      <p
        ref={ref}
        id="product-description"
        className={clx(
          "whitespace-pre-line text-[15px] leading-relaxed text-grey-60",
          !expanded && "line-clamp-4 small:line-clamp-3"
        )}
        data-testid="product-description"
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="product-description"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 inline-flex min-h-[32px] items-center gap-1 text-sm font-bold text-brand-cyan-ink underline-offset-2 hover:underline"
          data-testid="product-description-toggle"
        >
          {expanded ? "Ler menos" : "Ler mais"}
          <ChevronDown
            className={clx("h-4 w-4 transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  )
}
