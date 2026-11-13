import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CoverageMap } from "./coverage-map"

const PILLS = ["Instalação", "Reparação", "Contratos de manutenção"]

const AtFeature = () => {
  return (
    <section className="relative overflow-hidden rounded-hero bg-svc-ground">
      <div className="grid grid-cols-1 small:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div className="relative z-[2] px-[22px] py-8 text-svc-fg small:px-14 small:py-16">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-svc-signal">
            <span className="ind amber" />
            Assistência Técnica
          </span>

          <h2 className="mt-4 max-w-[16ch] text-[26px] font-extrabold leading-[1.06] tracking-tight text-white small:text-[42px]">
            A sua equipa de manutenção, sediada em Mirandela.
          </h2>

          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-svc-fg-muted small:mt-5 small:text-base">
            Instalamos, reparamos e mantemos o seu equipamento profissional —
            cozinhas Fagor, preparação Sammic, máquinas Nilfisk e muito mais.
            Com contratos de manutenção preventiva, ajudamos a reduzir paragens
            no seu negócio.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 small:mt-7 small:gap-2.5">
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center gap-2 rounded-pill border border-svc-line bg-svc-ground-2 px-4 py-2.5 text-[13px] font-semibold text-svc-fg"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-svc-ok" />
                {pill}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5 small:mt-8 small:flex-row small:flex-wrap small:gap-3">
            <LocalizedClientLink
              href="/assistencia-tecnica#pedir"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-pill bg-svc-signal px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_30px_rgba(255,122,26,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-svc-signal-ink small:w-auto small:justify-start"
            >
              Pedir assistência
              <span aria-hidden>→</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/assistencia-tecnica"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-pill border-[1.5px] border-svc-line bg-transparent px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-svc-ground-2 small:w-auto small:justify-start"
            >
              Saber mais
            </LocalizedClientLink>
          </div>
        </div>

        {/* Visual (desktop only) — Portugal with Mirandela and the ≈200 km
            priority-response radius, same coastline data as the Assistência page. */}
        <div className="relative hidden min-h-[280px] overflow-hidden bg-svc-ground-2 small:block small:min-h-[480px]">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[38%] top-[34%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.10),transparent_65%)]"
          />
          <div className="absolute inset-0 flex items-center justify-center px-8 pb-24 pt-8 medium:pb-8 medium:pr-48">
            <CoverageMap className="h-full max-h-[440px] w-auto max-w-full" />
          </div>
          <div className="absolute bottom-7 right-7 min-w-[170px] rounded-large border border-svc-line bg-[rgba(15,17,21,0.72)] px-5 py-4 text-white backdrop-blur">
            <b className="text-3xl font-extrabold tracking-tight text-white">
              ≈200{"\u00a0"}
              <em className="not-italic text-svc-signal">km</em>
            </b>
            <span className="mt-1.5 block max-w-[24ch] text-xs font-medium leading-snug text-svc-fg-muted">
              Raio de resposta prioritária a partir de Mirandela
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AtFeature
