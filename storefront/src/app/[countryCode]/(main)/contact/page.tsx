import { Metadata } from "next"
import {
  ArrowRight,
  Building2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"

import { COMPANY, MAPS_URL as MAP_URL } from "@lib/company"
import { hygienePlanRequest } from "@lib/util/hygiene-plan-request"
import ContactRequestForm from "@modules/common/components/contact-request-form"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { pageMetadata } from "@lib/util/seo"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    path: "contact",
    title: "Contactos",
    description:
      "Contacte a Higitotal — produtos de higiene profissional, equipamento hoteleiro e assistência técnica. Mirandela, Portugal.",
  })
}

const iconTile =
  "flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-[#eef6fa] text-brand-cyan"

/** Whole contact row is the link (icon included), ≥44px tall. */
const rowLink =
  "group -mx-2 flex min-h-[44px] items-center gap-3 rounded-btn px-2 py-1 transition-colors hover:bg-[#f7f9fa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/25"

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { address, phone } = COMPANY
  // "Pedir um plano de higiene" on the sector pages links here with
  // ?pedido=plano-higiene&setor=<slug>: tag the request and pre-fill it.
  const plan = hygienePlanRequest(await searchParams)
  return (
    <div className="content-container py-10 small:py-16">
      <div className="grid grid-cols-1 gap-10 small:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] small:gap-14">
        {/* Left — company contacts */}
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
            <span className="ind" aria-hidden="true" />
            Fale connosco
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[40px] small:leading-[1.1]">
            Contactos
          </h1>
          <p className="mt-4 max-w-[46ch] leading-relaxed text-grey-60">
            Para orçamentos, informação sobre produtos ou outras questões,
            utilize o formulário ou contacte-nos diretamente. A nossa equipa
            responde em dias úteis.
          </p>

          <ul className="mt-8 flex flex-col gap-3 text-brand-ink">
            <li>
              <a
                href={phone.href}
                className={rowLink}
                data-testid="contact-phone"
              >
                <span className={iconTile}>
                  <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold transition-colors group-hover:text-brand-cyan-ink">
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
                href={`mailto:${COMPANY.email}`}
                className={rowLink}
                data-testid="contact-email"
              >
                <span className={iconTile}>
                  <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className="font-bold transition-colors group-hover:text-brand-cyan-ink">
                  {COMPANY.email}
                </span>
              </a>
            </li>
            <li>
              <a
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={rowLink}
                data-testid="contact-map"
              >
                <span className={iconTile}>
                  <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <address className="not-italic font-medium leading-relaxed text-grey-70">
                    {address.street}
                    <br />
                    {address.postalCode} {address.city}, {address.country}
                  </address>
                  <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-cyan-ink group-hover:underline">
                    Ver no mapa
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="sr-only">
                    (abre o Google Maps num novo separador)
                  </span>
                </div>
              </a>
            </li>
            <li className="flex items-center gap-3 py-1">
              <span className={iconTile}>
                <Clock className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold">Horário</p>
                <p className="text-sm leading-relaxed text-grey-60">
                  {COMPANY.hours}
                </p>
              </div>
            </li>
            <li className="flex items-center gap-3 py-1">
              <span className={iconTile}>
                <Building2 className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold">{COMPANY.legalName}</p>
                <p className="text-sm text-grey-60">NIPC {COMPANY.nipc}</p>
              </div>
            </li>
          </ul>

          <LocalizedClientLink
            href="/a-nossa-loja"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-cyan-ink hover:underline"
            data-testid="contact-store-link"
          >
            Como chegar à nossa loja
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LocalizedClientLink>

          <div className="mt-8 rounded-large border border-hairline bg-[#f7f9fa] p-5">
            <p className="text-sm font-extrabold text-brand-ink">
              Assistência técnica
            </p>
            <p className="mt-1 text-sm leading-relaxed text-grey-60">
              Para instalação, reparação ou manutenção de equipamento, utilize o
              pedido de assistência.
            </p>
            <LocalizedClientLink
              href="/assistencia-tecnica#pedir"
              className="mt-3 inline-flex items-center gap-2 rounded-pill bg-svc-signal px-5 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-svc-signal-ink"
            >
              Pedir assistência
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LocalizedClientLink>
          </div>
        </div>

        {/* Right — general enquiry form */}
        <section
          aria-labelledby="contact-form-title"
          className="rounded-card border border-hairline bg-white p-5 shadow-[0_18px_50px_rgba(35,31,32,0.06)] xsmall:p-8"
        >
          <h2
            id="contact-form-title"
            className="text-2xl font-extrabold tracking-[-0.02em] text-brand-ink"
          >
            Envie-nos uma mensagem
          </h2>
          <p className="mb-6 mt-1 text-sm text-grey-60">
            Os campos assinalados com * são obrigatórios.
          </p>
          <ContactRequestForm
            kind={plan ? "plano" : "geral"}
            idPrefix="contact"
            prefilledMessage={plan?.message}
          />
        </section>
      </div>
    </div>
  )
}
