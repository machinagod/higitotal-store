import { Metadata } from "next"

import Hero from "@modules/assistencia/components/hero"
import Services from "@modules/assistencia/components/services"
import Equipment from "@modules/assistencia/components/equipment"
import Maintenance from "@modules/assistencia/components/maintenance"
import RequestForm from "@modules/assistencia/components/request-form"

export const metadata: Metadata = {
  title: "Assistência Técnica",
  description:
    "Instalação, reparação e contratos de manutenção de equipamento profissional de cozinha, lavandaria e limpeza. Técnicos especializados, sediados em Mirandela, com resposta prioritária no Norte.",
}

type Params = {
  params: {
    countryCode: string
  }
}

export default function AssistenciaTecnicaPage({}: Params) {
  return (
    <div className="bg-svc-ground text-svc-fg">
      <Hero />
      <Services />
      <Maintenance />
      <Equipment />

      <section
        id="pedir"
        className="content-container scroll-mt-32 pb-20 sm:scroll-mt-40 sm:pb-[74px]"
      >
        <RequestForm />
      </section>

      {/* Separator before the (also dark) site footer */}
      <div aria-hidden className="relative border-t border-svc-line">
        <span className="absolute left-1/2 top-[-2px] h-[3px] w-16 -translate-x-1/2 rounded-full bg-svc-signal" />
      </div>
    </div>
  )
}
