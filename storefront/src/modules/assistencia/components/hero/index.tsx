import { Phone, ArrowRight, ArrowLeft } from "lucide-react"

import { COMPANY, yearsInBusiness } from "@lib/company"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { IberiaMap } from "@modules/assistencia/components/iberia-map"

/** Hero stats. The ≈200 km priority radius is a business figure — confirm. */
const getStats = () => [
  {
    value: `${yearsInBusiness()} anos`,
    label: "de experiência no terreno",
  },
  {
    value: "≈200 km",
    label: "raio de resposta prioritária a partir de Mirandela",
  },
  {
    value: "No local",
    label: "ou em oficina, com peças originais",
  },
]

/**
 * Assistência Técnica hero — dark "pro" register. Headline about keeping
 * professional equipment running, CTAs, and a CSS-only coverage motif
 * (concentric rings centred on Mirandela, no external map images).
 */
const Hero = () => {
  return (
    <div className="relative overflow-hidden py-16 sm:py-20">
      {/* Ambient glows (cyan family link + amber signal) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[900px] w-[900px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,173,239,.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-260px] right-[-160px] h-[560px] w-[560px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,122,26,.10), transparent 62%)",
        }}
      />

      <div className="content-container relative z-[2] grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <LocalizedClientLink
            href="/store"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.03em] text-svc-fg-muted transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao catálogo
          </LocalizedClientLink>
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-svc-signal">
            <span className="ind amber" />
            Assistência Técnica Higitotal
          </span>
          <h1 className="mt-5 max-w-[15ch] text-4xl font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-5xl lg:text-[56px]">
            A sua equipa de <span className="text-svc-signal">manutenção</span>,
            a partir de Mirandela.
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-svc-fg-muted">
            Instalamos, reparamos e mantemos o seu equipamento profissional de
            cozinha, lavandaria e limpeza, com peças originais e contratos de
            manutenção. Técnicos especializados, sediados em Mirandela.
            Resposta prioritária no Norte.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pedir"
              className="inline-flex items-center gap-[10px] rounded-pill bg-svc-signal px-7 py-[15px] text-[13px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_30px_rgba(255,122,26,0.32)] transition hover:-translate-y-0.5 hover:bg-svc-signal-ink"
            >
              Pedir assistência
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={COMPANY.phone.href}
              aria-label={`Ligar para ${COMPANY.phone.display} (${COMPANY.phone.costNote.toLowerCase()})`}
              className="inline-flex items-center gap-[10px] rounded-pill border-[1.5px] border-svc-line bg-transparent px-7 py-[15px] text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-svc-ground-2"
            >
              <Phone className="h-4 w-4" /> {COMPANY.phone.display}
            </a>
          </div>
          <p className="mt-2 text-[11px] text-svc-fg-muted">
            {COMPANY.phone.costNote}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-svc-line pt-6 sm:flex sm:flex-wrap sm:gap-[26px] sm:border-0 sm:pt-0">
            {getStats().map((s) => (
              <div key={s.value} className="min-w-0">
                <b className="block text-xl font-extrabold leading-none tracking-[-0.02em] text-white sm:text-[26px]">
                  {s.value}
                </b>
                <span className="mt-1.5 block text-[11px] font-medium leading-snug text-svc-fg-muted sm:max-w-[22ch] sm:text-xs">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coverage panel — the real Iberia map layered over the stylized rings */}
        <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[28px] border border-svc-line bg-svc-ground-2 p-6 sm:min-h-[420px] sm:p-9">
          {/* stylized concentric rings (decorative backdrop) */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-svc-line opacity-25"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-svc-line opacity-40"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-svc-line opacity-50"
          />
          {/* label */}
          <span className="absolute left-6 top-6 z-[2] rounded-[14px] border border-svc-line bg-[#0f1115]/70 px-4 py-3 text-xs font-bold leading-snug text-white backdrop-blur">
            Sede em Mirandela
            <span className="mt-1 block font-medium text-svc-fg-muted">
              Resposta prioritária no Norte
            </span>
          </span>
          {/* real map */}
          <div className="relative z-[1] w-full max-w-[400px]">
            <IberiaMap />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
