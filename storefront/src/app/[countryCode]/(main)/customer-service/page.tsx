import { Metadata } from "next"
import {
  ArrowRight,
  Clock,
  FileText,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { COMPANY } from "@lib/company"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Apoio ao Cliente",
  description:
    "Pedidos de informação, orçamentos, acompanhamento de encomendas e assistência pós-venda Higitotal.",
}

type HelpCard = {
  href: string
  Icon: LucideIcon
  title: string
  body: string
  cta: string
  /** Service (orange) register for the technical-assistance card. */
  service?: boolean
}

const CARDS: HelpCard[] = [
  {
    href: "/contact",
    Icon: FileText,
    title: "Pedidos e orçamentos",
    body: "Peça preços, condições ou o ponto de situação de uma encomenda feita com o seu comercial.",
    cta: "Contactar a equipa comercial",
  },
  {
    href: "/assistencia-tecnica",
    Icon: Wrench,
    title: "Assistência Técnica",
    body: "Instalação, reparação e contratos de manutenção de equipamento profissional.",
    cta: "Pedir assistência",
    service: true,
  },
  {
    href: "/store",
    Icon: LayoutGrid,
    title: "Catálogo",
    body: "Consulte os produtos e peça orçamento diretamente na página de cada artigo.",
    cta: "Ver catálogo",
  },
  {
    href: "/contact",
    Icon: RotateCcw,
    title: "Pós-venda",
    body: "Para devoluções, trocas ou garantias, contacte-nos com a referência da fatura ou da encomenda.",
    cta: "Falar connosco",
  },
]

export default function CustomerServicePage() {
  const a = COMPANY.address

  return (
    <div className="content-container py-10 small:py-16">
      <div className="grid grid-cols-1 gap-10 small:grid-cols-[minmax(0,1fr)_340px] medium:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-brand-cyan">
            <span className="ind" />
            Estamos cá para ajudar
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-ink small:text-[40px] small:leading-[1.1]">
            Apoio ao Cliente
          </h1>
          <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-grey-60">
            A nossa equipa comercial e técnica está disponível para pedidos de
            informação, orçamentos, acompanhamento de encomendas e assistência
            pós-venda.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 xsmall:grid-cols-2">
            {CARDS.map((c) => (
              <LocalizedClientLink
                key={c.title}
                href={c.href}
                className={`group flex flex-col rounded-card border border-hairline bg-white p-6 transition-colors ${
                  c.service ? "hover:border-svc-signal" : "hover:border-brand-cyan"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-btn ${
                    c.service
                      ? "bg-svc-signal/10 text-svc-signal"
                      : "bg-brand-cyan/10 text-brand-cyan"
                  }`}
                >
                  <c.Icon className="h-5 w-5" />
                </span>
                <b className="mt-4 block text-lg font-bold tracking-tight text-brand-ink">
                  {c.title}
                </b>
                <span className="mt-1.5 block flex-1 text-sm leading-relaxed text-grey-60">
                  {c.body}
                </span>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.04em] ${
                    c.service ? "text-svc-signal-ink" : "text-brand-cyan-ink"
                  }`}
                >
                  {c.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4 small:pt-[52px]">
          <div className="rounded-card bg-brand-ink p-7 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
              Contactos
            </p>
            <a
              href={COMPANY.phone.href}
              className="mt-4 flex items-start gap-3 transition-colors hover:text-brand-cyan"
            >
              <Phone className="mt-0.5 h-[18px] w-[18px] flex-none text-brand-cyan" />
              <span>
                <b className="block text-lg font-bold">{COMPANY.phone.display}</b>
                <span className="block text-xs text-white/60">
                  {COMPANY.phone.costNote}
                </span>
              </span>
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="mt-4 flex items-center gap-3 font-semibold transition-colors hover:text-brand-cyan"
            >
              <Mail className="h-[18px] w-[18px] flex-none text-brand-cyan" />
              {COMPANY.email}
            </a>
            <div className="mt-4 flex items-start gap-3 text-sm text-white/80">
              <Clock className="mt-0.5 h-[18px] w-[18px] flex-none text-brand-cyan" />
              <span>{COMPANY.hours}</span>
            </div>
            <div className="mt-4 flex items-start gap-3 text-sm text-white/80">
              <MapPin className="mt-0.5 h-[18px] w-[18px] flex-none text-brand-cyan" />
              <span>
                {a.street}
                <br />
                {a.postalCode} {a.city}, {a.country}
              </span>
            </div>
          </div>

          <div className="rounded-card border border-hairline p-6 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-grey-50">
              Informação legal
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-grey-60">
              <li>
                <LocalizedClientLink
                  href="/content/terms-of-use"
                  className="hover:text-brand-cyan"
                >
                  Termos de Utilização
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/content/privacy-policy"
                  className="hover:text-brand-cyan"
                >
                  Política de Privacidade
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/content/cookie-policy"
                  className="hover:text-brand-cyan"
                >
                  Política de Cookies
                </LocalizedClientLink>
              </li>
              <li>
                <a
                  href={COMPANY.complaintsBookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-cyan"
                >
                  Livro de Reclamações Eletrónico
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
