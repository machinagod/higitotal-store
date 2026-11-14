"use client"

import { ChevronDown } from "lucide-react"
import { useId, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

type FooterLink = { label: string; href: string }

/**
 * Footer link column that grows with the catalogue (categories, brands):
 * shows the first `initial` links, the last of them fading into the footer,
 * plus a "Ver todas (N)" toggle. The remaining links stay in the HTML (crawlable)
 * but are hidden — and out of the tab order — until expanded.
 */
export default function ExpandableLinkList({
  links,
  initial = 5,
  linkClass,
  testId,
  itemTestId,
  noun,
}: {
  links: FooterLink[]
  initial?: number
  linkClass: string
  testId?: string
  itemTestId?: string
  /** For the accessible toggle label, e.g. "categorias", "marcas". */
  noun: string
}) {
  const [open, setOpen] = useState(false)
  const restId = useId()
  // Not worth a toggle for one or two extra links.
  const collapsible = links.length > initial + 1
  const head = collapsible ? links.slice(0, initial) : links
  const rest = collapsible ? links.slice(initial) : []

  const item = (l: FooterLink) => (
    <li key={l.href}>
      <LocalizedClientLink className={linkClass} href={l.href} data-testid={itemTestId}>
        {l.label}
      </LocalizedClientLink>
    </li>
  )

  return (
    <div data-testid={testId}>
      <div className="relative">
        <ul className="m-0 flex list-none flex-col gap-[11px] p-0">{head.map(item)}</ul>
        {collapsible && !open && (
          // Fade over the last visible link only, so the ones above stay crisp.
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-svc-ground"
          />
        )}
      </div>
      {collapsible && (
        <>
          <ul
            id={restId}
            hidden={!open}
            className={`m-0 mt-[11px] list-none flex-col gap-[11px] p-0 ${open ? "flex" : "hidden"}`}
          >
            {rest.map(item)}
          </ul>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={restId}
            aria-label={
              open ? `Mostrar menos ${noun}` : `Ver todas as ${links.length} ${noun}`
            }
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.08em] text-white/90 transition-colors hover:text-white"
            data-testid={testId ? `${testId}-toggle` : undefined}
          >
            {open ? "Ver menos" : `Ver todas (${links.length})`}
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            />
          </button>
        </>
      )}
    </div>
  )
}
