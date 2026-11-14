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
  /**
   * Raster logos only: `srcset` (width descriptors) adding a larger file for
   * the places that render the mark big (brand page header). `src` itself is
   * sized for the small uses — the home strip, Marcas menu, chips (2× their
   * ~100px width) — so those don't download the large file. Every file keeps
   * the declared aspect (checked by brands.spec).
   */
  srcSet?: string
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
 * Single source of truth for the brands we work with — shared by the brand
 * pages (`/marcas`, `/marcas/{slug}`), the header / footer "Marcas" groups,
 * the homepage brand strip, the search suggestions and the Assistência
 * Técnica equipment section, so the list and casing never drift apart. Each
 * brand's page copy lives in @lib/brand-pages.
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
  {
    // Nilfisk press & media page (media/x33c5sos/viper-logo.png); no
    // official vector published, so a transparent PNG cropped to the art:
    // viper-hd.png (324×100) for the brand page header, and viper.png
    // (194×60, 2× the 97×30 home strip) for everything else.
    name: "Viper",
    logo: {
      src: "/brands/viper.png",
      srcSet: "/brands/viper.png 194w, /brands/viper-hd.png 324w",
      width: 900,
      height: 278,
      restFilter: "grayscale(1) brightness(2.2)",
    },
  },
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
  {
    // A Vileda range: same mark as Vileda (Marcas menu only).
    name: "Vileda Swep",
    logo: { src: "/brands/vileda.svg", width: 1687, height: 484, opticalY: 0.176 },
    categoryKeys: ["vileda swep"],
    strip: false,
  },
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

/** Index of every brand page (`/marcas`), without the country prefix. */
export const BRANDS_PATH = "/marcas"

/**
 * URL slug of a brand's page: lower-case, accent-free, words joined by "-"
 * ("SC Johnson (Deb)" → "sc-johnson-deb", "Vileda Swep" → "vileda-swep").
 */
export function brandSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** The brand whose page lives at `/marcas/{slug}`, if any. */
export function brandBySlug(
  slug: string | null | undefined,
  brands: Brand[] = BRANDS
): Brand | undefined {
  const s = (slug ?? "").toLowerCase()
  return s ? brands.find((b) => brandSlug(b.name) === s) : undefined
}

/**
 * Every brand link (header / footer "Marcas", home strip, Sobre nós) leads to
 * the brand's own page, `/marcas/{slug}`, which lists its products from the
 * listing {@link brandListing} picks.
 */
export function brandHref(brand: Pick<Brand, "name">): string {
  return `${BRANDS_PATH}/${brandSlug(brand.name)}`
}

/** Where a brand's products are listed in the catalogue. */
export type BrandListing =
  | { kind: "category"; handle: string; href: string }
  | { kind: "collection"; handle: string; href: string }
  | { kind: "search"; query: string; href: string }

/**
 * The catalogue listing of a brand's products, best first:
 *   1. its category when that category has sub-ranges (e.g. Diversey →
 *      Lavandaria/Clax, Cozinha, Taski… and the category holds more products
 *      than the flat collection);
 *   2. its collection, when it (still) exists;
 *   3. its category, even without sub-ranges (e.g. Taski, Vileda Swep);
 *   4. a catalogue search for the brand name (Fagor, Sammic, Nilfisk…).
 * `collectionHandles` (the live list) guards against linking a deleted/empty
 * collection; omit it to trust the static config.
 */
export function brandListing(
  brand: Brand,
  opts: { category?: BrandCategory; collectionHandles?: Set<string> } = {}
): BrandListing {
  const { category, collectionHandles } = opts

  if (category?.handle && category.hasChildren) {
    return categoryListing(category.handle)
  }
  if (
    brand.collection &&
    (!collectionHandles || collectionHandles.has(brand.collection))
  ) {
    return {
      kind: "collection",
      handle: brand.collection,
      href: `/collections/${brand.collection}`,
    }
  }
  if (category?.handle) return categoryListing(category.handle)
  return {
    kind: "search",
    query: brand.name,
    href: `/results/${encodeURIComponent(brand.name)}`,
  }
}

const categoryListing = (handle: string): BrandListing => ({
  kind: "category",
  handle,
  href: `/categories/${handle}`,
})

/**
 * Map each known brand to its category: a matching root first, else (for
 * ranges such as Taski that sit under another brand) a matching descendant.
 */
export function brandCategories(
  roots: RootCategoryLike[],
  descendants: RootCategoryLike[] = [],
  brands: Brand[] = BRANDS
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

function brandLink(b: Brand): NavLink {
  return {
    label: b.name,
    href: brandHref(b),
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
 * The brand list follows {@link BRANDS} order (only `nav` brands), each
 * linking to its page ({@link brandHref}), followed by any unknown brand roots
 * (which have no page, so they link to their category).
 */
export function splitNavRoots<T extends RootCategoryLike>(
  roots: T[],
  opts: { brands?: Brand[] } = {}
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

  const brandLinks: NavLink[] = brands
    .filter((b) => b.nav !== false)
    .map(brandLink)

  return { categories, brands: [...brandLinks, ...unknownBrandRoots] }
}

/** Brands shown in the homepage strip, each with its page ({@link brandHref}). */
export function stripBrands(
  opts: { brands?: Brand[] } = {}
): (Brand & { href: string })[] {
  return (opts.brands ?? BRANDS)
    .filter((b) => b.strip !== false)
    .map((b) => ({ ...b, href: brandHref(b) }))
}
