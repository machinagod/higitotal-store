import {
  displayCategoryName,
  isGenericCategory,
  isInternalCategory,
} from "./category-display"

type EyebrowCategory = {
  name?: string | null
  parent_category?: { name?: string | null } | null
}

type EyebrowProduct = {
  collection?: { title?: string | null } | null
  categories?: EyebrowCategory[] | null
}

function usable(name: string | null | undefined): name is string {
  const n = (name ?? "").trim()
  return n !== "" && !isInternalCategory(n) && !isGenericCategory(n)
}

/**
 * The small label above a product card title: the brand (collection) when
 * there is one; else the first category a customer would recognise (not an
 * internal bookkeeping code like "EQ_Máquinas", not a generic "Outros"),
 * falling back to that category's parent ("Outros" under "Papel" → "Papel");
 * else nothing.
 */
export function productEyebrow(product: EyebrowProduct): string | null {
  const brand = product.collection?.title?.trim()
  if (brand) return brand

  const cats = product.categories ?? []
  const own = cats.find((c) => usable(c?.name))
  if (own) return displayCategoryName(own.name)

  const parent = cats
    .map((c) => c?.parent_category?.name)
    .find((n) => usable(n))
  return parent ? displayCategoryName(parent) : null
}
