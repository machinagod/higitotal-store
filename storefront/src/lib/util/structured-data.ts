import { HttpTypes } from "@medusajs/types"

import { getProductPrice } from "./get-product-price"
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "./seo"

type Json = Record<string, any>

/** schema.org Organization for the brand — rendered once, site-wide. */
export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/higitotal/logo-full.png"),
    description: SITE_DESCRIPTION,
    sameAs: [] as string[],
  }
}

/** schema.org WebSite with a SearchAction so Google can offer a sitelinks
 * search box pointing at the storefront search route. */
export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/")}results/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/** schema.org BreadcrumbList from ordered { name, url } trail items. */
export function breadcrumbSchema(
  items: { name: string; url: string }[]
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * schema.org Product for a PDP, including an Offer built from the cheapest
 * variant price. `url` should be the canonical product URL. Availability is
 * derived from variant inventory; an absent price omits the Offer entirely so we
 * never emit a malformed one.
 */
export function productSchema({
  product,
  url,
}: {
  product: HttpTypes.StoreProduct
  url: string
}): Json {
  const { cheapestPrice } = getProductPrice({ product })

  const images = [
    product.thumbnail,
    ...(product.images?.map((i) => i.url) ?? []),
  ].filter((src, i, arr): src is string => Boolean(src) && arr.indexOf(src) === i)

  const variants = product.variants ?? []
  const anyInStock = variants.some(
    (v: any) => !v?.manage_inventory || (v?.inventory_quantity ?? 0) > 0
  )
  const sku =
    variants.find((v) => v.sku)?.sku ?? (product as any).external_id ?? undefined

  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.subtitle || product.title,
    url,
  }

  if (images.length) schema.image = images
  if (sku) schema.sku = sku

  if (cheapestPrice) {
    schema.offers = {
      "@type": "Offer",
      url,
      priceCurrency: cheapestPrice.currency_code?.toUpperCase(),
      price: Number(cheapestPrice.calculated_price_number).toFixed(2),
      availability: anyInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    }
  }

  return schema
}
