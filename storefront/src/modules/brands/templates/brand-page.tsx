import { ArrowRight, ClipboardList, Wrench } from "lucide-react"
import { Suspense } from "react"

import { brandPageCopy, brandServicePath } from "@lib/brand-pages"
import { BRANDS, BRANDS_PATH, brandHref, type Brand } from "@lib/brands"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { parsePage } from "@lib/util/pagination"
import { resolveSort } from "@lib/util/sort-products"
import SubcategoryChips from "@modules/categories/components/subcategory-chips"
import BrandLogoImg from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

import type { BrandProducts } from "../lib/brand-products"

const primaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-brand-cyan px-5 text-sm font-bold text-white transition-colors hover:bg-brand-cyan-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/25"
const secondaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-hairline bg-white px-5 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/25"
const eyebrow =
  "inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan"

/** "Ver a categoria completa" / "… coleção …" — the brand's own listing. */
function listingLinkLabel(products: BrandProducts): string | null {
  if (products.kind === "category") return "Ver a categoria completa"
  if (products.kind === "collection") return "Ver a coleção completa"
  return null
}

/** A brand page: intro, the brand's products, assistance (if any), quote CTA. */
export default function BrandPageTemplate({
  brand,
  products,
  sortBy,
  page,
  countryCode,
}: {
  brand: Brand
  products: BrandProducts
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const copy = brandPageCopy(brand)
  const servicePath = brandServicePath(brand)
  const catalogMode = isCatalogMode()
  const pageNumber = parsePage(page)
  const isSearch = products.kind === "search"
  const sort = resolveSort(sortBy, { catalogMode, hasIds: isSearch })
  const listingLabel = listingLinkLabel(products)
  // Other brands with a logo, one tile per mark (Vileda Swep reuses Vileda's).
  const others = BRANDS.filter(
    (b, i) =>
      b !== brand &&
      b.logo &&
      b.logo.src !== brand.logo?.src &&
      BRANDS.findIndex((x) => x.logo?.src === b.logo?.src) === i
  )

  // Card eyebrows that would only repeat this page's brand stay blank.
  const eyebrowContext = [
    brand.name,
    products.kind === "category" ? products.category.name : undefined,
    products.kind === "collection" ? products.collection.title : undefined,
  ]

  return (
    <div className="content-container py-6 small:py-8" data-testid="brand-page">
      <nav aria-label="Navegação estrutural" className="mb-3">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-grey-50">
          <li>
            <LocalizedClientLink href="/" className="hover:text-brand-cyan">
              Início
            </LocalizedClientLink>
          </li>
          <li className="flex items-center gap-x-1.5">
            <span aria-hidden className="text-grey-30">/</span>
            <LocalizedClientLink href={BRANDS_PATH} className="hover:text-brand-cyan">
              Marcas
            </LocalizedClientLink>
          </li>
          <li className="flex items-center gap-x-1.5">
            <span aria-hidden className="text-grey-30">/</span>
            <span aria-current="page" className="text-grey-60">
              {brand.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* Intro */}
      <header className="grid grid-cols-1 gap-6 rounded-card border border-hairline bg-white p-5 xsmall:p-8 small:grid-cols-[minmax(0,1fr)_260px] small:items-center small:gap-10 small:p-10">
        <div className="min-w-0">
          <span className={eyebrow}>
            <span className="ind" aria-hidden="true" />
            Marca
          </span>
          <h1
            className="mt-2 break-words text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[40px] small:leading-[1.1]"
            data-testid="brand-page-title"
          >
            {brand.name}
          </h1>
          <div className="mt-4 flex max-w-[68ch] flex-col gap-3 leading-relaxed text-grey-60">
            {copy.intro.map((p, i) => (
              <p key={i} className={i === 0 ? "text-base text-grey-70 small:text-lg" : ""}>
                {p}
              </p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <LocalizedClientLink href="/contact" className={primaryBtn}>
              Pedir orçamento
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
            {listingLabel && (
              <LocalizedClientLink href={products.listing.href} className={secondaryBtn}>
                {listingLabel}
              </LocalizedClientLink>
            )}
          </div>
        </div>
        {brand.logo && (
          <div className="order-first flex h-24 items-center justify-center rounded-large bg-[#f7f9fa] px-6 small:order-none small:h-40">
            <BrandLogoImg
              logo={brand.logo}
              boxW={200}
              boxH={56}
              variant="color"
              alt={`Logótipo ${brand.name}`}
              className="max-w-full"
            />
          </div>
        )}
      </header>

      {/* Products */}
      <section aria-labelledby="brand-products-title" className="mt-10 small:mt-14">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 small:mb-5">
          <h2
            id="brand-products-title"
            className="text-2xl font-extrabold tracking-[-0.02em] text-brand-ink small:text-[28px]"
          >
            Produtos {brand.name}
          </h2>
          {(!isSearch || products.productIds.length > 0) && (
            <RefinementList sortBy={sort} catalogMode={catalogMode} search={isSearch} />
          )}
        </div>

        {products.kind === "category" && (
          <SubcategoryChips
            categories={products.category.category_children}
            parentName={products.category.name}
            label={`Gamas ${brand.name}`}
          />
        )}

        {isSearch && products.productIds.length === 0 ? (
          <NoProducts name={brand.name} />
        ) : (
          <Suspense key={`${sort}-${pageNumber}`} fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              eyebrowContext={eyebrowContext}
              {...(products.kind === "category"
                ? { categoryId: products.categoryIds }
                : products.kind === "collection"
                ? { collectionId: products.collection.id }
                : { productsIds: products.productIds })}
            />
          </Suspense>
        )}
      </section>

      {/* Technical assistance (brands we also service) */}
      {servicePath && (
        <section
          aria-labelledby="brand-service-title"
          className="mt-12 rounded-card bg-svc-ground p-6 text-svc-fg xsmall:p-8 small:mt-16 small:p-10"
        >
          <div className="flex flex-col gap-6 small:flex-row small:items-center small:justify-between small:gap-10">
            <div className="max-w-[62ch]">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-svc-signal-bright">
                <span className="ind amber" aria-hidden="true" />
                Assistência técnica
              </span>
              <h2
                id="brand-service-title"
                className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-white small:text-[28px]"
              >
                Assistência técnica {brand.name}
              </h2>
              <p className="mt-3 leading-relaxed text-svc-fg-muted">
                Fazemos a instalação, a reparação e a manutenção de equipamento{" "}
                {brand.name}, com técnicos próprios sediados em Mirandela.
              </p>
            </div>
            <div className="flex flex-none flex-wrap gap-3">
              <LocalizedClientLink
                href={servicePath}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-svc-signal px-5 text-sm font-bold text-white transition-colors hover:bg-svc-signal-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-svc-signal-bright/40"
                data-testid="brand-service-link"
              >
                <Wrench className="h-4 w-4" aria-hidden />
                Assistência {brand.name}
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/assistencia-tecnica#pedir"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-svc-line px-5 text-sm font-semibold text-svc-fg transition-colors hover:border-svc-signal-bright hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-svc-signal-bright/40"
              >
                Pedir assistência
              </LocalizedClientLink>
            </div>
          </div>
        </section>
      )}

      {/* Quote CTA */}
      <section
        aria-labelledby="brand-quote-title"
        className="mt-12 flex flex-col gap-5 rounded-card border border-hairline bg-brand-cyan-50 p-6 xsmall:p-8 small:mt-16 small:flex-row small:items-center small:justify-between small:p-10"
      >
        <div className="max-w-[60ch]">
          <h2
            id="brand-quote-title"
            className="text-xl font-extrabold tracking-[-0.02em] text-brand-ink small:text-2xl"
          >
            Precisa de produtos {brand.name}?
          </h2>
          <p className="mt-2 leading-relaxed text-grey-60">
            {catalogMode
              ? "Junte os produtos ao seu orçamento ou envie-nos um pedido com as referências e quantidades — respondemos com preço e disponibilidade."
              : "Envie-nos um pedido com as referências e quantidades — respondemos com preço e disponibilidade."}
          </p>
        </div>
        <div className="flex flex-none flex-wrap gap-3">
          <LocalizedClientLink href="/contact" className={primaryBtn}>
            Pedir orçamento
            <ArrowRight className="h-4 w-4" aria-hidden />
          </LocalizedClientLink>
          {catalogMode && (
            <LocalizedClientLink href="/orcamento" className={secondaryBtn}>
              <ClipboardList className="h-4 w-4" aria-hidden />
              O meu orçamento
            </LocalizedClientLink>
          )}
        </div>
      </section>

      {/* Other brands */}
      {others.length > 0 && (
        <section aria-labelledby="brand-others-title" className="mt-12 small:mt-16">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="brand-others-title"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7580]"
            >
              Outras marcas
            </h2>
            <LocalizedClientLink
              href={BRANDS_PATH}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-brand-cyan-ink hover:underline"
            >
              Ver todas as marcas
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
          </div>
          <ul className="grid grid-cols-2 gap-2 xsmall:grid-cols-3 small:grid-cols-5">
            {others.map((b) => (
              <li key={b.name}>
                <LocalizedClientLink
                  href={brandHref(b)}
                  className="group flex h-[64px] items-center justify-center rounded-[14px] border border-hairline bg-white px-3 transition-colors hover:border-brand-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                >
                  <BrandLogoImg logo={b.logo!} boxW={104} boxH={26} alt={b.name} />
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** Empty state: the brand has no published products right now. */
function NoProducts({ name }: { name: string }) {
  return (
    <div className="rounded-card border border-hairline bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-brand-ink">
        De momento não temos produtos {name} publicados no catálogo.
      </p>
      <p className="mt-2 text-sm text-grey-60">
        Contacte-nos com o que procura — indicamos-lhe as referências
        disponíveis.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <LocalizedClientLink href="/contact" className={primaryBtn}>
          Fale connosco
        </LocalizedClientLink>
        <LocalizedClientLink href="/store" className={secondaryBtn}>
          Ver catálogo
        </LocalizedClientLink>
      </div>
    </div>
  )
}
