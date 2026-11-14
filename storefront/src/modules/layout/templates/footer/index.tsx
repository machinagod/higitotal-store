import type { ReactNode } from "react"
import {
  BookOpen,
  ChevronDown,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react"

import { BRANDS_PATH } from "@lib/brands"
import { getNavGroups } from "@lib/data/categories"
import { COMPANY } from "@lib/company"
import { SECTORS, SECTORS_PATH, sectorHref } from "@lib/sectors"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { analyticsEnabled } from "@lib/util/gtm"
import CookiePreferencesButton from "@modules/common/components/cookie-consent/preferences-button"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BlackCat from "@modules/layout/components/black-cat"
import ExpandableLinkList from "./expandable-link-list"

type FooterLink = { label: string; href: string }

// Each service leads straight to the request form on the Assistência page
// (the page has no per-service sections; the form's "Tipo de serviço" field
// covers all three).
const SERVICE_FORM = "/assistencia-tecnica#pedir"
const SERVICE_LINKS = ["Instalação", "Reparação", "Contratos de manutenção"]

const COMPANY_LINKS: FooterLink[] = [
  { label: "Sobre nós", href: "/sobre-nos" },
  { label: "A nossa loja", href: "/a-nossa-loja" },
  { label: "Assistência técnica", href: "/assistencia-tecnica" },
  { label: "Contactos", href: "/contact" },
]

const SECTOR_LINKS: FooterLink[] = [
  ...SECTORS.map((s) => ({ label: s.name, href: sectorHref(s) })),
  { label: "Todos os setores", href: SECTORS_PATH },
]

const LEGAL_LINKS: FooterLink[] = [
  { label: "Política de Privacidade", href: "/content/privacy-policy" },
  { label: "Termos de Utilização", href: "/content/terms-of-use" },
  { label: "Política de Cookies", href: "/content/cookie-policy" },
]

const headingClass =
  "text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-white"
const linkClass =
  "text-[13px] font-medium leading-snug text-svc-fg-muted transition-colors hover:text-white"

function LinkList({
  links,
  testId,
  itemTestId,
}: {
  links: FooterLink[]
  testId?: string
  itemTestId?: string
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-[11px] p-0" data-testid={testId}>
      {links.map((l) => (
        <li key={l.href}>
          <LocalizedClientLink
            className={linkClass}
            href={l.href}
            data-testid={itemTestId}
          >
            {l.label}
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  )
}

function ServiceColumn() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
        {SERVICE_LINKS.map((item) => (
          <li key={item}>
            <LocalizedClientLink className={linkClass} href={SERVICE_FORM}>
              {item}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
      <LocalizedClientLink
        href={SERVICE_FORM}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-svc-signal px-[18px] py-[11px] text-[12px] font-bold uppercase leading-none tracking-[0.04em] text-white transition-colors hover:bg-svc-signal-ink"
      >
        <Wrench className="h-3.5 w-3.5" aria-hidden />
        Pedir assistência
      </LocalizedClientLink>
    </div>
  )
}

function ContactColumn() {
  const { address, phone, email, hours } = COMPANY
  const icon = "mt-0.5 h-4 w-4 flex-none text-brand-cyan"
  return (
    <address className="flex flex-col gap-[14px] text-[13px] font-medium not-italic leading-[1.5] text-svc-fg">
      <div className="flex items-start gap-3">
        <MapPin className={icon} aria-hidden />
        <span>
          {address.street}
          <br />
          {address.postalCode} {address.city}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <Phone className={icon} aria-hidden />
        <span>
          <a href={phone.href} className="transition-colors hover:text-white">
            {phone.display}
          </a>
          <span className="block text-[12px] text-svc-fg-muted">
            ({phone.costNote.toLowerCase()})
          </span>
        </span>
      </div>
      <div className="flex items-start gap-3">
        <Mail className={icon} aria-hidden />
        <a href={`mailto:${email}`} className="transition-colors hover:text-white">
          {email}
        </a>
      </div>
      <div className="flex items-start gap-3">
        <Clock className={icon} aria-hidden />
        <span className="text-svc-fg-muted">{hours}</span>
      </div>
    </address>
  )
}

/** Mobile accordion section (native <details>, no JS). */
function MobileSection({
  title,
  open,
  children,
}: {
  title: string
  open?: boolean
  children: ReactNode
}) {
  return (
    <details className="group border-b border-svc-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
        <span className={headingClass}>{title}</span>
        <ChevronDown
          className="h-4 w-4 text-svc-fg-muted transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  )
}

export default async function Footer() {
  const { categories, brands } = await getNavGroups().catch(() => ({
    categories: [] as FooterLink[],
    brands: [] as FooterLink[],
  }))
  const catalogMode = isCatalogMode()

  const brandBlock = (
    <div className="flex flex-col items-start">
      <LocalizedClientLink href="/" className="inline-block" aria-label="Higitotal — página inicial">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/higitotal/logo-reversed-trim.png"
          alt="Higitotal"
          width={560}
          height={150}
          className="mb-5 h-[34px] w-auto"
        />
      </LocalizedClientLink>
      <p className="text-[13px] leading-[1.65] text-svc-fg-muted small:max-w-[30ch]">
        Distribuição de produtos de higiene profissional, equipamento hoteleiro
        e máquinas de limpeza, com assistência técnica própria. Em Mirandela,
        desde {COMPANY.since}.
      </p>
      <LocalizedClientLink
        href="/contact"
        className="mt-5 inline-flex items-center justify-center rounded-pill bg-brand-cyan px-[18px] py-[11px] text-[12px] font-bold uppercase leading-none tracking-[0.04em] text-white transition-colors hover:bg-brand-cyan-ink"
      >
        Pedir orçamento
      </LocalizedClientLink>
    </div>
  )

  return (
    <footer className="w-full bg-svc-ground text-svc-fg-muted font-sans">
      <div className="content-container">
        {/* Desktop / tablet: balanced columns */}
        <div className="hidden small:grid small:grid-cols-[1fr_0.7fr_1.15fr_0.85fr_1.1fr] small:gap-x-8 small:gap-y-10 small:py-14 medium:grid-cols-[1.05fr_1fr_0.65fr_1.1fr_0.8fr_1.1fr] medium:gap-x-9">
          <div className="small:col-span-5 medium:col-span-1">{brandBlock}</div>

          {categories.length > 0 && (
            <div>
              <h2 className={`mb-4 ${headingClass}`}>Categorias</h2>
              <ExpandableLinkList
                links={categories}
                linkClass={linkClass}
                noun="categorias"
                testId="footer-categories"
                itemTestId="category-link"
              />
            </div>
          )}

          {brands.length > 0 && (
            <div>
              <h2 className={`mb-4 ${headingClass}`}>
                <LocalizedClientLink
                  href={BRANDS_PATH}
                  className="transition-colors hover:text-brand-cyan-bright"
                  data-testid="footer-brands-index"
                >
                  Marcas
                </LocalizedClientLink>
              </h2>
              <ExpandableLinkList
                links={brands}
                linkClass={linkClass}
                noun="marcas"
                testId="footer-brands"
              />
            </div>
          )}

          <div>
            <h2 className={`mb-4 ${headingClass}`}>Assistência Técnica</h2>
            <ServiceColumn />
          </div>

          <div className="flex flex-col gap-9">
            <div>
              <h2 className={`mb-4 ${headingClass}`}>Setores</h2>
              <LinkList links={SECTOR_LINKS} testId="footer-sectors" />
            </div>
            <div>
              <h2 className={`mb-4 ${headingClass}`}>Empresa</h2>
              <LinkList links={COMPANY_LINKS} testId="footer-company" />
            </div>
          </div>

          <div>
            <h2 className={`mb-4 ${headingClass}`}>Contactos</h2>
            <ContactColumn />
          </div>
        </div>

        {/* Mobile: brand block + collapsible sections */}
        <div className="pt-9 small:hidden">
          {brandBlock}
          <div className="mt-7 border-t border-svc-line">
            {categories.length > 0 && (
              <MobileSection title="Categorias">
                <LinkList links={categories} />
              </MobileSection>
            )}
            {brands.length > 0 && (
              <MobileSection title="Marcas">
                <LinkList
                  links={[...brands, { label: "Ver todas as marcas", href: BRANDS_PATH }]}
                />
              </MobileSection>
            )}
            <MobileSection title="Setores">
              <LinkList links={SECTOR_LINKS} testId="footer-sectors-mobile" />
            </MobileSection>
            <MobileSection title="Assistência Técnica">
              <ServiceColumn />
            </MobileSection>
            <MobileSection title="Empresa">
              <LinkList links={COMPANY_LINKS} testId="footer-company-mobile" />
            </MobileSection>
            <MobileSection title="Contactos" open>
              <ContactColumn />
            </MobileSection>
          </div>
        </div>

        {/* Bottom bar — legal links + company identification */}
        <div className="border-t border-svc-line py-7 small:border-t">
          {/* No prices are shown in catalog mode, so the VAT note is moot. */}
          {!catalogMode && (
            <p className="mb-4 text-[12px] leading-relaxed text-svc-fg-muted">
              Todos os preços apresentados não incluem IVA à taxa legal em vigor.
            </p>
          )}
          <nav aria-label="Informação legal">
            <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2.5 p-0 text-[12px] font-medium">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="text-svc-fg transition-colors hover:text-white"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
              {analyticsEnabled() && (
                <li>
                  <CookiePreferencesButton className="text-svc-fg transition-colors hover:text-white" />
                </li>
              )}
              <li>
                <a
                  href={COMPANY.complaintsBookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-svc-fg transition-colors hover:text-white"
                  data-testid="footer-complaints-book"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  Livro de Reclamações
                  <ExternalLink className="h-3 w-3 text-svc-fg-muted" aria-hidden />
                  <span className="sr-only">(abre numa nova janela)</span>
                </a>
              </li>
              <li>
                <LocalizedClientLink
                  href="/contact"
                  className="text-svc-fg transition-colors hover:text-white"
                >
                  Contactos
                </LocalizedClientLink>
              </li>
            </ul>
          </nav>
          <div className="mt-5 flex flex-col gap-2 text-[12px] text-svc-fg-muted xsmall:flex-row xsmall:items-center xsmall:justify-between">
            <span>
              © {new Date().getFullYear()} {COMPANY.legalName} · NIPC{" "}
              {COMPANY.nipc}
            </span>
            <span className="inline-flex items-center gap-x-1.5">
              {COMPANY.address.city}
              <BlackCat className="h-[18px] w-auto" />· {COMPANY.address.country}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
