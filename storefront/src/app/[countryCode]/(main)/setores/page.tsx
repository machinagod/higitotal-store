import { DEFAULT_OG_IMAGE } from "@lib/util/seo"
import { Metadata } from "next"

import { SECTORS_PATH } from "@lib/sectors"
import { canonicalUrl, SITE_NAME } from "@lib/util/seo"
import { breadcrumbSchema } from "@lib/util/structured-data"
import CompanyCta from "@modules/company/components/company-cta"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SectorCards from "@modules/sectors/components/sector-cards"

const TITLE = "Soluções de higiene por setor"
const DESCRIPTION =
  "Produtos de higiene e limpeza profissional por setor: restauração, hotelaria, lares e saúde, escolas e autarquias, indústria alimentar e escritórios."

const PATH = SECTORS_PATH.slice(1)

export async function generateMetadata(): Promise<Metadata> {
  const canonical = await canonicalUrl(PATH)
  return {
    // The root layout's title template appends " · Higitotal".
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${TITLE} · ${SITE_NAME}`,
      description: DESCRIPTION,
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function SectorsIndexPage() {
  const trail = [
    { name: SITE_NAME, url: await canonicalUrl("") },
    { name: "Setores", url: await canonicalUrl(PATH) },
  ]

  return (
    <div className="content-container flex flex-col gap-10 py-8 small:gap-16 small:py-12">
      <JsonLd data={breadcrumbSchema(trail)} />

      <section aria-labelledby="sectors-title">
        <nav aria-label="Navegação estrutural" className="mb-4">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-grey-50">
            <li>
              <LocalizedClientLink href="/" className="hover:text-brand-cyan">
                Início
              </LocalizedClientLink>
            </li>
            <li className="flex items-center gap-x-1.5">
              <span aria-hidden className="text-grey-30">
                /
              </span>
              <span aria-current="page" className="text-grey-60">
                Setores
              </span>
            </li>
          </ol>
        </nav>
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan-ink">
          <span className="ind" aria-hidden="true" />
          Soluções por setor
        </span>
        <h1
          id="sectors-title"
          className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[44px] small:leading-[1.08]"
        >
          {TITLE}
        </h1>
        <p className="mt-5 max-w-[64ch] text-lg leading-relaxed text-grey-70">
          Cada atividade tem as suas exigências de higiene. Escolha o seu setor
          para ver o que normalmente é preciso — da cozinha à lavandaria, dos
          pavimentos às casas de banho — e os produtos e marcas do nosso
          catálogo para cada necessidade.
        </p>
      </section>

      <SectorCards />

      <CompanyCta
        id="sectors-cta"
        title="Não encontra o seu setor?"
        text="Diga-nos o que precisa de limpar e com que frequência: ajudamos a escolher os produtos e preparamos um orçamento."
      />
    </div>
  )
}
