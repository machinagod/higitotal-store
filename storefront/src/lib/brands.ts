import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

/**
 * Single source of truth for the brands we work with — shared by the header /
 * footer "Marcas" groups, the homepage brand strip and the Assistência Técnica
 * equipment section, so the list and casing never drift apart.
 *
 * Some brands also exist as top-level Medusa categories (the Moloni sync files
 * products under supplier groups such as "Diversey" or "SCJohnson (DEB)"); those
 * are presented as Marcas, never as Categorias — see {@link splitNavRoots}.
 */
export type Brand = {
  /** Customer-facing name, with the brand's own casing. */
  name: string
  /** Monochrome-friendly logo in /public/brands, with its intrinsic aspect. */
  logo?: { src: string; width: number; height: number }
  /** Collection handle — the preferred landing page when it exists. */
  collection?: string
  /** Category names/handles that are really this brand (normalised on match). */
  categoryKeys?: string[]
  /** Listed in the nav/footer "Marcas" group (default true). */
  nav?: boolean
  /** Shorter text for the strip's wordmark treatment (defaults to `name`). */
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
  { name: "Viper", nav: false },
  {
    name: "Diversey",
    collection: "diversey",
    categoryKeys: ["diversey"],
  },
  { name: "Taski", nav: false },
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
  { name: "Celea", nav: false },
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
  const keys = new Set([brandKey(c.name), brandKey(c.handle)])
  keys.delete("")
  return brands.find((b) =>
    [b.name, ...(b.categoryKeys ?? [])].some((k) => keys.has(brandKey(k)))
  )
}

export type RootCategoryLike = {
  name?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

export type NavLink = { label: string; href: string; icon?: string }

const truthy = (v: unknown) => v === true || v === "true" || v === 1 || v === "1"

/**
 * Landing page for a brand: its collection when that collection exists, else
 * the brand's own category page, else a catalogue search for the brand name.
 * `collectionHandles` (the live list) guards against linking a deleted/empty
 * collection; omit it to trust the static config.
 */
export function brandHref(
  brand: Brand,
  opts: { categoryHandle?: string; collectionHandles?: Set<string> } = {}
): string {
  const { categoryHandle, collectionHandles } = opts
  if (
    brand.collection &&
    (!collectionHandles || collectionHandles.has(brand.collection))
  ) {
    return `/collections/${brand.collection}`
  }
  if (categoryHandle) return `/categories/${categoryHandle}`
  return `/results/${encodeURIComponent(brand.name)}`
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
 * any unknown brand roots. Each brand links per {@link brandHref}.
 */
export function splitNavRoots<T extends RootCategoryLike>(
  roots: T[],
  opts: {
    collectionHandles?: Set<string>
    brands?: Brand[]
  } = {}
): { categories: T[]; brands: NavLink[] } {
  const brands = opts.brands ?? BRANDS
  const categories: T[] = []
  const brandRoots = new Map<Brand, string>()
  const unknownBrandRoots: NavLink[] = []

  for (const root of roots || []) {
    const name = root?.name ?? ""
    if (!name || isInternalCategory(name)) continue
    const brand = brandForCategory(root, brands)
    if (brand) {
      if (!brandRoots.has(brand)) brandRoots.set(brand, root.handle ?? "")
      continue
    }
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

  const brandLinks: NavLink[] = brands
    .filter((b) => b.nav !== false)
    .map((b) => ({
      label: b.name,
      href: brandHref(b, {
        categoryHandle: brandRoots.get(b) || undefined,
        collectionHandles: opts.collectionHandles,
      }),
    }))

  return { categories, brands: [...brandLinks, ...unknownBrandRoots] }
}

/**
 * Brands shown in the homepage strip, each with its landing page (collection,
 * else the brand's category among `roots`, else a catalogue search).
 */
export function stripBrands(
  opts: {
    roots?: RootCategoryLike[]
    collectionHandles?: Set<string>
    brands?: Brand[]
  } = {}
): (Brand & { href: string })[] {
  const brands = opts.brands ?? BRANDS
  const handles = new Map<Brand, string>()
  for (const root of opts.roots ?? []) {
    const brand = brandForCategory(root, brands)
    if (brand && root.handle && !handles.has(brand)) {
      handles.set(brand, root.handle)
    }
  }
  return brands
    .filter((b) => b.strip !== false)
    .map((b) => ({
      ...b,
      href: brandHref(b, {
        categoryHandle: handles.get(b),
        collectionHandles: opts.collectionHandles,
      }),
    }))
}
