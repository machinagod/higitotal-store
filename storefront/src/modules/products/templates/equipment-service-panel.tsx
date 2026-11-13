import { Wrench, ArrowRight } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "Instalação e manutenção" — shown on equipment/machine product pages,
 * pointing to the technical-assistance service.
 */
export default function EquipmentServicePanel() {
  return (
    <aside
      className="flex items-start gap-4 rounded-large border border-hairline bg-[#f7f9fa] p-4 small:p-5"
      aria-labelledby="equipment-service-title"
      data-testid="equipment-service-panel"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-svc-signal/10 text-svc-signal">
        <Wrench className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2
          id="equipment-service-title"
          className="text-sm font-extrabold text-brand-ink"
        >
          Instalação e manutenção
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-grey-60">
          A nossa equipa técnica instala, repara e mantém este equipamento.
        </p>
        <LocalizedClientLink
          href="/assistencia-tecnica#pedir"
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-svc-signal-ink transition-colors hover:text-svc-signal"
        >
          Pedir assistência
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </LocalizedClientLink>
      </div>
    </aside>
  )
}
