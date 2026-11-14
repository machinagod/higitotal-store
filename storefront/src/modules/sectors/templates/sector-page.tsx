import { HttpTypes } from "@medusajs/types"
import { ArrowRight, CircleCheck, ClipboardList, Phone, Wrench } from "lucide-react"
import Image from "next/image"

import { COMPANY } from "@lib/company"
import {
  SECTORS,
  SECTORS_PATH,
  categoryHref,
  liveCategoryLinks,
  type Sector,
  type SectorCategoryLink,
} from "@lib/sectors"
import { isCatalogMode } from "@lib/util/catalog-mode"
import CompanyCta from "@modules/company/components/company-cta"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FeaturedProducts from "@modules/home/components/featured-products"
import SectorCards from "@modules/sectors/components/sector-cards"
import SectorIcon from "@modules/sectors/components/sector-icon"
import { sectorImage } from "@modules/sectors/sector-images"

const eyebrow =
  "inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan-ink"
const h2 =
  "mt-3 text-2xl font-extrabold tracking-[-0.02em] text-brand-ink small:text-[32px] small:leading-[1.15]"

type BrandLink = { name: string; href: string }

/** Sectors whose kitchens / canteens / production run under HACCP. */
const HACCP_SECTORS = new Set([
  "restauracao",
  "industria-alimentar",
  "lares-e-saude",
  "escolas-e-autarquias",
])

const HYGIENE_PLAN_ITEMS = [
  "Zonas, superfícies e equipamentos a limpar e desinfetar",
  "Produto, diluição e método para cada um",
  "Frequência e responsável de cada tarefa",
  "Fichas técnicas e de dados de segurança dos produtos indicados",
]

function resolveBrands(
  names: string[] | undefined,
  brandLinks: Map<string, string>
): BrandLink[] {
  return (names ?? []).flatMap((name) => {
    const href = brandLinks.get(name)
    return href ? [{ name, href }] : []
  })
}

