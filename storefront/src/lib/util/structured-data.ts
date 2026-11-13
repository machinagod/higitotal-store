import { HttpTypes } from "@medusajs/types"

import { COMPANY, MAPS_URL } from "@lib/company"

import { getProductPrice } from "./get-product-price"
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "./seo"

type Json = Record<string, any>

/** schema.org PostalAddress for the company address. */
function postalAddress(): Json {
  const { address } = COMPANY
  return {
    "@type": "PostalAddress",
    streetAddress: address.street,
    postalCode: address.postalCode,
    addressLocality: address.city,
    addressCountry: "PT",
  }
}

/** Stable node id, so other schema objects can reference the organization. */
export const organizationId = () => `${absoluteUrl("/")}#organization`

/** schema.org Organization for the brand — rendered once, site-wide. */
export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(),
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/higitotal/logo-full.png"),
    description: SITE_DESCRIPTION,
    foundingDate: String(COMPANY.since),
    taxID: COMPANY.nipc,
    email: COMPANY.email,
    telephone: COMPANY.phone.href.replace(/^tel:/, ""),
    address: postalAddress(),
    sameAs: [] as string[],
  }
}

/** schema.org AboutPage whose subject is the organization. */
export function aboutPageSchema({
  url,
  name,
  description,
}: {
  url: string
  name: string
  description: string
}): Json {
  // Nested node: drop the top-level @context.
  const organization = organizationSchema()
  delete organization["@context"]
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url,
    name,
    description,
    inLanguage: "pt-PT",
    about: organization,
  }
}

/**
 * schema.org LocalBusiness for the shop in Mirandela: address, coordinates
 * and opening hours, all from {@link COMPANY}. `url` is the page describing
 * the location.
 */
export function localBusinessSchema({ url }: { url: string }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#local-business`,
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    url,
    image: absoluteUrl("/higitotal/logo-full.png"),
    email: COMPANY.email,
    telephone: COMPANY.phone.href.replace(/^tel:/, ""),
    address: postalAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: COMPANY.geo.latitude,
      longitude: COMPANY.geo.longitude,
    },
    hasMap: MAPS_URL,
    openingHoursSpecification: COMPANY.openingHours.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: slot.days.map((d) => `https://schema.org/${d}`),
      opens: slot.opens,
      closes: slot.closes,
    })),
    parentOrganization: { "@id": organizationId() },
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
