import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { resolveSort } from "@lib/util/sort-products"
import { parsePage } from "@lib/util/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { brandForCategory } from "@lib/brands"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
}) {
  const catalogMode = isCatalogMode()
  const pageNumber = parsePage(page)
  const sort = resolveSort(sortBy, { catalogMode, hasIds: false })

  return (
    <div className="content-container py-6 small:py-8" data-testid="collection-container">
      <nav aria-label="Navegação estrutural" className="mb-2">
        <ol className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-grey-50">
          <li>
            <LocalizedClientLink href="/store" className="hover:text-brand-cyan">
              Catálogo
            </LocalizedClientLink>
          </li>
          <li className="flex items-center gap-x-1.5">
            <span aria-hidden className="text-grey-30">/</span>
            <span aria-current="page" className="text-grey-60">
              {collection.title}
            </span>
          </li>
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 small:mb-5">
        <div className="flex min-w-0 flex-col gap-1">
          {/* Most collections are brand ranges ("Vileda"); some are product lines. */}
          {brandForCategory({ name: collection.title, handle: collection.handle }) && (
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
              <span className="ind" />
              Marca
            </span>
          )}
          <h1
            className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[28px]"
            data-testid="collection-page-title"
          >
            {collection.title}
          </h1>
        </div>
        <RefinementList sortBy={sort} catalogMode={catalogMode} />
      </div>

      <Suspense key={`${sort}-${pageNumber}`} fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          collectionId={collection.id}
          countryCode={countryCode}
          eyebrowContext={[collection.title]}
        />
      </Suspense>
    </div>
  )
}
