import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  aboutPageSchema,
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  productSchema,
  websiteSchema,
} from "../structured-data"

const variant = (
  amount: number,
  opts: { sku?: string; qty?: number; manage?: boolean } = {}
) => ({
  id: `v_${amount}`,
  sku: opts.sku,
  manage_inventory: opts.manage ?? true,
  inventory_quantity: opts.qty ?? 0,
  calculated_price: {
    calculated_amount: amount,
    original_amount: amount,
    currency_code: "eur",
    calculated_price: { price_list_type: "default" },
  },
})

const baseProduct = {
  id: "prod_1",
  title: "Detergente Profissional",
  description: "Detergente concentrado para uso industrial.",
  thumbnail: "https://img.test/thumb.jpg",
  images: [{ url: "https://img.test/1.jpg" }, { url: "https://img.test/thumb.jpg" }],
} as any

describe("organizationSchema / websiteSchema", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://higitotal.test"
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL
  })

  it("emits an Organization with brand name, url and logo", () => {
    const org = organizationSchema()
    expect(org["@type"]).toBe("Organization")
    expect(org.name).toBe("Higitotal")
    expect(org.url).toBe("https://higitotal.test/")
    expect(org.logo).toBe("https://higitotal.test/higitotal/logo-full.png")
  })

  it("emits a WebSite with a SearchAction pointing at the results route", () => {
    const site = websiteSchema()
    expect(site["@type"]).toBe("WebSite")
    expect(site.potentialAction["@type"]).toBe("SearchAction")
    expect(site.potentialAction.target.urlTemplate).toBe(
      "https://higitotal.test/results/{search_term_string}"
    )
    expect(site.potentialAction["query-input"]).toContain("search_term_string")
  })
})

describe("breadcrumbSchema", () => {
  it("numbers list items from 1 and carries name + item url", () => {
    const schema = breadcrumbSchema([
      { name: "Higitotal", url: "https://h.test/dk" },
      { name: "Detergentes", url: "https://h.test/dk/categories/detergentes" },
    ])
    expect(schema["@type"]).toBe("BreadcrumbList")
    expect(schema.itemListElement).toHaveLength(2)
    expect(schema.itemListElement[0]).toMatchObject({
      position: 1,
      name: "Higitotal",
      item: "https://h.test/dk",
    })
    expect(schema.itemListElement[1].position).toBe(2)
  })
})

describe("productSchema", () => {
  const url = "https://higitotal.test/dk/products/detergente"

  it("builds a Product with a deduped image list, sku and an in-stock Offer", () => {
    const product = {
      ...baseProduct,
      variants: [
        variant(19.99, { sku: "SKU-A", qty: 0 }),
        variant(29.99, { sku: "SKU-B", qty: 5 }),
      ],
    }

    const schema = productSchema({ product, url })

    expect(schema["@type"]).toBe("Product")
    expect(schema.name).toBe("Detergente Profissional")
    expect(schema.description).toBe(
      "Detergente concentrado para uso industrial."
    )
    // thumbnail first, duplicate dropped
    expect(schema.image).toEqual([
      "https://img.test/thumb.jpg",
      "https://img.test/1.jpg",
    ])
    expect(schema.sku).toBe("SKU-A")
    expect(schema.url).toBe(url)
    expect(schema.offers).toMatchObject({
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: "19.99",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Higitotal" },
    })
  })

  it("marks the Offer OutOfStock when every managed variant has no inventory", () => {
    const product = {
      ...baseProduct,
      variants: [variant(19.99, { sku: "SKU-A", qty: 0 })],
    }
    const schema = productSchema({ product, url })
    expect(schema.offers.availability).toBe("https://schema.org/OutOfStock")
  })

  it("treats unmanaged inventory as in stock", () => {
    const product = {
      ...baseProduct,
      variants: [variant(19.99, { sku: "SKU-A", qty: 0, manage: false })],
    }
    const schema = productSchema({ product, url })
    expect(schema.offers.availability).toBe("https://schema.org/InStock")
  })

  it("handles a product with no images or variants arrays at all", () => {
    const product = {
      id: "prod_3",
      title: "Só thumbnail",
      description: "d",
      thumbnail: "https://img.test/only.jpg",
    } as any

    const schema = productSchema({ product, url })
    expect(schema.image).toEqual(["https://img.test/only.jpg"])
    expect(schema.offers).toBeUndefined()
    expect(schema.sku).toBeUndefined()
  })

  it("omits the Offer, image and sku when no price/images/sku exist", () => {
    const product = {
      id: "prod_2",
      title: "Sem preço",
      description: null,
      subtitle: "Subtítulo",
      thumbnail: null,
      images: [],
      variants: [],
    } as any

    const schema = productSchema({ product, url })
    expect(schema.offers).toBeUndefined()
    expect(schema.image).toBeUndefined()
    expect(schema.sku).toBeUndefined()
    // falls back to subtitle for the description
    expect(schema.description).toBe("Subtítulo")
  })
})

describe("company pages (AboutPage / LocalBusiness)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://higitotal.test"
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL
  })

  it("gives the Organization a stable @id and the company's identifiers", () => {
    const org = organizationSchema()
    expect(org["@id"]).toBe("https://higitotal.test/#organization")
    expect(org.foundingDate).toBe("1999")
    expect(org.taxID).toBe("504297040")
    expect(org.telephone).toBe("+351278262913")
    expect(org.address).toMatchObject({
      "@type": "PostalAddress",
      postalCode: "5370-565",
      addressLocality: "Mirandela",
      addressCountry: "PT",
    })
  })

  it("emits an AboutPage about the Organization (nested, no @context)", () => {
    const page = aboutPageSchema({
      url: "https://higitotal.test/pt/sobre-nos",
      name: "Sobre nós",
      description: "d",
    })
    expect(page["@type"]).toBe("AboutPage")
    expect(page.url).toBe("https://higitotal.test/pt/sobre-nos")
    expect(page.about["@type"]).toBe("Organization")
    expect(page.about["@context"]).toBeUndefined()
    // The site-wide Organization keeps its own @context.
    expect(organizationSchema()["@context"]).toBe("https://schema.org")
  })

  it("emits a LocalBusiness with geo and opening hours from COMPANY", () => {
    const shop = localBusinessSchema({
      url: "https://higitotal.test/pt/a-nossa-loja",
    })
    expect(shop["@type"]).toBe("LocalBusiness")
    expect(shop.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 41.5008095,
      longitude: -7.164659,
    })
    expect(shop.openingHoursSpecification).toHaveLength(2)
    expect(shop.openingHoursSpecification[0]).toMatchObject({
      "@type": "OpeningHoursSpecification",
      opens: "09:00",
      closes: "12:30",
    })
    expect(shop.openingHoursSpecification[1].dayOfWeek).toEqual([
      "https://schema.org/Monday",
      "https://schema.org/Tuesday",
      "https://schema.org/Wednesday",
      "https://schema.org/Thursday",
      "https://schema.org/Friday",
    ])
    expect(shop.parentOrganization).toEqual({
      "@id": "https://higitotal.test/#organization",
    })
  })
})
