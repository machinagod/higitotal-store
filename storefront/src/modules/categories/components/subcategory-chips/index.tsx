import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

const chipCls =
  "inline-flex min-h-[36px] items-center rounded-pill border border-hairline bg-white px-3 py-1.5 text-[13px] font-medium leading-tight text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan small:px-3.5 small:text-sm"

/**
 * Sub-category chips — all of them (there are at most ~11 per category), with
 * customer-facing names; internal bookkeeping groups ("EQ_…") are left out.
 */
const SubcategoryChips = ({
  categories,
}: {
  categories?: HttpTypes.StoreProductCategory[]
}) => {
  const visible = (categories ?? []).filter(
    (c) => c?.handle && !isInternalCategory(c.name)
  )

  if (!visible.length) {
    return null
  }

  return (
    <nav aria-label="Subcategorias" className="mb-6">
      <ul className="flex flex-wrap gap-2">
        {visible.map((c) => (
          <li key={c.id}>
            <LocalizedClientLink href={`/categories/${c.handle}`} className={chipCls}>
              {displayCategoryName(c.name)}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default SubcategoryChips
