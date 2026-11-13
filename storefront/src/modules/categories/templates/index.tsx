import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { resolveSort } from "@lib/util/sort-products"
import { parsePage } from "@lib/util/pagination"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SubcategoryChips from "@modules/categories/components/subcategory-chips"
import { HttpTypes } from "@medusajs/types"
import { collectCategoryIds } from "@lib/data/categories"

type Crumb = { name: string; handle?: string | null }

export default function CategoryTemplate({
  categories,
  ancestors = [],
  sortBy,
  page,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  /** Parent chain (root first) when the URL names only the leaf. */
  ancestors?: Crumb[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const catalogMode = isCatalogMode()
  const pageNumber = parsePage(page)
  const sort = resolveSort(sortBy, { catalogMode, hasIds: false })

  const category = categories[categories.length - 1]
  if (!category || !countryCode) notFound()

  const parents: Crumb[] = [
    ...ancestors,
    ...categories.slice(0, categories.length - 1),
  ]
  const title = displayCategoryName(category.name)

  // Include the category itself AND every sub-category, so selecting a top-level
  // category shows the products that live on its leaves (not an empty page).
  const categoryIds = collectCategoryIds(category)

  return (
    <div className="content-container py-6 small:py-8" data-testid="category-container">
      <nav aria-label="Navegação estrutural" className="mb-2">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-grey-50">
          <li>
            <LocalizedClientLink href="/store" className="hover:text-brand-cyan">
              Catálogo
            </LocalizedClientLink>
          </li>
          {parents.map((parent, i) => (
            <li key={`${parent.handle ?? parent.name}-${i}`} className="flex items-center gap-x-1.5">
              <span aria-hidden className="text-grey-30">/</span>
              {/* Internal bookkeeping groups are never linked. */}
              {parent.handle && !isInternalCategory(parent.name) ? (
                <LocalizedClientLink
                  className="hover:text-brand-cyan"
                  href={`/categories/${parent.handle}`}
                >
                  {displayCategoryName(parent.name)}
                </LocalizedClientLink>
              ) : (
                <span>{displayCategoryName(parent.name)}</span>
              )}
            </li>
          ))}
          <li className="flex items-center gap-x-1.5">
            <span aria-hidden className="text-grey-30">/</span>
            <span aria-current="page" className="text-grey-60">
              {title}
            </span>
          </li>
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 small:mb-5">
        <h1
          className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[28px]"
          data-testid="category-page-title"
        >
          {title}
        </h1>
        <RefinementList
          sortBy={sort}
          catalogMode={catalogMode}
          data-testid="sort-by-container"
        />
      </div>

      {category.description && (
        <p className="mb-5 max-w-[800px] text-base-regular text-grey-60">
          {category.description}
        </p>
      )}

      <SubcategoryChips categories={category.category_children} />

      <Suspense key={`${sort}-${pageNumber}`} fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={categoryIds}
          countryCode={countryCode}
        />
      </Suspense>
    </div>
  )
}
