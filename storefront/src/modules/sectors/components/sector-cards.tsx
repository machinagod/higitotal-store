import { ArrowRight } from "lucide-react"

import { SECTORS, sectorHref, type Sector } from "@lib/sectors"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import SectorIcon from "./sector-icon"

/**
 * Grid of sector cards linking to each sector page. `compact` drops the
 * summary line (home page, "Outros setores").
 */
export default function SectorCards({
  sectors = SECTORS,
  compact = false,
  testId = "sector-cards",
}: {
  sectors?: Sector[]
  compact?: boolean
  testId?: string
}) {
  return (
    <ul
      className={
        compact
          ? "grid grid-cols-1 gap-2.5 xsmall:grid-cols-2 small:grid-cols-3 small:gap-3"
          : "grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:grid-cols-3 small:gap-5"
      }
      data-testid={testId}
    >
      {sectors.map((s) => (
        <li key={s.slug}>
          <LocalizedClientLink
            href={sectorHref(s)}
            className={
              compact
                ? "group flex h-full min-h-[64px] items-center gap-3 rounded-large border border-hairline bg-white px-4 py-3 transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
                : "group flex h-full flex-col rounded-card border border-hairline bg-white p-6 transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
            }
            data-testid="sector-card"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan group-hover:bg-white">
              <SectorIcon icon={s.icon} className="h-5 w-5" />
            </span>
            {compact ? (
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-extrabold leading-snug text-brand-ink">
                  {s.name}
                </span>
                <span className="truncate text-xs text-grey-50">
                  {s.audience}
                </span>
              </span>
            ) : (
              <>
                <h2 className="mt-4 text-lg font-extrabold leading-snug text-brand-ink">
                  {s.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-grey-60">
                  {s.audience}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-grey-60">
                  {s.summary}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-cyan-ink">
                  Ver soluções
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </>
            )}
            {compact && (
              <ArrowRight
                className="h-4 w-4 flex-none text-brand-cyan-ink transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  )
}
