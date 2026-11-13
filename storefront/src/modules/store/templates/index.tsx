import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { resolveSort } from "@lib/util/sort-products"
import { parsePage } from "@lib/util/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const catalogMode = isCatalogMode()
  const pageNumber = parsePage(page)
  const sort = resolveSort(sortBy, { catalogMode, hasIds: false })

  return (
    <div className="content-container py-6 small:py-8" data-testid="category-container">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 small:mb-5">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
            <span className="ind" />
            Todos os produtos
          </span>
          <h1
            className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[28px]"
            data-testid="store-page-title"
          >
            Catálogo
          </h1>
        </div>
        <RefinementList sortBy={sort} catalogMode={catalogMode} />
      </div>
      <Suspense key={`${sort}-${pageNumber}`} fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          countryCode={countryCode}
        />
      </Suspense>
    </div>
  )
}

export default StoreTemplate
