import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

import ChipScroller from "./chip-scroller"

export type Chip = { href: string; label: string; active?: boolean }

const chipCls =
  "inline-flex min-h-[44px] flex-none snap-start items-center whitespace-nowrap rounded-pill border px-4 text-sm font-medium leading-tight transition-colors small:whitespace-normal"

/**
 * A row of navigation chips under a listing's H1. Phones: ONE horizontally
 * scrollable row (snap, fade on the right edge as a "more →" hint, the active
 * chip scrolled into view) so the products stay above the fold; desktop wraps.
 * Every chip is a ≥ 44px tap target; the current one carries aria-current.
 */
export function ChipRow({
  chips,
  label,
  className,
}: {
  chips: Chip[]
  /** Accessible name of the nav landmark ("Subcategorias", "Categorias"…). */
  label: string
  className?: string
}) {
  if (!chips.length) return null

  return (
    <nav
      aria-label={label}
      className={clx("relative mb-5 small:mb-6", className)}
      data-testid="listing-chips"
    >
      <ChipScroller>
        {chips.map((c) => (
          <li key={c.href} className="flex">
            <LocalizedClientLink
              href={c.href}
              aria-current={c.active ? "page" : undefined}
              className={clx(
                chipCls,
                c.active
                  ? "border-brand-ink bg-brand-ink font-semibold text-white"
                  : "border-hairline bg-white text-brand-ink hover:border-brand-cyan hover:text-brand-cyan"
              )}
            >
              {c.label}
            </LocalizedClientLink>
          </li>
        ))}
      </ChipScroller>
      {/* Fade hint that the row scrolls (phones only, where it doesn't wrap). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -right-6 w-12 bg-gradient-to-l from-white to-transparent small:hidden"
      />
    </nav>
  )
}

/** Category chips for a list of categories (internal "EQ_…" groups left out). */
export function categoryChips(
  categories: (Pick<HttpTypes.StoreProductCategory, "id" | "name" | "handle"> | null | undefined)[] | null | undefined,
  activeId?: string
): Chip[] {
  return (categories ?? [])
    .filter((c): c is NonNullable<typeof c> => Boolean(c?.handle) && !isInternalCategory(c?.name))
    .map((c) => ({
      href: `/categories/${c.handle}`,
      label: displayCategoryName(c.name),
      active: c.id === activeId,
    }))
}

/**
 * Sub-category chips. A leaf category (no children) gets its SIBLINGS instead
 * (pass `siblings` + `activeId`), with itself marked current — so from
 * "Papel Higiénico" you can jump straight to "Toalhas de Mãos".
 */
const SubcategoryChips = ({
  categories,
  siblings,
  activeId,
  label = "Subcategorias",
}: {
  categories?: HttpTypes.StoreProductCategory[]
  siblings?: HttpTypes.StoreProductCategory[]
  activeId?: string
  label?: string
}) => {
  const children = categoryChips(categories)
  const chips = children.length ? children : categoryChips(siblings, activeId)
  // A lone chip pointing at the page you're on is noise.
  if (chips.length < 2 && chips.every((c) => c.active)) return null

  return <ChipRow chips={chips} label={label} />
}

export default SubcategoryChips
