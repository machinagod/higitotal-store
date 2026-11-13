"use client"

import { clx } from "@medusajs/ui"
import { ClipboardList } from "lucide-react"

import { useQuoteList } from "@lib/quote-list/context"
import { quoteControlLabel } from "@lib/quote-list/state"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const QUOTE_PATH = "/orcamento"

/** Badge text: 1–99, then "99+". */
const badge = (n: number) => (n > 99 ? "99+" : String(n))

/**
 * Desktop header pill (catalog mode): "Pedir orçamento" while the list is
 * empty, "Orçamento" + count once products were added. Always links to the
 * quote page; its accessible name carries the count. The server render (and
 * hydration) shows the empty state — the count appears right after.
 */
export function QuoteNavPill({ className }: { className?: string }) {
  const quote = useQuoteList()
  const count = quote?.count ?? 0
  return (
    <LocalizedClientLink
      href={QUOTE_PATH}
      aria-label={quoteControlLabel(count)}
      data-testid="nav-quote-link"
      data-count={count}
      className={clx(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-pill bg-brand-cyan px-5 py-3 text-xs font-bold uppercase tracking-[0.04em] text-white shadow-[0_8px_20px_rgba(0,173,239,0.25)] transition-colors hover:bg-brand-cyan-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2",
        count > 0 && "py-2.5 pr-2.5",
        className
      )}
    >
      {count > 0 ? (
        <>
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Orçamento
          <span
            className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-pill bg-white px-1.5 text-[12px] font-extrabold tracking-normal text-brand-cyan-ink"
            data-testid="nav-quote-count"
            aria-hidden="true"
          >
            {badge(count)}
          </span>
        </>
      ) : (
        "Pedir orçamento"
      )}
    </LocalizedClientLink>
  )
}

/** Mobile header icon (catalog mode) with the count badge. */
export function QuoteNavIcon() {
  const quote = useQuoteList()
  if (!quote) return null
  const { count } = quote
  return (
    <LocalizedClientLink
      href={QUOTE_PATH}
      aria-label={quoteControlLabel(count)}
      data-testid="nav-quote-icon"
      data-count={count}
      className="relative flex h-11 w-11 flex-none items-center justify-center rounded-pill text-brand-ink transition-colors hover:bg-brand-cyan-50 hover:text-brand-cyan-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
    >
      <ClipboardList className="h-[21px] w-[21px]" aria-hidden="true" />
      {count > 0 && (
        <span
          className="absolute right-0.5 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-brand-cyan px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
          data-testid="nav-quote-icon-count"
          aria-hidden="true"
        >
          {badge(count)}
        </span>
      )}
    </LocalizedClientLink>
  )
}
