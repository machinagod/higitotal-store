import { Suspense } from "react"

import RefinementList from "@modules/store/components/refinement-list"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { resolveSort } from "@lib/util/sort-products"
import { parsePage } from "@lib/util/pagination"
import { displayCategoryName } from "@lib/util/category-display"
import { getNavCategories } from "@lib/data/categories"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SearchResultsTemplateProps = {
  /** The decoded search term. */
  query: string
  ids: string[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}

const chipCls =
  "inline-flex min-h-[44px] items-center rounded-pill border border-hairline bg-white px-4 text-sm font-medium text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"

/** Designed "no results" state: what happened, what to try, where to go. */
async function NoResults({ query }: { query: string }) {
  const categories = await getNavCategories().catch(() => [])

  return (
    <div
      className="rounded-card border border-hairline bg-white px-5 py-10 text-center small:px-10 small:py-14"
      data-testid="no-search-results"
    >
      <p className="mx-auto max-w-[560px] text-lg font-extrabold tracking-tight text-brand-ink small:text-xl">
        Não encontrámos resultados para “{query}”.
      </p>
      <p className="mx-auto mt-3 max-w-[560px] text-sm text-grey-60 small:text-base">
        Verifique a ortografia ou experimente um termo mais geral, como o tipo de
        produto em vez da referência. Pode também explorar as categorias abaixo ou
        falar com a nossa equipa.
      </p>

      {categories.length > 0 && (
        <ul className="mx-auto mt-6 flex max-w-[720px] flex-wrap justify-center gap-2">
          {categories.slice(0, 6).map((c) => (
            <li key={c.href}>
              <LocalizedClientLink href={c.href} className={chipCls}>
                {displayCategoryName(c.label)}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <LocalizedClientLink
          href="/store"
          className="flex h-11 items-center rounded-pill bg-brand-cyan px-5 text-sm font-bold text-white transition-colors hover:bg-brand-cyan-ink"
        >
          Ver catálogo
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/contact"
          className="flex h-11 items-center rounded-pill border border-hairline px-5 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
        >
          Fale connosco
        </LocalizedClientLink>
      </div>
    </div>
  )
}

const SearchResultsTemplate = ({
  query,
  ids,
  sortBy,
  page,
  countryCode,
}: SearchResultsTemplateProps) => {
  const catalogMode = isCatalogMode()
  const pageNumber = parsePage(page)
  const hasResults = ids.length > 0
  const sort = resolveSort(sortBy, { catalogMode, hasIds: hasResults })

  return (
    <div className="content-container py-6 small:py-8" data-testid="search-results-container">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 small:mb-5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
            <span className="ind" />
            Pesquisa
          </span>
          <h1 className="break-words text-2xl font-extrabold tracking-tight text-brand-ink small:text-[28px]">
            Resultados da pesquisa para “{query}”
          </h1>
          <LocalizedClientLink
            href="/store"
            className="mt-1 inline-flex min-h-[32px] w-fit items-center text-sm font-semibold text-brand-cyan-ink underline-offset-4 hover:underline"
            data-testid="clear-search"
          >
            Limpar pesquisa
          </LocalizedClientLink>
        </div>
        {hasResults && (
          <RefinementList sortBy={sort} catalogMode={catalogMode} search />
        )}
      </div>

      {hasResults ? (
        <Suspense key={`${sort}-${pageNumber}`} fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            productsIds={ids}
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
          />
        </Suspense>
      ) : (
        <NoResults query={query} />
      )}
    </div>
  )
}

export default SearchResultsTemplate
