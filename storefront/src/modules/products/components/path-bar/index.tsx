import { HttpTypes } from "@medusajs/types"
import { getCategoryById } from "@lib/data/categories"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PathBarWrapperProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

type Crumb = { label: string; href?: string }

/**
 * Pick the "deepest" category for a product: the one that is itself a child
 * (has a parent), falling back to the first. Products can belong to several
 * categories; we follow the most specific for the breadcrumb.
 */
function pickDeepestCategory(
  categories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory | undefined {
  if (!categories.length) return undefined
  const withParent = categories.filter((c) => c.parent_category)
  return (withParent[0] ?? categories[0]) as HttpTypes.StoreProductCategory
}

/**
 * Product breadcrumb — a plain "Catálogo / Categoria / Subcategoria / Produto"
 * trail (no category dropdowns; the top-level navigator covers category
 * browsing), rooted at the catalogue like the category pages. Derived from
 * the product's category chain, failing soft to "Catálogo / {title}".
 */
const PathBar = async ({ product, countryCode }: PathBarWrapperProps) => {
  const categories = (product.categories ??
    []) as HttpTypes.StoreProductCategory[]

  const crumbs: Crumb[] = [{ label: "Catálogo", href: "/store" }]

  if (categories.length) {
    // Walk the parent chain (leaf → root), re-fetching each category by id to
    // get its parent. Guard against cycles / runaway depth.
    const deepest = pickDeepestCategory(categories)!
    const chain: HttpTypes.StoreProductCategory[] = []
    let cursorId: string | undefined = deepest.id
    let guard = 0
    while (cursorId && guard < 8) {
      const cat = await getCategoryById(cursorId)
      if (!cat) break
      chain.unshift(cat as HttpTypes.StoreProductCategory)
      cursorId = (cat.parent_category as HttpTypes.StoreProductCategory | null)
        ?.id
      guard++
    }
    const path = chain.length ? chain : [deepest]
    // Internal bookkeeping groups (EQ_/ML_…) are skipped; the rest use their
    // customer-facing names.
    for (const cat of path) {
      if (isInternalCategory(cat.name)) continue
      crumbs.push({
        label: displayCategoryName(cat.name),
        href: `/categories/${cat.handle}`,
      })
    }
  }

  // Leaf: the current product (no link).
  crumbs.push({ label: product.title })

  return (
    <div className="content-container">
      <nav
        aria-label="Navegação estrutural"
        data-testid="product-breadcrumb"
        className="flex items-center gap-x-2 overflow-x-auto no-scrollbar py-2.5 text-xs font-semibold tracking-wide text-fg-muted small:py-3"
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <span
              key={`${crumb.label}-${i}`}
              className="flex items-center gap-x-2"
            >
              {i > 0 && (
                <span className="text-hairline" aria-hidden="true">
                  /
                </span>
              )}
              {crumb.href && !isLast ? (
                <LocalizedClientLink
                  href={crumb.href}
                  className="inline-flex min-h-[24px] items-center whitespace-nowrap transition-colors hover:text-brand-ink"
                >
                  {crumb.label}
                </LocalizedClientLink>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="whitespace-nowrap text-brand-ink"
                >
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>
    </div>
  )
}

export default PathBar
