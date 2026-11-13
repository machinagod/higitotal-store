import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

/**
 * Single source of truth for the brands we work with — shared by the header /
 * footer "Marcas" groups, the homepage brand strip, the search suggestions and
 * the Assistência Técnica equipment section, so the list and casing never
 * drift apart.
 *
 * Some brands also exist as Medusa categories (the Moloni sync files products
 * under supplier groups such as "Diversey" or "SCJohnson (DEB)", and ranges
 * such as "Taski" under Diversey); those are presented as Marcas, never as
 * Categorias — see {@link splitNavRoots}.
 */
export type Brand = {
  /** Customer-facing name, with the brand's own casing. */
  name: string
  /** Monochrome-friendly logo in /public/brands, with its intrinsic aspect. */
  logo?: { src: string; width: number; height: number }
  /** Collection handle — a landing page when the brand has no sub-ranges. */
  collection?: string
  /** Category names/handles that are really this brand (normalised on match). */
  categoryKeys?: string[]
  /** Listed in the nav/footer "Marcas" group (default true). */
  nav?: boolean
  /** Shorter text for the wordmark treatment (defaults to `name`). */
  wordmark?: string
  /** Shown in the homepage brand strip (default true). */
  strip?: boolean
}

export const BRANDS: Brand[] = [
  {
    name: "Fagor",
    logo: { src: "/brands/fagor.svg", width: 180, height: 61 },
  },
  { name: "Sammic" },
  {
    name: "Nilfisk",
    logo: { src: "/brands/nilfisk.svg", width: 145, height: 19 },
  },
  { name: "Viper" },
  {
    name: "Diversey",
    collection: "diversey",
    categoryKeys: ["diversey"],
  },
  { name: "Taski", categoryKeys: ["taski"] },
  {
    name: "Unilever",
    collection: "unilever",
    categoryKeys: ["unilever"],
  },
  {
    name: "Vileda",
    logo: { src: "/brands/vileda.svg", width: 1687, height: 484 },
    collection: "vileda",
    categoryKeys: ["vileda"],
  },
  { name: "Vileda Swep", categoryKeys: ["vileda swep"], strip: false },
  {
    name: "SC Johnson (Deb)",
    wordmark: "SC Johnson",
    categoryKeys: ["scjohnson (deb)", "sc johnson", "deb"],
  },
  { name: "Celea" },
]

