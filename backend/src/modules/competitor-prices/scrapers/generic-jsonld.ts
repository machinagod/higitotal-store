import { CompetitorScraper, PageContext, ScrapeResult } from "./types"
import { parsePriceToMinor } from "./price"

/**
 * Baseline scraper: reads schema.org `Product`/`Offer` data from the page's
 * JSON-LD (pre-parsed by the engine), falling back to common
 * `<meta itemprop="price">` / OpenGraph tags via Cheerio. Covers most modern
 * e-shops (incl. PrestaShop/WooCommerce) with no per-site selectors.
 */
export const genericJsonLdScraper: CompetitorScraper = {
  key: "generic-jsonld",
  parse(page: PageContext): ScrapeResult {
    const product = findProduct(page.jsonLd)
    const offer = product ? pickOffer(product) : undefined

    const priceRaw =
      offer?.price ??
      offer?.lowPrice ??
      metaContent(page.$, "price") ??
      metaContent(page.$, "product:price:amount")
    const price = parsePriceToMinor(priceRaw)

    if (price == null) {
      return {
        status: "not_found",
        title: textOf(product?.name) ?? null,
        raw: { jsonLdFound: !!product },
        errorMessage: "no price found",
      }
    }

    const availability = String(offer?.availability ?? "")
    const gtin =
      product?.gtin13 ?? product?.gtin ?? product?.gtin8 ?? product?.ean
    return {
      status: "ok",
      price,
      originalPrice: parsePriceToMinor(offer?.highPrice),
      currencyCode:
        offer?.priceCurrency ??
        metaContent(page.$, "product:price:currency") ??
        "EUR",
      inStock: availability ? /InStock/i.test(availability) : null,
      availability: availability || null,
      title: textOf(product?.name) ?? null,
      brand: textOf(product?.brand?.name ?? product?.brand) ?? null,
      sku: product?.sku != null ? String(product.sku) : null,
      ean: gtin != null ? String(gtin) : null,
      raw: { product, offer },
    }
  },
}

/** Find the first schema.org Product object across parsed JSON-LD blocks. */
export function findProduct(blocks: any[]): any | undefined {
  for (const node of blocks) {
    const f = walk(node)
    if (f) return f
  }
  return undefined
}

function walk(node: any): any | undefined {
  if (!node || typeof node !== "object") return undefined
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = walk(n)
      if (f) return f
    }
    return undefined
  }
  if (Array.isArray(node["@graph"])) {
    const f = walk(node["@graph"])
    if (f) return f
  }
  const type = node["@type"]
  const isProduct = Array.isArray(type)
    ? type.some((t) => /product/i.test(String(t)))
    : /product/i.test(String(type ?? ""))
  return isProduct ? node : undefined
}

function pickOffer(product: any): any | undefined {
  const offers = product?.offers
  if (!offers) return undefined
  return Array.isArray(offers) ? offers[0] : offers
}

function textOf(v: any): string | undefined {
  if (v == null) return undefined
  if (typeof v === "string") return v
  if (typeof v === "object" && typeof v.name === "string") return v.name
  return String(v)
}

function metaContent($: any, prop: string): string | undefined {
  try {
    const el = $(
      `meta[itemprop="${prop}"], meta[property="${prop}"], meta[name="${prop}"]`
    ).first()
    const c = el?.attr?.("content")
    return c || undefined
  } catch {
    return undefined
  }
}
