import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Cog,
  MapPin,
  Phone,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { BRANDS } from "@lib/brands"
import {
  BRAND_SERVICE_PAGES,
  brandProductsPath,
  brandServiceFaqs,
  brandServiceOffers,
  brandServicePath,
  HOW_IT_WORKS,
  SERVICE_AREA,
  type BrandServicePage,
} from "@lib/brand-service-pages"
import { COMPANY } from "@lib/company"
import RequestForm from "@modules/assistencia/components/request-form"
import BrandLogoImg from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/** Form anchor — the same "#pedir" as the main page (the form focuses its
 * first field on it). Not imported from the "use client" form module: in a
 * server component that import is a client reference, not the string. */
const REQUEST_ANCHOR = "pedir"

const OFFER_ICONS: Record<string, LucideIcon> = {
  instalacao: Wrench,
  reparacao: Cog,
  manutencao: Calendar,
}

const eyebrow =
  "inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-svc-signal-bright"
const h2 =
  "mt-4 text-3xl font-extrabold leading-[1.08] tracking-[-0.025em] text-white sm:text-[38px]"
const textLink =
  "inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-white underline-offset-4 transition hover:text-svc-signal-bright hover:underline"

/**
 * Per-brand technical-assistance landing page (Fagor, Sammic, Nilfisk,
 * Viper) — same dark "pro" register as the main Assistência Técnica page,
 * whose facts and request form it reuses. Copy lives in
 * `@lib/brand-service-pages`.
 */
