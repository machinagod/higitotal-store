import { LEGACY_CATEGORIES, LEGACY_PRODUCTS } from "./legacy-redirects-data"

/**
 * 301 targets for URLs of the legacy PrestaShop site, which lived under /base/
 * on www.higitotal.pt (e.g. /base/detergentes/2-drip-floor-…-8436536083804.html,
 * /base/3-detergentes, /base/content/4-about-us, /base/index.php?id_product=2).
 * Once the domain points at this storefront, Google results and bookmarks keep
 * working instead of 404ing. Every /base URL resolves to something useful.
 *
 * Pure function (no Next imports) so the edge middleware and unit tests share it.
 */
const COUNTRY = "pt"
const at = (path: string) => `/${COUNTRY}${path}`

const product = (id: number) => (LEGACY_PRODUCTS[id] ? at(LEGACY_PRODUCTS[id]) : at("/store"))
const category = (id: number) =>
  LEGACY_CATEGORIES[id] ? at(`/categories/${LEGACY_CATEGORIES[id]}`) : at("/store")

// PrestaShop CMS pages: 4 = about us; 1/2/3/5 = delivery, legal notice, terms, secure payment.
const cms = (id: number) => (id === 4 ? at("") : at("/content/terms-of-use"))

// Controller / friendly-URL names → new pages.
const PAGES: Record<string, string> = {
  "": "",
  "index.php": "",
  index: "",
  "contact-us": "/contact",
  contactos: "/contact",
  contacte_nos: "/contact",
  contact: "/contact",
  stores: "/contact",
  lojas: "/contact",
  sitemap: "/store",
  "mapa-do-site": "/store",
  "new-products": "/store",
  "novos-produtos": "/store",
  "best-sales": "/store",
  "mais-vendidos": "/store",
  "prices-drop": "/store",
  promocoes: "/store",
  manufacturer: "/store",
  supplier: "/store",
  order: "/store",
  "quick-order": "/store",
  cart: "/store",
  login: "/account",
  authentication: "/account",
  "my-account": "/account",
  "password-recovery": "/account",
  "guest-tracking": "/account",
  search: "/store",
}

export function legacyRedirect(pathname: string, search: URLSearchParams): string | null {
  if (pathname !== "/base" && !pathname.startsWith("/base/")) {
    return null
  }
  const rest = pathname.replace(/^\/base\/?/, "").replace(/\/+$/, "")

  // Query-string URLs: index.php?id_product=N / id_category=N / id_cms=N / controller=x
  const qProduct = Number(search.get("id_product"))
  if (qProduct) return product(qProduct)
  const qCategory = Number(search.get("id_category"))
  if (qCategory) return category(qCategory)
  const qCms = Number(search.get("id_cms"))
  if (qCms) return cms(qCms)
  const query = (search.get("search_query") || search.get("s") || "").trim()
  if (query) return at(`/results/${encodeURIComponent(query)}`)
  const controller = search.get("controller")
  if (controller && PAGES[controller] !== undefined) return at(PAGES[controller])

  // Friendly URLs
  let m = rest.match(/(?:^|\/)(\d+)-[^/]*\.html$/) // [category-slug/]{id}-{slug}[-ean].html
  if (m) return product(Number(m[1]))
  m = rest.match(/^content\/(\d+)-/) // content/{id}-{slug}
  if (m) return cms(Number(m[1]))
  if (rest.startsWith("content/category")) return at("")
  // Old "Interessado neste produto?" / contact-form modules → contact page.
  if (rest.startsWith("module/productcontact") || rest.startsWith("module/contactform")) return at("/contact")
  m = rest.match(/^(\d+)-[^/]*$/) // {id}-{category-slug}
  if (m) return category(Number(m[1]))
  if (PAGES[rest] !== undefined) return at(PAGES[rest])

  return at("/store")
}
