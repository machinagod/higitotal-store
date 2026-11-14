import type { CSSProperties } from "react"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

export type BrandLogo = {
  src: string
  width: number
  height: number
  /**
   * Optical size tweak for compact marks (round badges, square or stacked
   * logos): lets the mark grow this many times taller than the shared height
   * cap of the strip / Marcas menu, so it reads at a similar weight to the
   * wide wordmarks. Default 1.
   */
  scale?: number
  /**
   * CSS `filter` for the muted, at-rest state of the strip / Marcas menu,
   * replacing the default `grayscale(1) brightness(0.35)` ink treatment. Only
   * for marks whose own contrast that treatment flattens — dark lettering on a
   * coloured field (Viper), or white lettering on one (Taski, Sammic).
   */
  restFilter?: string
  /**
   * Optical vertical centring: where the logo's ink mass sits relative to its
   * box centre, as a fraction of its height (positive = the mass sits low,
   * e.g. Vileda's leaf on top, Celea's large lowercase). Renderers shift the
   * mark by `-opticalY × renderedHeight` so every logo's visual weight lands
   * on the same centre line. Measured from the files (alpha-weighted centroid);
   * omitted when under 1.5%.
   */
  opticalY?: number
}

/** Shift that puts a logo's ink centre on the box centre (see `opticalY`). */
export function logoOpticalStyle(
  logo: BrandLogo,
  renderedHeight: number
): CSSProperties {
  const dy = -(logo.opticalY ?? 0) * renderedHeight
  return Math.abs(dy) >= 0.5
    ? { transform: `translateY(${Math.round(dy * 10) / 10}px)` }
    : {}
}

/** Inline style carrying a logo's at-rest filter override, if any. */
export function logoRestStyle(logo: BrandLogo): CSSProperties {
  return logo.restFilter
    ? ({ "--logo-rest": logo.restFilter } as CSSProperties)
    : {}
}

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
  /**
   * Official logo in /public/brands, with its intrinsic aspect (the SVG
   * viewBox / PNG pixel size). Keep the brand's own artwork and colours —
   * never redraw a mark; each entry notes where its file came from.
   */
  logo?: BrandLogo
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
    logo: { src: "/brands/fagor.svg", width: 180, height: 61, opticalY: -0.027 },
  },
  {
    // sammic.com header logo (assets/logo-sammic-115px.svg) — round badge.
    name: "Sammic",
    logo: {
      src: "/brands/sammic.svg",
      width: 113.39,
      height: 113.39,
      scale: 1.3,
      restFilter: "grayscale(1)",
    },
  },
  {
    name: "Nilfisk",
    logo: { src: "/brands/nilfisk.svg", width: 145, height: 19 },
  },
  // Viper: typeset wordmark on purpose — Higitotal doesn't use the red-oval
  // Viper logo (owner's call). Swap in a `logo` if an approved file arrives.
  { name: "Viper" },
  {
    // solenis.com (Assets/imgs/diversey-logo.svg) — Diversey is a Solenis
    // brand since 2023; this is the 2024 refreshed mark.
    name: "Diversey",
    logo: { src: "/brands/diversey.svg", width: 103, height: 20.65, opticalY: -0.017 },
    collection: "diversey",
    categoryKeys: ["diversey"],
  },
  {
    // The TASKI box, extracted (vector, unchanged) from an official TASKI
    // product sheet on taski.com (2026); matches the taski.com header.
    name: "Taski",
    logo: {
      src: "/brands/taski.svg",
      width: 56.14,
      height: 56.14,
      scale: 1.15,
      restFilter: "grayscale(1) brightness(0.8) contrast(2)",
    },
    categoryKeys: ["taski"],
  },
  {
    // unilever.com core asset (core-assets/logos/logo-static.svg).
    name: "Unilever",
    logo: {
      src: "/brands/unilever.svg",
      opticalY: -0.033,
      width: 117.92,
      height: 129.58,
      scale: 1.4,
    },
    collection: "unilever",
    categoryKeys: ["unilever"],
  },
  {
    name: "Vileda",
    logo: { src: "/brands/vileda.svg", width: 1687, height: 484, opticalY: 0.176 },
    collection: "vileda",
    categoryKeys: ["vileda"],
  },
  { name: "Vileda Swep", categoryKeys: ["vileda swep"], strip: false },
  {
    // SC Johnson wordmark extracted (vector, unchanged) from an official SC
    // Johnson Professional brochure; scjohnson.com/scjp.com are bot-walled.
    name: "SC Johnson (Deb)",
    logo: { src: "/brands/sc-johnson.svg", width: 123.01, height: 41.27, opticalY: -0.051 },
    wordmark: "SC Johnson",
    categoryKeys: ["scjohnson (deb)", "sc johnson", "deb"],
  },
  {
    // celea.es header logo (media/images/logos/logo_blau_updated_2.svg).
    name: "Celea",
    logo: { src: "/brands/celea.svg", width: 281.03, height: 85.9, opticalY: 0.106 },
  },
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