export default function BrandServicePageTemplate({
  page,
}: {
  page: BrandServicePage
}) {
  const logo = BRANDS.find((b) => b.name === page.brand)?.logo
  const faqs = brandServiceFaqs(page)
  const others = BRAND_SERVICE_PAGES.filter((p) => p.slug !== page.slug)

  return (
    <div className="bg-svc-ground text-svc-fg" data-testid="brand-service-page">
      {/* Hero */}
      <div className="relative overflow-hidden pb-14 pt-8 sm:pb-[74px] sm:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-200px] top-[-240px] h-[720px] w-[720px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,122,26,.10), transparent 62%)",
          }}
        />
        <div className="content-container relative z-[2]">
          <nav aria-label="Navegação estrutural" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-svc-fg-muted">
              <li>
                <LocalizedClientLink href="/" className="transition hover:text-white">
                  Início
                </LocalizedClientLink>
              </li>
              <li aria-hidden>/</li>
              <li>
                <LocalizedClientLink
                  href="/assistencia-tecnica"
                  className="transition hover:text-white"
                >
                  Assistência técnica
                </LocalizedClientLink>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-white">
                {page.brand}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div>
              <span className={eyebrow}>
                <span className="ind amber" />
                {page.segment}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-5xl lg:text-[56px]">
                Assistência técnica{" "}
                <span className="text-svc-signal-bright">{page.brand}</span>
              </h1>
              <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-svc-fg-muted sm:text-lg">
                {page.intro}
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-svc-fg">
                <MapPin
                  className="h-4 w-4 flex-none text-svc-signal-bright"
                  aria-hidden
                />
                {SERVICE_AREA}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`#${REQUEST_ANCHOR}`}
                  data-testid="brand-service-cta"
                  className="inline-flex items-center gap-[10px] rounded-pill bg-svc-signal px-7 py-[15px] text-[13px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_30px_rgba(255,122,26,0.32)] transition hover:-translate-y-0.5 hover:bg-svc-signal-ink"
                >
                  Pedir assistência
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <a
                  href={COMPANY.phone.href}
                  data-testid="brand-service-phone"
                  aria-label={`Ligar para ${COMPANY.phone.display} (${COMPANY.phone.costNote.toLowerCase()})`}
                  className="inline-flex items-center gap-[10px] rounded-pill border-[1.5px] border-svc-line px-7 py-[15px] text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-svc-ground-2"
                >
                  <Phone className="h-4 w-4" aria-hidden /> {COMPANY.phone.display}
                </a>
              </div>
              <p className="mt-2 text-[11px] text-svc-fg-muted">
                {COMPANY.phone.costNote}
              </p>
            </div>

            {/* Brand panel */}
            <aside className="rounded-card border border-svc-line bg-svc-ground-2 p-7 sm:p-8">
              <div className="flex h-[72px] items-center justify-center rounded-[18px] bg-white px-6">
                {logo ? (
                  <BrandLogoImg
                    logo={logo}
                    boxW={150}
                    boxH={36}
                    variant="color"
                    alt={page.brand}
                  />
                ) : (
                  <span className="text-xl font-extrabold text-brand-ink">
                    {page.brand}
                  </span>
                )}
              </div>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.12em] text-svc-fg-muted">
                Serviços {page.brand}
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {brandServiceOffers(page).map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center gap-3 text-[15px] font-semibold text-white"
                  >
                    <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[8px] bg-svc-ok/[0.14] text-svc-ok">
                      <Check className="h-[14px] w-[14px]" aria-hidden />
                    </span>
                    {o.title}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-svc-line pt-4">
                <LocalizedClientLink
                  href={brandProductsPath(page.slug)}
                  className={textLink}
                  data-testid="brand-service-products-link"
                >
                  Ver produtos {page.brand}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </LocalizedClientLink>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Equipment types */}
      <section
        aria-labelledby="bs-equipment"
        className="content-container pb-16 sm:pb-[74px]"
      >
        <div className="mb-10 max-w-[640px]">
          <span className={eyebrow}>
            <span className="ind amber" />
            Equipamento {page.brand}
          </span>
          <h2 id="bs-equipment" className={h2}>
            Que equipamento {page.brand} assistimos
          </h2>
        </div>
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="brand-service-equipment"
        >
          {page.equipment.map((e) => (
            <li
              key={e.title}
              className="rounded-card border border-svc-line bg-svc-ground-2 p-6 sm:p-7"
            >
              <span
                aria-hidden
                className="block h-[3px] w-8 rounded-full bg-svc-signal-bright"
              />
              <h3 className="mt-4 text-lg font-bold leading-tight tracking-[-0.01em] text-white">
                {e.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-svc-fg-muted">
                {e.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Services */}
      <section
        aria-labelledby="bs-services"
        className="content-container pb-16 sm:pb-[74px]"
      >
        <div className="mb-10 max-w-[640px]">
          <span className={eyebrow}>
            <span className="ind amber" />O que fazemos
          </span>
          <h2 id="bs-services" className={h2}>
            Instalação, reparação e manutenção {page.brand}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {brandServiceOffers(page).map((o) => {
            const Icon = OFFER_ICONS[o.id]
            return (
              <div
                key={o.id}
                className="rounded-card border border-svc-line bg-svc-ground-2 p-7"
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-svc-signal-bright/[0.12] text-svc-signal-bright">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-5 text-xl font-bold leading-tight text-white">
                  {o.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-svc-fg-muted">
                  {o.body}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="bs-how"
        className="content-container pb-16 sm:pb-[74px]"
      >
        <div className="rounded-hero border border-svc-line bg-svc-ground-2 p-7 sm:p-[50px]">
          <span className={eyebrow}>
            <span className="ind amber" />
            Como funciona
          </span>
          <h2 id="bs-how" className={h2}>
            Do pedido à máquina a trabalhar
          </h2>
          <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title}>
                <span className="text-[13px] font-extrabold tracking-[0.1em] text-svc-signal-bright">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-svc-fg-muted">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section
        aria-labelledby="bs-faq"
        className="content-container pb-16 sm:pb-[74px]"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <span className={eyebrow}>
              <span className="ind amber" />
              Perguntas frequentes
            </span>
            <h2 id="bs-faq" className={h2}>
              Assistência {page.brand}: o que precisa de saber
            </h2>
          </div>
          <div
            className="divide-y divide-svc-line border-y border-svc-line"
            data-testid="brand-service-faq"
          >
            {faqs.map((f) => (
              <details key={f.question} className="group py-1">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-bold text-white outline-none focus-visible:text-svc-signal-bright [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <ChevronDown
                    className="h-5 w-5 flex-none text-svc-fg-muted transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-5 pr-8 text-[15px] leading-relaxed text-svc-fg-muted">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Request form, prefilled with the brand */}
      <section
        id={REQUEST_ANCHOR}
        className="content-container scroll-mt-32 pb-16 sm:scroll-mt-40 sm:pb-[74px]"
      >
        <RequestForm
          equipamento={page.brand}
          messagePlaceholder={page.messagePlaceholder}
        />
      </section>

      {/* Related links */}
      <nav
        aria-label="Mais assistência técnica"
        className="content-container flex flex-col gap-4 pb-16 sm:flex-row sm:items-center sm:justify-between sm:pb-[74px]"
      >
        <LocalizedClientLink
          href="/assistencia-tecnica"
          className={textLink}
          data-testid="brand-service-back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Assistência técnica Higitotal
        </LocalizedClientLink>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <li className="text-xs font-semibold uppercase tracking-[0.08em] text-svc-fg-muted">
            Outras marcas
          </li>
          {others.map((o) => (
            <li key={o.slug}>
              <LocalizedClientLink
                href={brandServicePath(o.slug)}
                className={textLink}
              >
                {o.brand}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </nav>

      <div aria-hidden className="relative border-t border-svc-line">
        <span className="absolute left-1/2 top-[-2px] h-[3px] w-16 -translate-x-1/2 rounded-full bg-svc-signal" />
      </div>
    </div>
  )
}
