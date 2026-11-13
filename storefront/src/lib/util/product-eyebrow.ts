import { BRANDS, Brand, brandForCategory, brandKey } from "@lib/brands"
import {
  displayCategoryName,
  isGenericCategory,
  isInternalCategory,
} from "./category-display"

type EyebrowCategory = {
  name?: string | null
  handle?: string | null
  parent_category?: { name?: string | null; handle?: string | null } | null
}

type EyebrowProduct = {
  title?: string | null
  collection?: { title?: string | null; handle?: string | null } | null
  categories?: EyebrowCategory[] | null
}

function usable(name: string | null | undefined): name is string {
  const n = (name ?? "").trim()
  return n !== "" && !isInternalCategory(n) && !isGenericCategory(n)
}

/** Accent/case-insensitive whole-word match of `needle` inside `haystack`. */
function containsWord(haystack: string, needle: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
  const h = ` ${norm(haystack)} `
  const n = norm(needle)
  return n !== "" && h.includes(` ${n} `)
}

/**
 * The brand a product belongs to, when we can tell:
 *  1. its collection, when that collection is a known brand ("Vileda"; not a
 *     product line such as "Máquinas de Limpeza" or "Fornos Profissionais");
 *  2. a brand-root category it (or its category's parent) sits under
 *     ("Cozinha" under "Diversey" → Diversey);
 *  3. a known brand named in the title ("Aspirador … Nilfisk" → Nilfisk;
 *     longest brand name first, so "Vileda Swep" beats "Vileda").
 */
export function productBrand(
  product: EyebrowProduct,
  brands: Brand[] = BRANDS
): string | null {
  const coll = product.collection
  if (coll?.title?.trim()) {
    const b = brandForCategory({ name: coll.title, handle: coll.handle }, brands)
    if (b) return b.name
  }

  for (const c of product.categories ?? []) {
    const b =
      (c && brandForCategory(c, brands)) ||
      (c?.parent_category && brandForCategory(c.parent_category, brands))
    if (b) return b.name
  }

  const title = product.title ?? ""
  if (title) {
    const byLength = [...brands].sort((a, b) => b.name.length - a.name.length)
    const hit = byLength.find((b) => containsWord(title, b.name))
    if (hit) return hit.name
  }
  return null
}

/**
 * The most specific category a customer would recognise: a sub-category
 * (one with a parent) over a top-level one, never an internal bookkeeping code
 * ("EQ_Máquinas") or a generic "Outros" — those fall back to their parent
 * ("Outros" under "Papel" → "Papel"). Display-named.
 */
export function productCategoryLabel(product: EyebrowProduct): string | null {
  const cats = (product.categories ?? []).filter(Boolean)
  const leaf = cats.find((c) => usable(c.name) && usable(c.parent_category?.name))
  if (leaf) return displayCategoryName(leaf.name)

  const own = cats.find((c) => usable(c.name))
  if (own) return displayCategoryName(own.name)

  const parent = cats.map((c) => c.parent_category?.name).find((n) => usable(n))
  return parent ? displayCategoryName(parent) : null
}

/** Do two labels name the same thing (case/accent/punctuation-insensitive)? */
export function sameLabel(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const ka = brandKey(a)
  return ka !== "" && ka === brandKey(b)
}

/**
 * The small label above a product card title — ONE concept: the brand when
 * known ({@link productBrand}), else the most specific customer-facing
 * category ({@link productCategoryLabel}), else a non-brand collection (a
 * product line). Returns null when there is nothing presentable, or when the
 * label just repeats the page the card is listed on (`context`: the category /
 * brand / collection names of the current listing — "DIVERSEY" on every card of
 * the Diversey page says nothing).
 */
export function productEyebrow(
  product: EyebrowProduct,
  { context = [] }: { context?: (string | null | undefined)[] } = {}
): string | null {
  const label =
    productBrand(product) ??
    productCategoryLabel(product) ??
    (product.collection?.title?.trim() || null)

  if (!label) return null
  if (context.some((c) => sameLabel(c, label))) return null
  return label
}
