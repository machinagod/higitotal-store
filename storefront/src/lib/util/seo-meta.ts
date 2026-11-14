/**
 * Pure (network-free) SEO copy rules: page titles, meta descriptions,
 * listing canonicals and the collection ↔ category duplicate rule. The async
 * helpers that need the canonical region live in ./seo.
 */
import { brandForCategory } from "@lib/brands"
import {
  brandCategoryName,
  displayCategoryName,
  isInternalCategory,
} from "./category-display"
import { productCountLabel } from "./listing-copy"
import { parsePage } from "./pagination"
import { productBrand, productCategoryLabel } from "./product-eyebrow"

/** Brand/site name, appended to page titles. */
export const SITE_NAME = "Higitotal"

/** Longest `<title>` we aim for (what search results show untruncated). */
export const MAX_TITLE_LENGTH = 60

/** Longest meta description we emit. */
export const MAX_DESCRIPTION_LENGTH = 155

/** Below this, a product's own description is too thin to be the snippet. */
export const MIN_PRODUCT_DESCRIPTION_LENGTH = 70

/**
 * Site-wide social image (1200×630, public/higitotal/og-default.png) for pages
 * without a picture of their own.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/higitotal/og-default.png",
  width: 1200,
  height: 630,
  alt: "Higitotal — Higiene profissional e equipamento hoteleiro, desde 1999",
}

/**
 * `<title>` for a page: "<title> · Higitotal" when that fits in
 * {@link MAX_TITLE_LENGTH} characters, otherwise the page title alone (never
 * truncated — a long product name is more useful than the site name).
 */
export function titleWithSiteName(title: string): string {
  const t = title.trim()
  if (!t) return SITE_NAME
  const full = `${t} · ${SITE_NAME}`
  return full.length <= MAX_TITLE_LENGTH ? full : t
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

/** Text without HTML tags/entities, whitespace collapsed. */
export function plainText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e.startsWith("#")) return String.fromCharCode(Number(e.slice(1)))
      return ENTITIES[e.toLowerCase()] ?? m
    })
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Trim text to at most `max` characters on a word boundary, ending with "…"
 * when anything was cut.
 */
export function truncateAtWord(
  text: string,
  max: number = MAX_DESCRIPTION_LENGTH
): string {
  const t = text.trim()
  if (t.length <= max) return t
  // Leave room for the ellipsis.
  const cut = t.slice(0, max - 1)
  // If the cut lands right before a space or punctuation, the last word is
  // complete; otherwise drop the partial word.
  const atWord = /[\s,;:.!?)]/.test(t.charAt(max - 1))
    ? cut
    : cut.replace(/\s+\S*$/, "")
  const body = (atWord || cut).replace(/[\s,;:.·—–-]+$/, "")
  return `${body}…`
}

/** Case/accent-insensitive whole-word containment. */
function containsWords(haystack: string, needle: string): boolean {
  const norm = (s: string) =>
    ` ${s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()} `
  const n = norm(needle)
  return n.trim() !== "" && norm(haystack).includes(n)
}

type ProductForMeta = {
  title?: string | null
  description?: string | null
  subtitle?: string | null
  collection?: { title?: string | null; handle?: string | null } | null
  categories?:
    | {
        name?: string | null
        handle?: string | null
        parent_category?: { name?: string | null; handle?: string | null } | null
      }[]
    | null
}

/**
 * Meta description for a product page.
 *  - its own description (or subtitle), as plain text, when it says something
 *    (≥ {@link MIN_PRODUCT_DESCRIPTION_LENGTH} chars), trimmed to fit;
 *  - otherwise built from what we know: "<title> — <brand>, <category>. Uso
 *    profissional. Peça orçamento à Higitotal, Mirandela." (the brand is left
 *    out when the title already names it).
 */
export function productMetaDescription(product: ProductForMeta): string {
  for (const source of [product.description, product.subtitle]) {
    const text = plainText(source)
    if (text.length >= MIN_PRODUCT_DESCRIPTION_LENGTH) return truncateAtWord(text)
  }

  const title = plainText(product.title).replace(/[.\s]+$/, "")
  const brand = productBrand(product)
  const category = productCategoryLabel(product)
  const qualifiers = [
    brand && !containsWords(title, brand) ? brand : null,
    category && !(brand && containsWords(brand, category)) ? category : null,
  ].filter((q): q is string => !!q)

  const head = qualifiers.length ? `${title} — ${qualifiers.join(", ")}` : title
  return truncateAtWord(
    `${head}. Uso profissional. Peça orçamento à ${SITE_NAME}, Mirandela.`
  )
}