function CategoryChips({ links }: { links: SectorCategoryLink[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((c) => (
        <li key={c.handle}>
          <LocalizedClientLink
            href={categoryHref(c.handle)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border border-hairline bg-white px-3.5 py-1.5 text-[13px] font-semibold text-brand-cyan-ink transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
            data-testid="sector-category-link"
          >
            {c.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  )
}

function BrandLinks({
  brands,
  dark = false,
}: {
  brands: BrandLink[]
  dark?: boolean
}) {
  if (!brands.length) return null
  return (
    <p
      className={`text-[13px] leading-relaxed ${
        dark ? "text-svc-fg-muted" : "text-grey-50"
      }`}
    >
      Marcas:{" "}
      {brands.map((b, i) => (
        <span key={b.name}>
          {i > 0 && ", "}
          <LocalizedClientLink
            href={b.href}
            className={`font-semibold underline underline-offset-2 ${
              dark
                ? "text-svc-fg hover:text-white"
                : "text-grey-70 hover:text-brand-cyan-ink"
            }`}
            data-testid="sector-brand-link"
          >
            {b.name}
          </LocalizedClientLink>
        </span>
      ))}
    </p>
  )
}

export default function SectorTemplate({
  sector,
  region,
  products,
  liveHandles,
  brandLinks,
}: {
  sector: Sector
  region?: HttpTypes.StoreRegion
  products: HttpTypes.StoreProduct[]
  /** Live category handles (undefined = backend unreachable, trust config). */
  liveHandles?: Set<string>
  brandLinks: Map<string, string>
}) {
  const quoteHref = isCatalogMode() ? "/orcamento" : "/contact"
  const { phone } = COMPANY
  const others = SECTORS.filter((s) => s.slug !== sector.slug)
  const image = sectorImage(sector.slug)

  const needs = sector.needs
    .map((n) => ({
      ...n,
      categories: liveCategoryLinks(n.categories, liveHandles),
      brandLinks: resolveBrands(n.brands, brandLinks),
    }))
    .filter((n) => n.categories.length > 0 || n.brandLinks.length > 0)

  const assistance = sector.assistance && {
    ...sector.assistance,
    categories: liveCategoryLinks(sector.assistance.categories, liveHandles),
    brandLinks: resolveBrands(sector.assistance.brands, brandLinks),
  }

  return (
    <div
      className="content-container flex flex-col gap-12 py-8 small:gap-20 small:py-12"
      data-testid="sector-page"
    >
      {/* Intro */}
      <section aria-labelledby="sector-title">
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
              <LocalizedClientLink
                href={SECTORS_PATH}
                className="hover:text-brand-cyan"
              >
                Setores
              </LocalizedClientLink>
            </li>
            <li className="flex items-center gap-x-1.5">
              <span aria-hidden className="text-grey-30">
                /
              </span>
              <span aria-current="page" className="text-grey-60">
                {sector.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Desktop: intro on the left (both rows), photo above the "Nesta
            página" card on the right. Mobile: the photo comes first (a 16:9
            band under the breadcrumb), then the intro and the card. */}
        <div className="grid grid-cols-1 gap-8 small:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] small:grid-rows-[auto_1fr] small:gap-x-14 small:gap-y-6">
          <div className="min-w-0 small:row-span-2">
            <span className={eyebrow}>
              <span className="ind" aria-hidden="true" />
              Soluções por setor
            </span>
            <h1
              id="sector-title"
              className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[44px] small:leading-[1.08]"
              data-testid="sector-title"
            >
              {sector.h1}
            </h1>
            <p className="mt-3 text-sm font-semibold text-grey-60">
              {sector.audience}
            </p>
            {sector.intro.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "mt-5 max-w-[64ch] text-lg leading-relaxed text-grey-70"
                    : "mt-4 max-w-[64ch] leading-relaxed text-grey-60"
                }
              >
                {p}
              </p>
            ))}
            <div className="mt-7 flex flex-col gap-3 xsmall:flex-row xsmall:flex-wrap xsmall:items-center">
              <LocalizedClientLink
                href={quoteHref}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-brand-cyan px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-brand-cyan-ink"
                data-testid="sector-quote"
              >
                Pedir orçamento
                <ArrowRight className="h-4 w-4" aria-hidden />
              </LocalizedClientLink>
              <a
                href={phone.href}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-hairline bg-white px-5 py-3 text-[13px] font-bold text-brand-ink transition-colors hover:border-brand-cyan"
                data-testid="sector-phone"
              >
                <Phone className="h-4 w-4 text-brand-cyan" aria-hidden />
                {phone.display}
              </a>
            </div>
            <p className="mt-2 text-xs text-grey-50">({phone.costNote})</p>
          </div>

          {image && (
            <figure
              className="relative order-first aspect-[16/9] overflow-hidden rounded-card border border-hairline bg-grey-10 small:order-none small:aspect-[4/3]"
              data-testid="sector-hero-image"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                // next/image 15 preloads for `priority` but doesn't set the
                // attribute itself (see the home hero-rotator).
                fetchPriority="high"
                placeholder="blur"
                // content-container: 1440 max, 24px gutters; the right column
                // is 0.75 / 2 of the row minus the 56px gap.
                sizes="(min-width: 1440px) 500px, (min-width: 1024px) 36vw, calc(100vw - 48px)"
                className="object-cover"
                style={{ objectPosition: image.position }}
              />
            </figure>
          )}

          {/* What's on this page */}
          <aside
            aria-labelledby="sector-toc"
            className="h-fit rounded-card border border-hairline bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan">
                <SectorIcon icon={sector.icon} className="h-[22px] w-[22px]" />
              </span>
              <h2 id="sector-toc" className="font-extrabold text-brand-ink">
                Nesta página
              </h2>
            </div>
            <ul className="mt-4 flex flex-col gap-1">
              {needs.map((n, i) => (
                <li key={n.title}>
                  <a
                    href={`#necessidade-${i + 1}`}
                    className="flex min-h-[36px] items-center gap-2.5 rounded-btn text-sm font-semibold text-grey-70 hover:text-brand-cyan-ink"
                  >
                    <SectorIcon
                      icon={n.icon}
                      className="h-4 w-4 flex-none text-brand-cyan"
                    />
                    {n.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Needs → categories and brands */}
      <section aria-labelledby="sector-solutions">
        <span className={eyebrow}>
          <span className="ind" aria-hidden="true" />
          Soluções
        </span>
        <h2 id="sector-solutions" className={h2}>
          O que precisa, no nosso catálogo
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:grid-cols-3 small:gap-5">
          {needs.map((n, i) => (
            <li
              key={n.title}
              id={`necessidade-${i + 1}`}
              className="flex scroll-mt-32 flex-col gap-4 rounded-card border border-hairline bg-white p-6"
              data-testid="sector-need"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan">
                <SectorIcon icon={n.icon} className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold leading-snug text-brand-ink">
                  {n.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-grey-60">
                  {n.text}
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-3">
                <CategoryChips links={n.categories} />
                <BrandLinks brands={n.brandLinks} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured products */}
      {region && products.length > 0 && (
        <section aria-labelledby="sector-products">
          <div className="mb-[18px] flex flex-col items-start gap-1 small:mb-7 small:flex-row small:items-end small:justify-between small:gap-5">
            <div className="flex flex-col gap-1">
              <span className={eyebrow}>
                <span className="ind" aria-hidden="true" />
                Produtos
              </span>
              <h2
                id="sector-products"
                className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[32px]"
              >
                Alguns produtos para {sector.name.toLowerCase()}
              </h2>
            </div>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-cyan-ink hover:text-brand-ink small:text-xs"
            >
              Ver catálogo
              <span aria-hidden>→</span>
            </LocalizedClientLink>
          </div>
          <FeaturedProducts products={products} region={region} />
        </section>
      )}

      {/* Equipment + technical assistance */}
      {assistance && (
        <section
          aria-labelledby="sector-assistance"
          className="rounded-hero bg-svc-ground px-6 py-9 text-svc-fg small:px-14 small:py-12"
          data-testid="sector-assistance"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-svc-signal-bright">
            <span className="ind amber" aria-hidden="true" />
            Assistência Técnica
          </span>
          <h2
            id="sector-assistance"
            className="mt-3 max-w-[30ch] text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-white small:text-[32px]"
          >
            {assistance.title}
          </h2>
          <p className="mt-3 max-w-[64ch] leading-relaxed text-svc-fg-muted">
            {assistance.text}
          </p>
          <div className="mt-6 flex flex-col gap-2.5 xsmall:flex-row xsmall:flex-wrap">
            <LocalizedClientLink
              href="/assistencia-tecnica"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-svc-signal px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-svc-signal-ink"
              data-testid="sector-assistance-link"
            >
              <Wrench className="h-4 w-4" aria-hidden />
              Assistência técnica
            </LocalizedClientLink>
            {assistance.categories.map((c) => (
              <LocalizedClientLink
                key={c.handle}
                href={categoryHref(c.handle)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-svc-line px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-svc-ground-2"
                data-testid="sector-category-link"
              >
                {c.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </LocalizedClientLink>
            ))}
          </div>
          <div className="mt-5">
            <BrandLinks brands={assistance.brandLinks} dark />
          </div>
        </section>
      )}

      {/* Good practice */}
      <section
        aria-labelledby="sector-practices"
        className="grid grid-cols-1 gap-6 small:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] small:gap-14"
      >
        <div>
          <span className={eyebrow}>
            <span className="ind" aria-hidden="true" />
            Boas práticas
          </span>
          <h2 id="sector-practices" className={h2}>
            Algumas regras simples
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-grey-60">
            Recomendações gerais. Siga sempre o rótulo, a ficha técnica e a
            ficha de dados de segurança de cada produto.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {sector.practices.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 rounded-large border border-hairline bg-white p-4"
            >
              <CircleCheck
                className="mt-0.5 h-5 w-5 flex-none text-brand-cyan"
                aria-hidden
              />
              <span className="leading-relaxed text-grey-70">{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Hygiene plan service */}
      <section
        aria-labelledby="sector-hygiene-plan"
        className="rounded-card border border-brand-cyan-100 bg-brand-cyan-50 p-6 small:p-10"
        data-testid="sector-hygiene-plan"
      >
        <div className="grid grid-cols-1 gap-6 small:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] small:gap-12">
          <div>
            <span className={eyebrow}>
              <ClipboardList className="h-4 w-4" aria-hidden />
              Plano de higienização
            </span>
            <h2 id="sector-hygiene-plan" className={h2}>
              Um plano de higiene feito para a sua instalação
            </h2>
            <p className="mt-3 leading-relaxed text-grey-70">
              A nossa equipa elabora planos de higiene e limpeza adaptados ao
              seu espaço e à sua operação, com os produtos certos para cada
              tarefa
              {HACCP_SECTORS.has(sector.slug)
                ? " e enquadrados nos pré-requisitos do seu sistema HACCP."
                : "."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LocalizedClientLink
                href="/contact"
                className="inline-flex items-center gap-2 rounded-pill bg-brand-cyan-ink px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-brand-ink"
                data-testid="sector-hygiene-plan-cta"
              >
                Pedir um plano de higiene
                <ArrowRight className="h-4 w-4" aria-hidden />
              </LocalizedClientLink>
              <a
                href={phone.href}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink hover:text-brand-cyan-ink"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {phone.display}
              </a>
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            {HYGIENE_PLAN_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-large bg-white p-4"
              >
                <CircleCheck
                  className="mt-0.5 h-5 w-5 flex-none text-brand-cyan"
                  aria-hidden
                />
                <span className="leading-relaxed text-grey-70">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Other sectors */}
      <section aria-labelledby="sector-others">
        <h2
          id="sector-others"
          className="mb-5 text-xl font-extrabold tracking-tight text-brand-ink"
        >
          Outros setores
        </h2>
        <SectorCards sectors={others} variant="list" testId="sector-others" />
      </section>

      <CompanyCta
        id="sector-cta"
        title="Peça uma proposta para o seu negócio"
        text="Diga-nos que produtos e quantidades usa: preparamos um orçamento e, se quiser, ajudamos a escolher alternativas."
      />
    </div>
  )
}
