import { Metadata } from "next"
import {
  ArrowRight,
  Building2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react"

import {
  COMPANY,
  DIRECTIONS_URL,
  MAPS_URL,
  weeklyHours,
} from "@lib/company"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { canonicalUrl, SITE_NAME } from "@lib/util/seo"
import { localBusinessSchema } from "@lib/util/structured-data"
import CompanyCta from "@modules/company/components/company-cta"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const TITLE = "A nossa loja"
const DESCRIPTION = `Morada, horário e direções para a Higitotal na Zona Industrial de ${COMPANY.address.city}. ${COMPANY.hours}.`

export async function generateMetadata(): Promise<Metadata> {
  const canonical = await canonicalUrl("a-nossa-loja")
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
    },
  }
}

const iconTile =
  "flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan"
const card = "rounded-card border border-hairline bg-white p-6 small:p-8"
const cardTitle =
  "flex items-center gap-3 text-lg font-extrabold tracking-[-0.01em] text-brand-ink"

export default async function ANossaLojaPage() {
  const { address, phone, email, geo } = COMPANY
  const canonical = await canonicalUrl("a-nossa-loja")
  const week = weeklyHours()
  const quoteHref = isCatalogMode() ? "/orcamento" : "/contact"

  return (
    <div className="content-container flex flex-col gap-12 py-10 small:gap-16 small:py-16">
      <JsonLd data={localBusinessSchema({ url: canonical })} />

      <header className="max-w-[64ch]">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan-ink">
          <span className="ind" aria-hidden="true" />
          Visite-nos
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[44px] small:leading-[1.08]">
          {TITLE}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-grey-70">
          A Higitotal está instalada na Zona Industrial de {address.city}.
          Pode visitar-nos dentro do horário de atendimento ou contactar-nos
          por telefone ou e-mail.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 small:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] small:items-start small:gap-6">
        {/* Address + directions */}
        <section aria-labelledby="store-address" className={card}>
          <h2 id="store-address" className={cardTitle}>
            <span className={iconTile}>
              <MapPin className="h-[18px] w-[18px]" aria-hidden />
            </span>
            Morada
          </h2>
          <address className="mt-5 text-lg not-italic leading-relaxed text-brand-ink">
            <span className="font-bold">{COMPANY.legalName}</span>
            <br />
            {address.street}
            <br />
            {address.postalCode} {address.city}, {address.country}
          </address>
          <p className="mt-2 text-sm text-grey-50">
            Coordenadas GPS:{" "}
            <span className="font-semibold tabular-nums text-grey-70">
              {geo.latitude}, {geo.longitude}
            </span>
          </p>

          <div className="mt-6 flex flex-col gap-2.5 xsmall:flex-row xsmall:flex-wrap">
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-brand-cyan px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-brand-cyan-ink"
              data-testid="store-directions"
            >
              <Navigation className="h-4 w-4" aria-hidden />
              Obter direções
              <span className="sr-only">
                (abre o Google Maps num novo separador)
              </span>
            </a>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-hairline px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan-ink"
              data-testid="store-map"
            >
              Ver no mapa
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">
                (abre o Google Maps num novo separador)
              </span>
            </a>
          </div>

          <ul className="mt-8 flex flex-col gap-2 border-t border-hairline pt-6">
            <li>
              <a
                href={phone.href}
                className="group -mx-2 flex min-h-[44px] items-center gap-3 rounded-btn px-2 py-1 transition-colors hover:bg-grey-5"
                data-testid="store-phone"
              >
                <span className={iconTile}>
                  <Phone className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span>
                  <span className="block font-bold text-brand-ink group-hover:text-brand-cyan-ink">
                    {phone.display}
                  </span>
                  <span className="block text-xs text-grey-50">
                    {phone.costNote}
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${email}`}
                className="group -mx-2 flex min-h-[44px] items-center gap-3 rounded-btn px-2 py-1 transition-colors hover:bg-grey-5"
                data-testid="store-email"
              >
                <span className={iconTile}>
                  <Mail className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="font-bold text-brand-ink group-hover:text-brand-cyan-ink">
                  {email}
                </span>
              </a>
            </li>
          </ul>
        </section>

        {/* Opening hours */}
        <section aria-labelledby="store-hours" className={card}>
          <h2 id="store-hours" className={cardTitle}>
            <span className={iconTile}>
              <Clock className="h-[18px] w-[18px]" aria-hidden />
            </span>
            Horário
          </h2>
          <dl className="mt-5 divide-y divide-hairline" data-testid="store-hours-list">
            {week.map((day) => (
              <div
                key={day.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3"
              >
                <dt className="font-semibold text-brand-ink">{day.label}</dt>
                <dd
                  className={`tabular-nums ${
                    day.slots.length ? "text-grey-70" : "text-grey-50"
                  }`}
                >
                  {day.slots.length ? day.slots.join(" · ") : "Encerrado"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-large bg-brand-cyan-50 p-5">
            <p className="font-extrabold text-brand-ink">
              Também pode pedir orçamento online
            </p>
            <p className="mt-1 text-sm leading-relaxed text-grey-60">
              Envie-nos o seu pedido a qualquer hora. A nossa equipa responde
              em dias úteis.
            </p>
            <LocalizedClientLink
              href={quoteHref}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-cyan-ink hover:underline"
              data-testid="store-quote-link"
            >
              Pedir orçamento
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
          </div>
        </section>
      </div>

      {/* Company identification + related pages */}
      <section
        aria-labelledby="store-company"
        className="flex flex-col gap-4 rounded-large border border-hairline bg-white p-6 small:flex-row small:items-center small:justify-between small:px-8"
      >
        <div className="flex items-start gap-3">
          <span className={iconTile}>
            <Building2 className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div>
            <h2 id="store-company" className="font-extrabold text-brand-ink">
              {COMPANY.legalName}
            </h2>
            <p className="mt-0.5 text-sm text-grey-60">
              NIPC {COMPANY.nipc} · Em {address.city} desde {COMPANY.since}
            </p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-6">
          <li>
            <LocalizedClientLink
              href="/sobre-nos"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-cyan-ink hover:underline"
              data-testid="store-about-link"
            >
              Sobre nós
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink
              href="/contact"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-cyan-ink hover:underline"
              data-testid="store-contact-link"
            >
              Formulário de contacto
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
          </li>
        </ul>
      </section>

      <CompanyCta
        id="store-cta"
        title="Conte connosco"
        text="Para orçamentos, informação sobre produtos ou assistência técnica, fale connosco."
      />
    </div>
  )
}