export type CategoryForMeta = {
  name?: string | null
  handle?: string | null
  /** Medusa's flag for categories hidden from the store. */
  is_internal?: boolean | null
  parent_category?: CategoryForMeta | null
}

/**
 * Customer-facing name of a category: the brand it stands for, else its
 * display name (generic sub-groups qualified by the parent). Same rule as the
 * page H1.
 */
export function categoryLabel(category: CategoryForMeta): string {
  return (
    brandForCategory(category)?.name ??
    displayCategoryName(category.name, category.parent_category?.name)
  )
}

/**
 * The parent to name next to a sub-category so same-named categories
 * ("Lavandaria" under Detergentes / Diversey / the root) read differently —
 * or null for a root category, an internal/hidden parent (never surfaced), or
 * when the category's own label already names the parent ("Outros
 * detergentes", "Produtos SC Johnson").
 */
export function categoryParentLabel(category: CategoryForMeta): string | null {
  const parent = category.parent_category
  if (!parent?.name || parent.is_internal || isInternalCategory(parent.name)) {
    return null
  }

  const own = categoryLabel(category)
  const label = categoryLabel(parent)
  const short = brandCategoryName(parent.name)?.short
  if ([label, short].some((p) => p && containsWords(own, p))) return null
  return label
}

/**
 * Unique `<title>` text for a category page (without the site name):
 * "Lavandaria — Diversey" for a sub-category, "Lavandaria" for a root.
 */
export function categorySeoTitle(category: CategoryForMeta): string {
  const own = categoryLabel(category)
  const parent = categoryParentLabel(category)
  return parent ? `${own} — ${parent}` : own
}

/**
 * Meta description for a category listing, e.g. "Lavandaria (Diversey): 24
 * produtos para uso profissional no catálogo Higitotal. Peça preço e
 * disponibilidade." — the parent and the product count are optional.
 */
export function categoryMetaDescription(
  name: string,
  { parent, count }: { parent?: string | null; count?: number | null } = {}
): string {
  const subject = parent ? `${name} (${parent})` : name
  const text =
    count && count > 0
      ? `${subject}: ${productCountLabel(count)} para uso profissional no catálogo ${SITE_NAME}. Peça preço e disponibilidade.`
      : `${subject} para uso profissional — catálogo ${SITE_NAME}. Peça preço e disponibilidade.`
  return truncateAtWord(text)
}

/**
 * Canonical path (without the country prefix) of a paginated listing: page 1
 * is the clean path; later pages keep `?page=N` so each page of products stays
 * indexable on its own. Sort order and any other query parameter are dropped.
 */
export function listingCanonicalPath(
  path: string,
  page?: string | string[] | null
): string {
  const n = parsePage(Array.isArray(page) ? page[0] : page)
  return n > 1 ? `${path}?page=${n}` : path
}

/** Listing title, marking pages after the first ("Catálogo — página 2"). */
export function listingPageTitle(
  title: string,
  page?: string | string[] | null
): string {
  const n = parsePage(Array.isArray(page) ? page[0] : page)
  return n > 1 ? `${title} — página ${n}` : title
}

type HandleLike ={ handle?: string | null; name?: string | null }

/**
 * The category a collection duplicates: an indexable (non-internal) category
 * with the very same handle (`/collections/diversey` ↔ `/categories/diversey`).
 * Such a collection canonicalises to the category and stays out of the
 * sitemap.
 */
export function collectionCategoryTwin<C extends HandleLike>(
  collectionHandle: string | null | undefined,
  categories: C[] | null | undefined
): C | undefined {
  const handle = (collectionHandle ?? "").trim().toLowerCase()
  if (!handle) return undefined
  return (categories ?? []).find(
    (c) =>
      (c?.handle ?? "").trim().toLowerCase() === handle &&
      !isInternalCategory(c?.name)
  )
}

/** Collections that are NOT a duplicate of a category (see above). */
export function collectionsWithoutCategoryTwin<T extends HandleLike>(
  collections: T[] | null | undefined,
  categories: HandleLike[] | null | undefined
): T[] {
  return (collections ?? []).filter(
    (c) => !collectionCategoryTwin(c?.handle, categories)
  )
}
