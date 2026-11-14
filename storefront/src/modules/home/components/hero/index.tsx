import { Wrench } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FeaturedCarousel from "@modules/home/components/hero/featured-carousel"
import HeroRotator from "@modules/home/components/hero/hero-rotator"
import { COMPANY } from "@lib/company"

const Hero = ({
  images = [],
  carouselImages,
}: {
  /** Cut-out product shots for the media panel; the first is the LCP image. */
  images?: string[]
  carouselImages?: Record<string, string | undefined>
}) => {
  return (
    <div className="grid grid-cols-1 gap-5 medium:grid-cols-[1.15fr_0.85fr]">
      {/* Main cyan card */}
      <div className="relative flex min-h-0 flex-col items-start gap-4 overflow-hidden rounded-hero bg-gradient-to-br from-brand-navy to-brand-cyan px-5 py-7 text-white small:min-h-[440px] small:flex-row small:items-center small:gap-5 small:px-13 small:py-12">
        {/* Decorative orbs (desktop only) */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 hidden h-[420px] w-[420px] rounded-full bg-white/10 small:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-40 right-16 hidden h-80 w-80 rounded-full bg-white/[0.06] small:block"
        />
        {/* Watermark — Higitotal mark, faint and diagonal in the corner */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/higitotal/favicon.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-7 -right-7 z-[1] h-36 w-36 rotate-[18deg] opacity-[0.12] [filter:brightness(0)_invert(1)] small:h-48 small:w-48"
        />

        {/* Mobile: the product shots drift behind the text — top-right,
            partly off-card, faded towards the copy so it stays readable.
            (Desktop shows them in the media panel instead.) */}
        {images.length > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-4 z-[1] h-[230px] w-[230px] opacity-[0.28] [mask-image:radial-gradient(circle_at_70%_40%,#000_35%,transparent_72%)] small:hidden"
          >
            {/* Not `priority`: the desktop panel below already preloads the
                first shot. Same (default, breakpoint-aware) `sizes` as that
                panel, so this eager first image reuses the preloaded file —
                one download per viewport, whichever layer is visible. */}
            <HeroRotator
              images={images}
              priority={false}
              className="relative h-full w-full"
              imgClassName="object-contain"
            />
          </div>
        )}

        <div className="relative z-[2] small:flex-[1_1_64%]">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#bdeaff]">
            <span className="ind" />
            Aceitamos desafios. Entregamos soluções.
          </span>

          <h1 className="mt-4 max-w-[18ch] text-[28px] font-extrabold leading-[1.06] tracking-tight small:max-w-none small:text-[36px] medium:text-[42px]">
            Higiene profissional e equipamento hoteleiro, desde{" "}
            {COMPANY.since}
          </h1>

          <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-white/90 small:mt-5 small:text-[17px]">
            Produtos, equipamento e máquinas de limpeza para hotelaria,
            restauração e indústria — com stock próprio em Mirandela e
            aconselhamento técnico.
          </p>

          {/* Two columns from 360px; below that (320px phones) the uppercase
              labels no longer fit side by side, so the buttons stack. */}
          <div className="mt-6 grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 small:mt-8 small:flex small:flex-wrap small:gap-3">
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-pill bg-white px-3 py-3.5 text-[12px] font-bold uppercase tracking-[0.02em] text-brand-navy shadow-lg transition-transform hover:-translate-y-0.5 small:px-6 small:text-[13px] small:tracking-[0.04em]"
            >
              Ver catálogo
              <span aria-hidden>→</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/contact"
              className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-pill border-[1.5px] border-white/60 bg-white/[0.14] px-3 py-3.5 text-[12px] font-bold uppercase tracking-[0.02em] text-white transition-transform hover:-translate-y-0.5 hover:bg-white/25 small:px-6 small:text-[13px] small:tracking-[0.04em]"
            >
              Pedir orçamento
            </LocalizedClientLink>
          </div>
        </div>

        {/* Media panel (desktop only) — a featured product shot on the glow */}
        {images.length > 0 && (
          <div className="relative z-[2] hidden small:flex small:flex-[1_1_36%] items-center justify-center self-stretch">
            <span
              aria-hidden
              className="pointer-events-none absolute h-72 w-72 rounded-full bg-white/20 blur-2xl"
            />
            {/* Product shots (ovens, machines, chemicals…) cross-fading in a
                capped-height contain box; the first is the LCP candidate. */}
            <HeroRotator images={images} />
          </div>
        )}
      </div>

      {/* Side column */}
      <div className="grid grid-cols-1 gap-3 small:grid-cols-2 small:gap-5 medium:grid-cols-1 medium:grid-rows-2">
        {/* Featured card — auto-rotating carousel over a few collections */}
        <FeaturedCarousel images={carouselImages} />

        {/* Service card */}
        <div className="relative flex flex-col justify-center overflow-hidden rounded-card border border-svc-line bg-svc-ground p-5 text-svc-fg small:p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,122,26,0.22),transparent_70%)]"
          />
          {/* The service mark: a large outlined wrench on the orange glow,
              behind the copy (decorative). */}
          <Wrench
            aria-hidden
            strokeWidth={1.4}
            className="pointer-events-none absolute bottom-5 right-5 z-[1] h-[72px] w-[72px] -rotate-12 text-svc-signal-bright opacity-80 max-[359px]:hidden small:bottom-7 small:right-7 small:h-24 small:w-24"
          />
          <div className="relative z-[2]">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-svc-signal">
              <span className="ind amber" />
              Assistência Técnica
            </span>
            <h2 className="mt-2.5 max-w-[13ch] text-xl font-bold leading-tight tracking-tight text-white small:text-2xl">
              Instalação, reparação e manutenção
            </h2>
            <p className="mt-2 max-w-[28ch] text-[13px] font-medium leading-snug text-svc-fg-muted">
              Técnicos especializados, sediados em Mirandela. Resposta
              prioritária no Norte.
            </p>
            <LocalizedClientLink
              href="/assistencia-tecnica#pedir"
              className="mt-4 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.04em] text-white"
            >
              Pedir assistência
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-svc-signal text-white">
                →
              </span>
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
