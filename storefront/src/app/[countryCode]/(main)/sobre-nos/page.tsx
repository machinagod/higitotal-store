import { Metadata } from "next"
import Image from "next/image"
import {
  ArrowRight,
  ClipboardCheck,
  CookingPot,
  HeartHandshake,
  Leaf,
  type LucideIcon,
  MapPin,
  PencilRuler,
  Scale,
  Scroll,
  Settings2,
  SprayCan,
  Target,
  WashingMachine,
  Wrench,
} from "lucide-react"

import { stripBrands } from "@lib/brands"
import { COMPANY, yearsInBusiness } from "@lib/company"
import { getStripBrands } from "@lib/data/categories"
import { canonicalUrl, SITE_NAME } from "@lib/util/seo"
import { aboutPageSchema } from "@lib/util/structured-data"
import CompanyCta from "@modules/company/components/company-cta"
import sedePhoto from "@modules/company/assets/sede-mirandela.webp"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const TITLE = "Sobre nós"
const DESCRIPTION = `A Higitotal fornece produtos de higiene e limpeza profissional, papel, equipamento hoteleiro e de lavandaria e máquinas de limpeza, com assistência técnica própria. Em Mirandela, desde ${COMPANY.since}.`

export async function generateMetadata(): Promise<Metadata> {
  const canonical = await canonicalUrl("sobre-nos")
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
      images: [
        {
          url: sedePhoto.src,
          width: sedePhoto.width,
          height: sedePhoto.height,
          alt: PHOTO_ALT,
        },
      ],
    },
  }
}

type Item = { Icon: LucideIcon; label: string }

const SUPPLY: Item[] = [
  { Icon: SprayCan, label: "Produtos de higiene e limpeza profissional" },
  { Icon: Scroll, label: "Papel de uso profissional" },
  {
    Icon: CookingPot,
    label: "Equipamento hoteleiro, de cozinha e de lavandaria industrial",
  },
  { Icon: WashingMachine, label: "Máquinas de limpeza" },
]

const SERVICES: Item[] = [
  { Icon: ClipboardCheck, label: "Avaliação de necessidades" },
  { Icon: PencilRuler, label: "Elaboração de projetos" },
  { Icon: Settings2, label: "Instalação e manutenção de equipamento" },
]

const VALUES: (Item & { text: string })[] = [
  {
    Icon: Target,
    label: "Dedicação e rigor",
    text: "Acompanhamos cada pedido com atenção ao detalhe, do primeiro contacto ao serviço pós-venda.",
  },
  {
    Icon: Scale,
    label: "Ética",
    text: "Pautamos as relações comerciais pela transparência e pelo cumprimento dos compromissos assumidos.",
  },
  {
    Icon: Leaf,
    label: "Desenvolvimento sustentável",
    text: "Procuramos soluções duradouras e aconselhamos a utilização correta de produtos e equipamento.",
  },
  {
    Icon: HeartHandshake,
    label: "Relações de confiança",
    text: "Construímos relações de longo prazo com clientes e fornecedores, assentes na confiança mútua.",
  },
]

const PHOTO_ALT =
  "Instalações da Higitotal na Zona Industrial de Mirandela, com o painel das marcas e as viaturas de assistência técnica"

/* Shared type scale for the page sections. */
const eyebrow =
  "inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan-ink"
const h2 =
  "mt-3 text-2xl font-extrabold tracking-[-0.02em] text-brand-ink small:text-[32px] small:leading-[1.15]"
const iconTile =
  "flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan"

/* Brand marks sit in a fixed box, like the homepage strip. */
const LOGO_W = 112
const LOGO_H = 30
const fit = (w: number, h: number) => {
  const s = Math.min(LOGO_W / w, LOGO_H / h)
  return { width: Math.round(w * s), height: Math.round(h * s) }
}

