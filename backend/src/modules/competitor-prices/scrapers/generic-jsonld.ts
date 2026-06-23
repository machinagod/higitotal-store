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

    // Price source order: JSON-LD Offer → schema.org microdata (`[itemprop=price]`,
    // common on PrestaShop) → meta/OpenGraph tags.
    const priceRaw =
      offer?.price ??
      offer?.lowPrice ??
      itemprop(page.$, "price") ??
      metaContent(page.$, "price") ??
      metaContent(page.$, "product:price:amount")
    const price = parsePriceToMinor(priceRaw)

    // A null or non-positive price means no usable public price — typically a
    // login-gated B2B catalogue that renders 0,00 €.
    if (price == null || price <= 0) {
      return {
        status: "not_found",
        title: textOf(product?.name) ?? itemprop(page.$, "name") ?? null,
        raw: { jsonLdFound: !!product, priceRaw: priceRaw ?? null },
        errorMessage: price === 0 || price != null ? "no public price (gated?)" : "no price found",
      }
    }

    const availability = String(
      offer?.availability ?? itemprop(page.$, "availability") ?? ""
    )
    const gtin =
      product?.gtin13 ?? product?.gtin ?? product?.gtin8 ?? product?.ean
    return {
      status: "ok",
      price,
      originalPrice: parsePriceToMinor(offer?.highPrice),
      currencyCode:
        offer?.priceCurrency ??
        itemprop(page.$, "priceCurrency") ??
        metaContent(page.$, "product:price:currency") ??
        "EUR",
      inStock: availability ? /InStock|em stock|dispon/i.test(availability) : null,
      availability: availability || null,
      title: textOf(product?.name) ?? itemprop(page.$, "name") ?? null,
      brand:
        textOf(product?.brand?.name ?? product?.brand) ??
        itemprop(page.$, "brand") ??
        null,
      sku: product?.sku != null ? String(product.sku) : itemprop(page.$, "sku") ?? null,
      ean: gtin != null ? String(gtin) : itemprop(page.$, "gtin13") ?? null,
      raw: { product, offer },
    }
  },
}

/** Read a schema.org microdata value: `[itemprop="<name>"]` content attr or text. */
function itemprop($: any, name: string): string | undefined {
  try {
    const el = $(`[itemprop="${name}"]`).first()
    if (!el || el.length === 0) return undefined
    const c = el.attr?.("content")
    if (c && String(c).trim()) return String(c).trim()
    const t = el.text?.()
    return t && String(t).trim() ? String(t).trim() : undefined
  } catch {
    return undefined
  }
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
