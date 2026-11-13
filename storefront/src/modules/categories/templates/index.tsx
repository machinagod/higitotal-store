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
import { brandForCategory } from "@lib/brands"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SubcategoryChips from "@modules/categories/components/subcategory-chips"
import { HttpTypes } from "@medusajs/types"
import { collectCategoryIds } from "@lib/data/categories"

type Crumb = { name: string; handle?: string | null }

/**
 * The page title for a category: a brand category ("SCJohnson (DEB)",
 * "Diversey") reads as the brand, with the brand's own casing; anything else
 * gets its customer-facing display name.
 */
export function categoryPageTitle(category: {
  name?: string | null
  handle?: string | null
}): string {
  return brandForCategory(category)?.name ?? displayCategoryName(category.name)
}

export default function CategoryTemplate({
  categories,
  ancestors = [],
  siblings = [],
  sortBy,
  page,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  /** Parent chain (root first) when the URL names only the leaf. */
  ancestors?: Crumb[]
  /** The parent's children (this category included) — chips for a leaf. */
  siblings?: HttpTypes.StoreProductCategory[]
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
  // Brand landing pages (/categories/diversey, /categories/vileda…): the
  // supplier groups the Moloni sync files products under.
  const brand = brandForCategory(category)
  const title = categoryPageTitle(category)

  // Card eyebrows that would only repeat this page — its own name, or the
  // brand it sits under ("DIVERSEY" on every card of Diversey › Cozinha) —
  // are left blank.
  const eyebrowContext = [
    title,
    category.name,
    ...parents.map((p) => brandForCategory(p)?.name),
  ]

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
                  {categoryPageTitle(parent)}
                </LocalizedClientLink>
              ) : (
                <span>{categoryPageTitle(parent)}</span>
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
        <div className="flex min-w-0 flex-col gap-1">
          {brand && (
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
              <span className="ind" />
              Marca
            </span>
          )}
          <h1
            className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[28px]"
            data-testid="category-page-title"
          >
            {title}
          </h1>
        </div>
        <RefinementList
          sortBy={sort}
          catalogMode={catalogMode}
          data-testid="sort-by-container"
        />
      </div>

      {category.description ? (
        <p className="mb-5 max-w-[800px] text-base-regular text-grey-60">
          {category.description}
        </p>
      ) : (
        brand && (
          <p className="mb-5 max-w-[800px] text-base-regular text-grey-60">
            Gama {title} para uso profissional. Peça orçamento para preço e
            disponibilidade.
          </p>
        )
      )}

      <SubcategoryChips
        categories={category.category_children}
        siblings={siblings}
        activeId={category.id}
        label={brand ? `Gamas ${title}` : "Subcategorias"}
      />

      <Suspense key={`${sort}-${pageNumber}`} fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={categoryIds}
          countryCode={countryCode}
          eyebrowContext={eyebrowContext}
        />
      </Suspense>
    </div>
  )
}
