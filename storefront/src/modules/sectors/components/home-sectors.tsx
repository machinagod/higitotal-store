import { SECTORS_PATH } from "@lib/sectors"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import SectorCards from "./sector-cards"

/** Light "Soluções por setor" band for the home page. */
export default function HomeSectors() {
  return (
    <section aria-labelledby="home-sectors" data-testid="home-sectors">
      <div className="mb-[18px] flex flex-col items-start gap-1 small:mb-7 small:flex-row small:items-end small:justify-between small:gap-5">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan-ink">
            <span className="ind" />
            Setores
          </span>
          <h2
            id="home-sectors"
            className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[34px]"
          >
            Soluções por setor
          </h2>
        </div>
        <LocalizedClientLink
          href={SECTORS_PATH}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-cyan-ink hover:text-brand-ink small:text-xs"
        >
          Ver todos os setores
          <span aria-hidden>→</span>
        </LocalizedClientLink>
      </div>
      <SectorCards variant="tile" testId="home-sector-cards" />
    </section>
  )
}
