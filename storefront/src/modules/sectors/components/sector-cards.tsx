import { ArrowRight } from "lucide-react"
import Image from "next/image"

import { SECTORS, sectorHref, type Sector } from "@lib/sectors"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { sectorImage } from "@modules/sectors/sector-images"

import SectorIcon from "./sector-icon"

/**
 * Sector cards linking to each sector page: icon + text, with the sector's
 * photo as a faded "watermark" on the right edge of the card.
 *
 *  - `full` (the /setores index): icon, name, audience, summary, "Ver soluções".
 *  - `tile` (home page) and `list` ("Outros setores"): compact rows — icon,
 *    name, audience, arrow.
 *
 * The photos are decorative here (`alt=""`, aria-hidden): the link text names
 * the sector; the descriptive alt is used on the sector page itself. They load
 * lazily at card size.
 */
export default function SectorCards({
  sectors = SECTORS,
  variant = "full",
  testId = "sector-cards",
}: {
  sectors?: Sector[]
  variant?: "full" | "tile" | "list"
  testId?: string
}) {
  const full = variant === "full"
  return (
    <ul
      className={
        full
          ? "grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:grid-cols-3 small:gap-5"
          : "grid grid-cols-1 gap-2.5 xsmall:grid-cols-2 small:grid-cols-3 small:gap-3"
      }
      data-testid={testId}
    >
      {sectors.map((s) => (
        <li key={s.slug}>
          {full ? <FullCard sector={s} /> : <RowCard sector={s} />}
        </li>
      ))}
    </ul>
  )
}

/** The sector photo, faded in from the right edge behind the card's text. */
function Watermark({
  sector,
  sizes,
  className,
}: {
  sector: Sector
  sizes: string
  className: string
}) {
  const image = sectorImage(sector.slug)
  if (!image) return null
  const mask = "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 45%, #000 100%)"
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 right-0 ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <Image
        src={image.src}
        alt=""
        fill
        sizes={sizes}
        className="object-cover opacity-[0.22] saturate-[0.85] transition-[opacity,transform] duration-300 group-hover:scale-[1.03] group-hover:opacity-[0.38]"
        style={{ objectPosition: image.position }}
      />
    </span>
  )
}

function FullCard({ sector: s }: { sector: Sector }) {
  return (
    <LocalizedClientLink
      href={sectorHref(s)}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-white p-6 transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
      data-testid="sector-card"
    >
      <Watermark
        sector={s}
        sizes="(min-width: 1024px) 260px, (min-width: 512px) 30vw, 60vw"
        className="w-[62%]"
      />
      <span className="relative flex flex-1 flex-col">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan group-hover:bg-white">
          <SectorIcon icon={s.icon} className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold leading-snug text-brand-ink">
          {s.name}
        </h2>
        <p className="mt-1 text-sm font-semibold text-grey-60">{s.audience}</p>
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
      </span>
    </LocalizedClientLink>
  )
}

function RowCard({ sector: s }: { sector: Sector }) {
  return (
    <LocalizedClientLink
      href={sectorHref(s)}
      className="group relative flex h-full min-h-[64px] items-center gap-3 overflow-hidden rounded-large border border-hairline bg-white px-4 py-3 transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
      data-testid="sector-card"
    >
      <Watermark
        sector={s}
        sizes="(min-width: 1024px) 220px, (min-width: 512px) 26vw, 55vw"
        className="w-[58%]"
      />
      <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan group-hover:bg-white">
        <SectorIcon icon={s.icon} className="h-5 w-5" />
      </span>
      <span className="relative flex min-w-0 flex-1 flex-col">
        <span className="font-extrabold leading-snug text-brand-ink">
          {s.name}
        </span>
        <span className="truncate text-xs text-grey-50">{s.audience}</span>
      </span>
      <ArrowRight
        className="relative h-4 w-4 flex-none text-brand-cyan-ink transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </LocalizedClientLink>
  )
}
