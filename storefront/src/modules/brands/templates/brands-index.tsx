import { ArrowRight, Wrench } from "lucide-react"

import {
  BRANDS_INDEX_COPY,
  brandPageCopy,
  brandServicePath,
} from "@lib/brand-pages"
import { BRANDS, brandHref } from "@lib/brands"
import BrandLogoImg from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/** `/marcas`: every brand, logo first, each card leading to its page. */
export default function BrandsIndexTemplate() {
  const serviced = BRANDS.filter((b) => brandServicePath(b))

  return (
    <div className="content-container py-6 small:py-8" data-testid="brands-index">
      <nav aria-label="Navegação estrutural" className="mb-3">
        <ol className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-grey-50">
          <li>
            <LocalizedClientLink href="/" className="hover:text-brand-cyan">
              Início
            </LocalizedClientLink>
          </li>
          <li className="flex items-center gap-x-1.5">
            <span aria-hidden className="text-grey-30">/</span>
            <span aria-current="page" className="text-grey-60">
              Marcas
            </span>
          </li>
        </ol>
      </nav>

      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
        <span className="ind" aria-hidden="true" />
        Marcas com que trabalhamos
      </span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[40px] small:leading-[1.1]">
        {BRANDS_INDEX_COPY.heading}
      </h1>
      <p className="mt-4 max-w-[64ch] leading-relaxed text-grey-60 small:text-lg">
        {BRANDS_INDEX_COPY.intro}
      </p>

      <ul
        className="mt-8 grid grid-cols-1 gap-3 xsmall:grid-cols-2 small:mt-10 small:grid-cols-3 small:gap-4 medium:grid-cols-4"
        data-testid="brands-index-list"
      >
        {BRANDS.map((b) => (
          <li key={b.name} className="flex">
            <LocalizedClientLink
              href={brandHref(b)}
              className="group flex w-full flex-col rounded-card border border-hairline bg-white p-4 transition-[border-color,box-shadow] hover:border-brand-cyan hover:shadow-[0_12px_32px_rgba(35,31,32,0.08)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/25 small:p-5"
            >
              <span className="flex h-20 items-center justify-center rounded-large bg-[#f7f9fa] px-4">
                {b.logo ? (
                  <BrandLogoImg logo={b.logo} boxW={140} boxH={36} variant="color" />
                ) : (
                  <span className="text-xl font-extrabold text-brand-ink">
                    {b.wordmark ?? b.name}
                  </span>
                )}
              </span>
              <span className="mt-4 text-lg font-extrabold tracking-[-0.01em] text-brand-ink">
                {b.name}
              </span>
              <span className="mt-1 text-sm leading-snug text-grey-60">
                {brandPageCopy(b).tagline}
              </span>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-brand-cyan-ink">
                Ver produtos
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>

      {serviced.length > 0 && (
        <section
          aria-labelledby="brands-service-title"
          className="mt-12 flex flex-col gap-5 rounded-card bg-svc-ground p-6 text-svc-fg xsmall:p-8 small:mt-16 small:flex-row small:items-center small:justify-between small:p-10"
        >
          <div className="max-w-[62ch]">
            <h2
              id="brands-service-title"
              className="text-xl font-extrabold tracking-[-0.02em] text-white small:text-2xl"
            >
              Assistência técnica
            </h2>
            <p className="mt-2 leading-relaxed text-svc-fg-muted">
              Instalamos, reparamos e fazemos a manutenção de equipamento{" "}
              {serviced.map((b) => b.name).join(", ").replace(/, ([^,]*)$/, " e $1")}.
            </p>
          </div>
          <ul className="flex flex-none flex-wrap gap-2">
            {serviced.map((b) => (
              <li key={b.name}>
                <LocalizedClientLink
                  href={brandServicePath(b)!}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-svc-line px-4 text-sm font-semibold text-svc-fg transition-colors hover:border-svc-signal-bright hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-svc-signal-bright/40"
                >
                  <Wrench className="h-4 w-4 text-svc-signal-bright" aria-hidden />
                  {b.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