/** Lower-case, accent-free, alphanumeric-only key for loose name matching. */
export function brandKey(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

/** The known brand a category (by name or handle) stands for, if any. */
export function brandForCategory(
  c: { name?: string | null; handle?: string | null },
  brands: Brand[] = BRANDS
): Brand | undefined {
  // Handles of non-root categories carry a Moloni id suffix ("taski-7584831").
  const handle = (c.handle ?? "").replace(/-\d{5,}$/, "")
  const keys = new Set([brandKey(c.name), brandKey(handle)])
  keys.delete("")
  return brands.find((b) =>
    [b.name, ...(b.categoryKeys ?? [])].some((k) => keys.has(brandKey(k)))
  )
}

export type RootCategoryLike = {
  name?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
  /** Present when fetched with children; a non-empty list = sub-ranges. */
  category_children?: unknown[] | null
}

export type NavLink = {
  label: string
  href: string
  icon?: string
  /** Brand links only: logo to show instead of the plain label. */
  logo?: Brand["logo"]
  /** Brand links only: wordmark text when there is no logo. */
  wordmark?: string
}

/** Where a brand lives in the category tree, as resolved from the live list. */
export type BrandCategory = { handle: string; hasChildren?: boolean }

const truthy = (v: unknown) => v === true || v === "true" || v === 1 || v === "1"

const hasChildren = (c: RootCategoryLike) =>
  Array.isArray(c.category_children) && c.category_children.length > 0

/**
 * Landing page for a brand, best first:
 *   1. its category when that category has sub-ranges (e.g. Diversey →
 *      Lavandaria/Clax, Cozinha, Taski… render as chips there, and the
 *      category holds more products than the flat collection);
 *   2. its collection, when it (still) exists;
 *   3. its category, even without sub-ranges (e.g. Taski, Vileda Swep);
 *   4. a catalogue search for the brand name (Fagor, Sammic, Nilfisk…).
 * `collectionHandles` (the live list) guards against linking a deleted/empty
 * collection; omit it to trust the static config.
 */
export function brandHref(
  brand: Brand,
  opts: {
    category?: BrandCategory
    /** @deprecated use `category` */
    categoryHandle?: string
    collectionHandles?: Set<string>
  } = {}
): string {
  const { collectionHandles } = opts
  const category =
    opts.category ??
    (opts.categoryHandle ? { handle: opts.categoryHandle } : undefined)

  if (category?.handle && category.hasChildren) {
    return `/categories/${category.handle}`
  }
  if (
    brand.collection &&
    (!collectionHandles || collectionHandles.has(brand.collection))
  ) {
    return `/collections/${brand.collection}`
  }
  if (category?.handle) return `/categories/${category.handle}`
  return `/results/${encodeURIComponent(brand.name)}`
}

/**
 * Map each known brand to its category: a matching root first, else (for
 * ranges such as Taski that sit under another brand) a matching descendant.
 */
function brandCategories(
  roots: RootCategoryLike[],
  descendants: RootCategoryLike[],
  brands: Brand[]
): Map<Brand, BrandCategory> {
  const out = new Map<Brand, BrandCategory>()
  for (const list of [roots, descendants]) {
    for (const c of list || []) {
      if (!c?.handle || isInternalCategory(c.name)) continue
      const brand = brandForCategory(c, brands)
      if (brand && !out.has(brand)) {
        out.set(brand, { handle: c.handle, hasChildren: hasChildren(c) })
      }
    }
  }
  return out
}

function brandLink(
  b: Brand,
  category: BrandCategory | undefined,
  collectionHandles?: Set<string>
): NavLink {
  return {
    label: b.name,
    href: brandHref(b, { category, collectionHandles }),
    ...(b.logo ? { logo: b.logo } : {}),
    ...(b.wordmark ? { wordmark: b.wordmark } : {}),
  }
}

/**
 * Split the top-level categories into real product categories and brands.
 *
 * - Internal bookkeeping groups (EQ_/ML_ …) are dropped.
 * - A root that is a known brand (or carries `metadata.is_brand`) becomes a
 *   brand link, never a category.
 * - Other roots flagged `metadata.nav_hidden` are dropped.
 * - Everything else is a category, labelled with its display name, in the
 *   given (nav) order.
 *
 * The brand list follows {@link BRANDS} order (only `nav` brands), followed by
 * any unknown brand roots. Each brand links per {@link brandHref};
 * `descendants` (non-root categories) lets ranges like Taski link to their
 * own category.
 */
export function splitNavRoots<T extends RootCategoryLike>(
  roots: T[],
  opts: {
    collectionHandles?: Set<string>
    brands?: Brand[]
    descendants?: RootCategoryLike[]
  } = {}
): { categories: T[]; brands: NavLink[] } {
  const brands = opts.brands ?? BRANDS
  const categories: T[] = []
  const unknownBrandRoots: NavLink[] = []

  for (const root of roots || []) {
    const name = root?.name ?? ""
    if (!name || isInternalCategory(name)) continue
    if (brandForCategory(root, brands)) continue
    if (truthy(root?.metadata?.is_brand)) {
      unknownBrandRoots.push({
        label: displayCategoryName(name),
        href: `/categories/${root.handle}`,
      })
      continue
    }
    if (truthy(root?.metadata?.nav_hidden)) continue
    categories.push(root)
  }

  const byBrand = brandCategories(roots, opts.descendants ?? [], brands)
  const brandLinks: NavLink[] = brands
    .filter((b) => b.nav !== false)
    .map((b) => brandLink(b, byBrand.get(b), opts.collectionHandles))

  return { categories, brands: [...brandLinks, ...unknownBrandRoots] }
}

/**
 * Brands shown in the homepage strip, each with its landing page (see
 * {@link brandHref}).
 */
export function stripBrands(
  opts: {
    roots?: RootCategoryLike[]
    descendants?: RootCategoryLike[]
    collectionHandles?: Set<string>
    brands?: Brand[]
  } = {}
): (Brand & { href: string })[] {
  const brands = opts.brands ?? BRANDS
  const byBrand = brandCategories(
    opts.roots ?? [],
    opts.descendants ?? [],
    brands
  )
  return brands
    .filter((b) => b.strip !== false)
    .map((b) => ({
      ...b,
      href: brandHref(b, {
        category: byBrand.get(b),
        collectionHandles: opts.collectionHandles,
      }),
    }))
}
