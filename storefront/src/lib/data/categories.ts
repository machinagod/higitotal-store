import { sdk } from "@lib/config"
import { cache } from "react"
import { getProductsList } from "./products"
import {
  brandCategories,
  brandListing,
  splitNavRoots,
  stripBrands,
  type Brand,
  type BrandListing,
  type NavLink,
} from "@lib/brands"
import { displayCategoryName } from "@lib/util/category-display"

/**
 * Every category (with its direct children). The Store API pages at 50 by
 * default and the catalogue has more than that (62 at the time of writing), so
 * ask for a generous page explicitly — otherwise the search suggestions, the
 * sitemap and the static params silently miss the tail.
 */
export const listCategories = cache(async function () {
  return sdk.store.category
    .list(
      { fields: "+category_children", limit: 1000 },
      { next: { tags: ["categories"] } }
    )
    .then(({ product_categories }) => product_categories)
})

/** Non-root categories (fails soft to []), used to place brand ranges. */
const getDescendantCategories = cache(async function () {
  return listCategories()
    .then((all) => (all || []).filter((c: any) => c.parent_category_id))
    .catch(() => [] as any[])
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  return sdk.store.category.list(
    // TODO: Look into fixing the type
    // @ts-ignore
    { limit, offset },
    { next: { tags: ["categories"] } }
  )
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {
  return sdk.store.category.list(
    {
      handle: categoryHandle,
      // Pull the full descendant tree so a top-level category can list products
      // from all of its sub-categories (most products live on the leaves).
      include_descendants_tree: true,
      fields: "id,name,handle,description,*parent_category,*category_children",
    },
    { next: { tags: ["categories"] } }
  )
})

/**
 * Collect a category's own id plus every descendant id from its
 * `category_children` tree (populated by `include_descendants_tree`). Used to
 * list products from a category AND all of its sub-categories.
 */
export function collectCategoryIds(category: any): string[] {
  const ids: string[] = []
  const walk = (c: any) => {
    if (!c?.id) return
    ids.push(c.id)
    for (const child of c.category_children || []) walk(child)
  }
  walk(category)
  return ids
}

/**
 * Retrieve a single category with its immediate parent and children. Used by the
 * product page path-bar to walk the parent chain and list sibling categories.
 * Fails soft to `null` so the path-bar can gracefully degrade.
 */
export const getCategoryById = cache(async function (categoryId: string) {
  return sdk.store.category
    .retrieve(
      categoryId,
      {
        fields:
          "id,name,handle,rank,*parent_category,*category_children",
      },
      { next: { tags: ["categories"] } }
    )
    .then(({ product_category }) => product_category)
    .catch(() => null)
})

/**
 * Top-level categories for the header nav + home cards, resolved straight from
 * Medusa (dynamic — new product categories appear automatically) and split into
 * real product categories and brands (see `splitNavRoots` in @lib/brands):
 * supplier-brand roots ("Diversey", "Unilever", "SCJohnson (DEB)" …) are
 * presented as Marcas, internal bookkeeping groups are dropped, and other roots
 * flagged `metadata.nav_hidden` stay reachable via their /categories pages but
 * drop out of the nav. Categories carry their customer-facing display name and
 * a Lucide-style icon name; brands link to their page (`/marcas/{slug}`).
 */
export const getNavGroups = cache(async function (): Promise<{
  categories: NavLink[]
  brands: NavLink[]
}> {
  const roots = await getRootCategories()
  const { categories, brands } = splitNavRoots(roots || [])
  return {
    categories: categories.map((c: any) => ({
      label: displayCategoryName(c.name),
      href: `/categories/${c.handle}`,
      icon: resolveCategoryIcon(c),
    })),
    brands,
  }
})

/** Real product categories only (no brands), in nav order. */
export const getNavCategories = cache(async function () {
  return (await getNavGroups()).categories
})

/** Live collection handles (fails soft to undefined → trust static config). */
const getCollectionHandles = cache(async function (): Promise<
  Set<string> | undefined
> {
  return sdk.store.collection
    .list({ limit: 100, fields: "handle" }, { next: { tags: ["collections"] } })
    .then(({ collections }) => new Set(collections.map((c) => c.handle)))
    .catch(() => undefined)
})

/** Homepage brand strip entries, each linking to its brand page. */
export const getStripBrands = cache(async function () {
  return stripBrands()
})

/**
 * Where a brand's products are listed, resolved against the live category
 * tree and collections (see `brandListing` in @lib/brands): its category with
 * sub-ranges, else its collection, else its category, else a search. Fails
 * soft to the static config (collection, else search).
 */
export const getBrandListing = cache(async function (
  brand: Brand
): Promise<BrandListing> {
  const [roots, collectionHandles, descendants] = await Promise.all([
    getRootCategories(),
    getCollectionHandles(),
    getDescendantCategories(),
  ])
  const category = brandCategories(roots || [], descendants).get(brand)
  return brandListing(brand, { category, collectionHandles })
})

/** The Lucide icon id for a category: an explicit choice in `metadata.icon`
 * (set via the admin picker) wins; otherwise a keyword-derived default. */
export function resolveCategoryIcon(c: any): string {
  const chosen = c?.metadata?.icon
  if (typeof chosen === "string" && chosen.trim()) return chosen.trim()
  return categoryIconName(c?.name || "")
}

/** Keyword-derived default Lucide icon id (kebab-case) for a category name.
 * Used when the category has no explicit `metadata.icon`. Pure string helper so
 * the data layer stays free of JSX imports. */
export function categoryIconName(name: string): string {
  const n = (name || "").toLowerCase()
  if (n.includes("detergent") || n.includes("químic") || n.includes("lavandar")) return "spray-can"
  if (n.includes("máquina") || n.includes("maquina")) return "washing-machine"
  if (n.includes("utensílio") || n.includes("utensilio") || n.includes("esfreg") || n.includes("mopa")) return "brush"
  if (n.includes("hotel") || n.includes("cozinha") || n.includes("catering")) return "cooking-pot"
  if (n.includes("papel") || n.includes("toalha") || n.includes("guardanapo")) return "scroll-text"
  if (n.includes("saco")) return "shopping-bag"
  if (n.includes("ambientador") || n.includes("inseticida")) return "wind"
  if (n.includes("descartá") || n.includes("descarta")) return "utensils-crossed"
  if (n.includes("dispensador") || n.includes("suporte")) return "container"
  if (n.includes("assist") || n.includes("técnic") || n.includes("tecnic")) return "wrench"
  return "package"
}

/**
 * Two name-matched featured categories used by the hero's specific CTAs
 * ("Equipamento hoteleiro" + "Detergentes"). Resolved to real handles; falls
 * back to /store if not found.
 */
const FEATURED_CATEGORIES = [
  { match: "detergentes", label: "Detergentes" },
  { match: "equipamento hoteleiro", label: "Equipamento Hoteleiro" },
]

export const getFeaturedCategories = cache(async function () {
  const roots = await getRootCategories()
  const byName = new Map(
    (roots || []).map((c: any) => [String(c.name || "").toLowerCase().trim(), c])
  )
  return FEATURED_CATEGORIES.map(({ match, label }) => {
    const cat = byName.get(match)
    return { label, href: cat ? `/categories/${cat.handle}` : "/store" }
  })
})

/**
 * Retrieve the top-level (root) categories — those with no parent. Used as the
 * sibling set for the first path-bar segment and the source for the nav. Ordered
 * by the category `rank` so the nav follows the merchandising order set in admin.
 */
export const getRootCategories = cache(async function () {
  return sdk.store.category
    .list(
      // @ts-ignore — parent_category_id filter is supported by the store API
      {
        parent_category_id: "null",
        // Child ids only tell the brand links whether a brand has sub-ranges.
        fields: "id,name,handle,rank,metadata,category_children.id",
        limit: 100,
      },
      { next: { tags: ["categories"] } }
    )
    .then(({ product_categories }) =>
      [...(product_categories || [])].sort(navSortKey)
    )
    .catch(() => [])
})

/**
 * Order categories for the storefront nav. Precedence:
 *   1. explicit `metadata.nav_order` (set per-category in the admin) — wins,
 *   2. a flagship-led default for the known product lines (so the nav reads
 *      intentionally out of the box instead of alphabetically),
 *   3. the Medusa `rank`, then name.
 * A merchant can override any position from the admin "Storefront nav" widget
 * without touching code; new categories fall through to rank/name.
 */
// Papel (the highest-volume consumable) sits second so it stays inline in the
// header nav even at the narrowest desktop width.
const DEFAULT_NAV_PRIORITY: Record<string, number> = {
  detergentes: 1,
  papel: 2,
  "utensilios-limpeza": 3,
  "maquinas-de-limpeza": 4,
  "equipamento-hoteleiro": 5,
  descartaveis: 6,
  sacos: 7,
  "ambientador-e-inseticidas": 8,
  "suportes-e-dispensadores": 9,
}

function navSortKey(a: any, b: any): number {
  const ao = navOrder(a)
  const bo = navOrder(b)
  if (ao !== bo) return ao - bo
  const ap = DEFAULT_NAV_PRIORITY[a?.handle] ?? Number.MAX_SAFE_INTEGER
  const bp = DEFAULT_NAV_PRIORITY[b?.handle] ?? Number.MAX_SAFE_INTEGER
  if (ap !== bp) return ap - bp
  const ar = a?.rank ?? Number.MAX_SAFE_INTEGER
  const br = b?.rank ?? Number.MAX_SAFE_INTEGER
  if (ar !== br) return ar - br
  return String(a?.name || "").localeCompare(String(b?.name || ""))
}

function navOrder(c: any): number {
  const v = Number(c?.metadata?.nav_order)
  return Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER
}

export type NavCategoryCard = {
  label: string
  href: string
  icon: string
  /** Up to CARD_IMAGE_COUNT primary product thumbnails (the card shows the first). */
  images: string[]
}

/** How many representative product images to resolve per home category card. */
const CARD_IMAGE_COUNT = 3

/**
 * Nav categories (same set/order as {@link getNavCategories}) enriched with a
 * few representative product images for the home category cards.
 * Images are the products' primary thumbnails, pulled from the category AND all
 * of its sub-categories — most products live on the leaves, so we walk the
 * descendant tree to collect ids. Resolved per-category in parallel; any
 * per-category failure degrades to an empty image list (card renders, no
 * carousel) rather than failing the whole section.
 */
export const getNavCategoriesWithImages = cache(async function (
  countryCode: string
): Promise<NavCategoryCard[]> {
  const roots = await getRootCategories()
  const { categories: visible } = splitNavRoots(roots || [])
  return Promise.all(
    visible.map(async (c: any) => ({
      label: displayCategoryName(c.name),
      href: `/categories/${c.handle}`,
      icon: resolveCategoryIcon(c),
      images: await getCategoryThumbnails(c.handle, countryCode).catch(
        () => [] as string[]
      ),
    }))
  )
})

/**
 * Distinct primary thumbnails (up to {@link CARD_IMAGE_COUNT}) for a category
 * and its descendants. Over-fetches a small page and de-dupes, so categories
 * whose first products lack images still fill the carousel when possible.
 */
async function getCategoryThumbnails(
  handle: string,
  countryCode: string
): Promise<string[]> {
  const { product_categories } = await getCategoryByHandle([handle])
  const root = product_categories?.[0]
  if (!root) return []

  const ids = collectCategoryIds(root)
  if (!ids.length) return []

  const {
    response: { products },
  } = await getProductsList({
    queryParams: {
      category_id: ids,
      limit: 24,
      fields: "id,thumbnail,collection_id",
    },
    countryCode,
  })

  const images: string[] = []
  const seen = new Set<string>()
  for (const p of preferCurated(products)) {
    const url = p.thumbnail
    if (!url || seen.has(url)) continue
    seen.add(url)
    images.push(url)
    if (images.length >= CARD_IMAGE_COUNT) break
  }
  return images
}

/**
 * Stable re-order putting products that belong to a curated collection (brand
 * ranges, "Fornos profissionais"…) first — their photos are the most
 * representative of a category, so cards/rails pick them over odd one-offs.
 */
export function preferCurated<T extends { collection_id?: string | null }>(
  products: T[]
): T[] {
  return [
    ...products.filter((p) => p.collection_id),
    ...products.filter((p) => !p.collection_id),
  ]
}
