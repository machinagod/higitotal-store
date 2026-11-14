import { ArrowRight } from "lucide-react"
import Image from "next/image"

import { SECTORS, sectorHref, type Sector } from "@lib/sectors"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { sectorImage } from "@modules/sectors/sector-images"

import SectorIcon from "./sector-icon"

/**
 * Sector cards linking to each sector page.
 *
 *  - `full` (the /setores index): photo on top, icon badge, audience and
 *    summary.
 *  - `tile` (home page): photo on top, name and audience only; two columns
 *    on phones so the band stays short.
 *  - `list` ("Outros setores"): compact rows with a small thumbnail.
 *
 * The photos are decorative here (`alt=""`): the link text already names the
 * sector; the descriptive alt is used on the sector page itself. They load
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
  const grid = {
    full: "grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:grid-cols-3 small:gap-5",
    tile: "grid grid-cols-2 gap-2.5 xsmall:grid-cols-3 small:gap-4 medium:grid-cols-6",
    list: "grid grid-cols-1 gap-2.5 xsmall:grid-cols-2 small:grid-cols-3 small:gap-3",
  }[variant]

  return (
    <ul className={grid} data-testid={testId}>
      {sectors.map((s) => (
        <li key={s.slug}>
          {variant === "full" && <FullCard sector={s} />}
          {variant === "tile" && <TileCard sector={s} />}
          {variant === "list" && <ListCard sector={s} />}
        </li>
      ))}
    </ul>
  )
}

function Photo({
  sector,
  sizes,
  className,
}: {
  sector: Sector
  sizes: string
  className: string
}) {
  const image = sectorImage(sector.slug)
  return (
    <span className={`relative block overflow-hidden bg-grey-10 ${className}`}>
      {image && (
        <Image
          src={image.src}
          alt=""
          fill
          placeholder="blur"
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          style={{ objectPosition: image.position }}
        />
      )}
    </span>
  )
}

function IconBadge({ sector }: { sector: Sector }) {
  return (
    <span className="relative z-[1] flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-white text-brand-cyan shadow-[0_6px_16px_rgba(16,24,40,0.12)] ring-1 ring-hairline">
      <SectorIcon icon={sector.icon} className="h-5 w-5" />
    </span>
  )
}

function FullCard({ sector: s }: { sector: Sector }) {
  return (
    <LocalizedClientLink
      href={sectorHref(s)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-white transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
      data-testid="sector-card"
    >
      <Photo
        sector={s}
        sizes="(min-width: 1440px) 450px, (min-width: 1024px) 31vw, (min-width: 512px) 48vw, calc(100vw - 48px)"
        className="aspect-[3/2]"
      />
      <span className="flex flex-1 flex-col px-6 pb-6">
        <span className="-mt-5">
          <IconBadge sector={s} />
        </span>
        <h2 className="mt-3 text-lg font-extrabold leading-snug text-brand-ink">
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

function TileCard({ sector: s }: { sector: Sector }) {
  return (
    <LocalizedClientLink
      href={sectorHref(s)}
      className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-hairline bg-white transition-all hover:-translate-y-1 hover:border-brand-cyan-100 hover:shadow-[0_18px_40px_rgba(16,24,40,0.10)] small:rounded-card"
      data-testid="sector-card"
    >
      <Photo
        sector={s}
        sizes="(min-width: 1440px) 220px, (min-width: 1280px) 16vw, (min-width: 512px) 31vw, 46vw"
        className="aspect-[4/3]"
      />
      <span className="flex flex-1 flex-col gap-1 p-3 small:p-4">
        <span className="flex items-start justify-between gap-2">
          {/* Phones: 14px and no arrow, so the longest words ("Restauração",
              "condomínios") fit a two-column tile at 320px unbroken. */}
          <span className="min-w-0 text-sm font-extrabold leading-snug text-brand-ink xsmall:text-[15px]">
            {s.name}
          </span>
          <ArrowRight
            className="mt-0.5 hidden h-4 w-4 flex-none text-brand-cyan-ink transition-transform group-hover:translate-x-0.5 xsmall:block"
            aria-hidden
          />
        </span>
        <span className="hidden text-xs leading-snug text-grey-50 xsmall:line-clamp-2">
          {s.audience}
        </span>
      </span>
    </LocalizedClientLink>
  )
}

function ListCard({ sector: s }: { sector: Sector }) {
  return (
    <LocalizedClientLink
      href={sectorHref(s)}
      className="group flex h-full min-h-[64px] items-center gap-3 rounded-large border border-hairline bg-white p-2 pr-4 transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
      data-testid="sector-card"
    >
      <Photo
        sector={s}
        sizes="80px"
        className="h-[60px] w-20 flex-none rounded-[10px]"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-extrabold leading-snug text-brand-ink">
          {s.name}
        </span>
        <span className="truncate text-xs text-grey-50">{s.audience}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 flex-none text-brand-cyan-ink transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </LocalizedClientLink>
  )
}