function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ Icon, label }) => (
        <li key={label} className="flex items-center gap-3">
          <span className={iconTile}>
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="font-semibold leading-snug text-brand-ink">
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default async function SobreNosPage() {
  const years = yearsInBusiness()
  // Live landing pages for each brand; static config if the backend is down.
  const brands = await getStripBrands().catch(() => stripBrands())
  const canonical = await canonicalUrl("sobre-nos")

  return (
    <div className="content-container flex flex-col gap-12 py-10 small:gap-20 small:py-16">
      <JsonLd
        data={aboutPageSchema({
          url: canonical,
          name: `${TITLE} · ${SITE_NAME}`,
          description: DESCRIPTION,
        })}
      />

      {/* Intro */}
      <section
        aria-labelledby="about-title"
        className="grid grid-cols-1 gap-8 small:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] small:items-center small:gap-14"
      >
        <div>
          <span className={eyebrow}>
            <span className="ind" aria-hidden="true" />A empresa
          </span>
          <h1
            id="about-title"
            className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[44px] small:leading-[1.08]"
          >
            {TITLE}
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-grey-70">
            Desde {COMPANY.since}, a Higitotal fornece soluções de higiene e
            limpeza profissional a empresas de hotelaria, restauração, indústria
            e outros setores. Estamos sediados em Mirandela e contamos {years}{" "}
            anos de atividade no mercado português.
          </p>
          <p className="mt-4 max-w-[60ch] leading-relaxed text-grey-60">
            Acompanhamos cada cliente desde a avaliação das necessidades até à
            instalação e à manutenção do equipamento, com uma equipa
            especializada e assistência técnica própria.
          </p>
          <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-large border border-hairline bg-white xsmall:grid-cols-4">
            <div className="border-b border-r border-hairline p-5 xsmall:border-b-0">
              <dt className="text-xs font-semibold text-grey-50">Desde</dt>
              <dd className="mt-1 text-[28px] font-extrabold leading-none tracking-tight text-brand-ink">
                {COMPANY.since}
              </dd>
            </div>
            <div className="border-b border-hairline p-5 xsmall:border-b-0 xsmall:border-r">
              <dt className="text-xs font-semibold text-grey-50">
                Anos de atividade
              </dt>
              <dd className="mt-1 text-[28px] font-extrabold leading-none tracking-tight text-brand-ink">
                {years}
              </dd>
            </div>
            <div className="border-r border-hairline p-5">
              <dt className="text-xs font-semibold text-grey-50">Sede</dt>
              <dd className="mt-1 font-bold leading-snug text-brand-ink">
                {COMPANY.address.city}
              </dd>
            </div>
            <div className="p-5">
              <dt className="text-xs font-semibold text-grey-50">
                Assistência técnica
              </dt>
              <dd className="mt-1 font-bold leading-snug text-brand-ink">
                Própria
              </dd>
            </div>
          </dl>
        </div>

        <figure className="overflow-hidden rounded-large border border-hairline bg-grey-10">
          <Image
            src={sedePhoto}
            alt={PHOTO_ALT}
            placeholder="blur"
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="h-auto w-full"
          />
        </figure>
      </section>

      {/* What we do */}
      <section aria-labelledby="about-what">
        <span className={eyebrow}>
          <span className="ind" aria-hidden="true" />O que fazemos
        </span>
        <h2 id="about-what" className={h2}>
          Produtos e serviços numa só empresa
        </h2>
        <p className="mt-3 max-w-[64ch] leading-relaxed text-grey-60">
          Respondemos tanto às necessidades do dia a dia como às exigências
          mais específicas de cada negócio, do fornecimento de produtos à
          assistência técnica.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 small:grid-cols-2 small:gap-6">
          <div className="rounded-card border border-hairline bg-white p-6 small:p-8">
            <h3 className="text-lg font-extrabold text-brand-ink">
              Fornecimento
            </h3>
            <div className="mt-5">
              <ItemList items={SUPPLY} />
            </div>
            <LocalizedClientLink
              href="/store"
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-cyan-ink hover:underline"
            >
              Ver o catálogo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
          </div>

          <div className="rounded-card border border-hairline bg-white p-6 small:p-8">
            <h3 className="text-lg font-extrabold text-brand-ink">Serviços</h3>
            <div className="mt-5 flex flex-col gap-3">
              <ItemList items={SERVICES} />
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-svc-ground text-svc-signal-bright">
                  <Wrench className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="font-semibold leading-snug text-brand-ink">
                  Assistência técnica própria
                </span>
              </div>
            </div>
            <LocalizedClientLink
              href="/assistencia-tecnica"
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-svc-signal hover:underline"
              data-testid="about-assistencia-link"
            >
              Conhecer a assistência técnica
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section aria-labelledby="about-brands">
          <span className={eyebrow}>
            <span className="ind" aria-hidden="true" />
            Marcas
          </span>
          <h2 id="about-brands" className={h2}>
            Marcas com que trabalhamos
          </h2>
          <p className="mt-3 max-w-[64ch] leading-relaxed text-grey-60">
            Para assegurar a qualidade do que fornecemos, trabalhamos com
            marcas reconhecidas no setor profissional, entre as quais:
          </p>

          <ul
            className="mt-8 grid grid-cols-2 gap-3 small:grid-cols-5"
            data-testid="about-brands"
          >
            {brands.map((brand) => {
              const size = brand.logo
                ? fit(brand.logo.width, brand.logo.height)
                : null
              return (
                <li key={brand.name}>
                  <LocalizedClientLink
                    href={brand.href}
                    className="group flex h-full min-h-[96px] flex-col items-center justify-center gap-2 rounded-large border border-hairline bg-white px-3 py-4 text-center transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
                  >
                    {brand.logo && size ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brand.logo.src}
                          alt=""
                          width={size.width}
                          height={size.height}
                          loading="lazy"
                          decoding="async"
                          className="block opacity-80 [filter:grayscale(1)_brightness(0.35)] transition-[filter,opacity] group-hover:opacity-100 group-hover:[filter:none]"
                          style={{ width: size.width, height: size.height }}
                        />
                        <span className="text-xs font-semibold text-grey-60">
                          {brand.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-extrabold tracking-tight text-brand-ink">
                        {brand.name}
                      </span>
                    )}
                  </LocalizedClientLink>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-sm text-grey-50">
            Entre outras. Se procura uma marca que não encontra no catálogo,{" "}
            <LocalizedClientLink
              href="/contact"
              className="font-semibold text-brand-cyan-ink underline underline-offset-2"
            >
              contacte-nos
            </LocalizedClientLink>
            .
          </p>
        </section>
      )}

      {/* How we work */}
      <section aria-labelledby="about-how">
        <div className="grid grid-cols-1 gap-8 small:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] small:gap-14">
          <div>
            <span className={eyebrow}>
              <span className="ind" aria-hidden="true" />
              Como trabalhamos
            </span>
            <h2 id="about-how" className={h2}>
              Dedicação, rigor e relações de longo prazo
            </h2>
            <p className="mt-4 leading-relaxed text-grey-60">
              A nossa forma de trabalhar assenta na dedicação e no rigor. O
              nosso compromisso é criar valor para os clientes com base em
              princípios de ética e de desenvolvimento sustentável, numa
              perspetiva de longo prazo e em relações de confiança com clientes
              e fornecedores.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
            {VALUES.map(({ Icon, label, text }) => (
              <li
                key={label}
                className="rounded-large border border-hairline bg-white p-5"
              >
                <span className={iconTile}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <h3 className="mt-4 font-extrabold text-brand-ink">{label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-grey-60">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Where we are (short) */}
      <section
        aria-labelledby="about-where"
        className="flex flex-col gap-4 rounded-large border border-hairline bg-white p-6 xsmall:flex-row xsmall:items-center xsmall:justify-between small:px-8"
      >
        <div className="flex items-start gap-3">
          <span className={iconTile}>
            <MapPin className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div>
            <h2 id="about-where" className="font-extrabold text-brand-ink">
              Onde estamos
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-grey-60">
              {COMPANY.address.street}, {COMPANY.address.postalCode}{" "}
              {COMPANY.address.city}
            </p>
          </div>
        </div>
        <LocalizedClientLink
          href="/a-nossa-loja"
          className="inline-flex min-h-[44px] flex-none items-center gap-2 text-sm font-bold text-brand-cyan-ink hover:underline"
          data-testid="about-store-link"
        >
          Morada, horário e direções
          <ArrowRight className="h-4 w-4" aria-hidden />
        </LocalizedClientLink>
      </section>

      <CompanyCta
        id="about-cta"
        title="Conte connosco"
        text="Estamos ao seu dispor para avaliar as necessidades do seu negócio e preparar uma proposta à medida."
      />
    </div>
  )
}
