import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  BRAND_SERVICE_PAGES,
  BRAND_SERVICE_SLUGS,
  brandProductsPath,
  brandServiceBreadcrumbs,
  brandServiceDescription,
  brandServiceFaqSchema,
  brandServiceFaqs,
  brandServiceH1,
  brandServiceMetadata,
  brandServiceOffers,
  brandServicePath,
  brandServiceSchema,
  brandServiceStaticParams,
  brandServiceTitle,
  getBrandServicePage,
  getBrandServicePageByName,
  HOW_IT_WORKS,
  serviceSitemapEntries,
  SERVICE_TOWN_NAMES,
} from "../brand-service-pages"
import { BRANDS } from "../brands"
import { COMPANY } from "../company"

const fagor = getBrandServicePage("fagor")!

describe("brand service pages — slugs & lookup", () => {
  it("covers exactly the serviced brands", () => {
    expect(BRAND_SERVICE_SLUGS).toEqual(["fagor", "sammic", "nilfisk", "viper"])
  })

  it("finds a page by slug (case/space-insensitive) and 404s unknown ones", () => {
    expect(getBrandServicePage("sammic")?.brand).toBe("Sammic")
    expect(getBrandServicePage(" NILFISK ")?.slug).toBe("nilfisk")
    expect(getBrandServicePage("vileda")).toBeUndefined()
    expect(getBrandServicePage("")).toBeUndefined()
    expect(getBrandServicePage(undefined)).toBeUndefined()
    expect(getBrandServicePage(null)).toBeUndefined()
  })

  it("finds a page by brand name (the main page's chips)", () => {
    expect(getBrandServicePageByName("Viper")?.slug).toBe("viper")
    expect(getBrandServicePageByName("fagor")?.slug).toBe("fagor")
    expect(getBrandServicePageByName("Taski")).toBeUndefined()
  })

  it("uses the brand names from @lib/brands (logos resolve)", () => {
    for (const p of BRAND_SERVICE_PAGES) {
      expect(BRANDS.find((b) => b.name === p.brand)?.logo).toBeTruthy()
    }
  })

  it("builds paths without the country prefix", () => {
    expect(brandServicePath("fagor")).toBe("/assistencia-tecnica/fagor")
    expect(brandProductsPath("viper")).toBe("/marcas/viper")
  })

  it("generates every country × slug for static params", () => {
    const params = brandServiceStaticParams(["pt", "es"])
    expect(params).toHaveLength(8)
    expect(params).toContainEqual({ countryCode: "pt", marca: "fagor" })
    expect(params).toContainEqual({ countryCode: "es", marca: "viper" })
    expect(brandServiceStaticParams([])).toEqual([])
  })
})

describe("brand service pages — copy", () => {
  it.each(BRAND_SERVICE_PAGES.map((p) => [p.slug, p] as const))(
    "%s has an intro, equipment cards and a brand-specific placeholder",
    (_slug, p) => {
      expect(p.intro).toContain(p.brand)
      expect(p.intro).toContain("Mirandela")
      expect(p.equipment.length).toBeGreaterThanOrEqual(4)
      for (const e of p.equipment) {
        expect(e.title.length).toBeGreaterThan(0)
        expect(e.body.length).toBeGreaterThan(0)
      }
      expect(p.messagePlaceholder).toContain(p.brand)
    }
  )

  it("never promises response times, certifications or official status", () => {
    const text = JSON.stringify([
      BRAND_SERVICE_PAGES,
      BRAND_SERVICE_PAGES.map(brandServiceFaqs),
      BRAND_SERVICE_PAGES.map(brandServiceOffers),
      HOW_IT_WORKS,
    ]).toLowerCase()
    for (const banned of [
      "oficial",
      "autorizad",
      "certificad",
      "24h",
      "24 h",
      "horas",
      "€",
      "parceiro",
    ]) {
      expect(text).not.toContain(banned)
    }
  })

  it("has 3–5 FAQs per brand, naming the other serviced brands", () => {
    for (const p of BRAND_SERVICE_PAGES) {
      const faqs = brandServiceFaqs(p)
      expect(faqs.length).toBeGreaterThanOrEqual(3)
      expect(faqs.length).toBeLessThanOrEqual(5)
      const others = faqs.find((f) => f.question.includes("outras marcas"))!
      for (const o of BRAND_SERVICE_PAGES.filter((x) => x.slug !== p.slug)) {
        expect(others.answer).toContain(o.brand)
      }
      expect(others.answer).not.toContain(`equipamento ${p.brand}`)
    }
    const info = brandServiceFaqs(fagor).find((f) =>
      f.question.startsWith("Que informação")
    )!
    expect(info.answer).toMatch(/modelo/)
    expect(info.answer).toMatch(/série/)
    expect(info.answer).toMatch(/fotografia/)
    expect(info.answer).toContain(COMPANY.email)
  })

  it("offers the three services of the main page", () => {
    expect(brandServiceOffers(fagor).map((o) => o.title)).toEqual([
      "Instalação",
      "Reparação",
      "Contratos de manutenção",
    ])
    expect(HOW_IT_WORKS[0].body).toContain(COMPANY.phone.display)
  })
})

describe("brand service pages — metadata", () => {
  it.each(BRAND_SERVICE_PAGES.map((p) => [p.slug, p] as const))(
    "%s: title ≤ 60, description ≤ 155 mentioning Mirandela/Norte, self-canonical",
    (slug, p) => {
      const canonical = `https://www.higitotal.pt/pt/assistencia-tecnica/${slug}`
      const m = brandServiceMetadata(p, canonical)
      expect(m.title.absolute).toBe(`Assistência técnica ${p.brand} · Higitotal`)
      expect(m.title.absolute.length).toBeLessThanOrEqual(60)
      expect(m.description.length).toBeLessThanOrEqual(155)
      expect(m.description).toContain("Mirandela")
      expect(m.description).toContain("Norte")
      expect(m.description).toContain(p.brand)
      expect(m.alternates.canonical).toBe(canonical)
      expect(m.openGraph.url).toBe(canonical)
      expect(m.openGraph.title).toBe(m.title.absolute)
      expect(brandServiceH1(p)).toBe(`Assistência técnica ${p.brand}`)
      expect(brandServiceTitle(p)).toBe(m.title.absolute)
      expect(brandServiceDescription(p)).toBe(m.description)
    }
  )
})

describe("brand service pages — JSON-LD & sitemap", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://higitotal.test"
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL
  })

  it("builds a Service with the organization as provider and the North as area", () => {
    const url = "https://higitotal.test/pt/assistencia-tecnica/fagor"
    const s = brandServiceSchema(fagor, url)
    expect(s["@context"]).toBe("https://schema.org")
    expect(s["@type"]).toBe("Service")
    expect(s["@id"]).toBe(`${url}#service`)
    expect(s.serviceType).toBe("Assistência técnica Fagor")
    expect(s.url).toBe(url)
    expect(s.brand).toEqual({ "@type": "Brand", name: "Fagor" })
    expect(s.provider["@type"]).toBe("Organization")
    expect(s.provider["@id"]).toBe("https://higitotal.test/#organization")
    expect(s.provider["@context"]).toBeUndefined()
    expect(s.provider.address.addressLocality).toBe("Mirandela")
    expect(s.provider.telephone).toBe("+351278262913")
    expect(s.areaServed[0]).toEqual({
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 41.5008095,
        longitude: -7.164659,
      },
      geoRadius: 200000,
    })
    const cities = s.areaServed.slice(1).map((c: { name: string }) => c.name)
    expect(cities).toEqual(SERVICE_TOWN_NAMES)
    expect(cities).toEqual(expect.arrayContaining(["Bragança", "Vila Real", "Chaves", "Porto", "Viseu"]))
  })

  it("lists every served town (outside Mirandela) in the area FAQ", () => {
    const area = brandServiceFaqs(fagor).find((f) => f.question.startsWith("Onde"))!
    for (const t of SERVICE_TOWN_NAMES.filter((t) => t !== "Mirandela")) {
      expect(area.answer).toContain(t)
    }
    expect(area.answer).toContain("200 km")
    expect(new Set(SERVICE_TOWN_NAMES).size).toBe(SERVICE_TOWN_NAMES.length)
  })

  it("builds an FAQPage from the brand's FAQ", () => {
    const s = brandServiceFaqSchema(fagor)
    expect(s["@type"]).toBe("FAQPage")
    const faqs = brandServiceFaqs(fagor)
    expect(s.mainEntity).toHaveLength(faqs.length)
    expect(s.mainEntity[0]).toEqual({
      "@type": "Question",
      name: faqs[0].question,
      acceptedAnswer: { "@type": "Answer", text: faqs[0].answer },
    })
  })

  it("builds the breadcrumb trail from a country-prefixed root", () => {
    expect(brandServiceBreadcrumbs(fagor, "https://higitotal.test/pt/")).toEqual([
      { name: "Início", url: "https://higitotal.test/pt" },
      {
        name: "Assistência técnica",
        url: "https://higitotal.test/pt/assistencia-tecnica",
      },
      { name: "Fagor", url: "https://higitotal.test/pt/assistencia-tecnica/fagor" },
    ])
  })

  it("lists every brand page in the sitemap", () => {
    const now = new Date("2026-11-14T00:00:00Z")
    const rows = serviceSitemapEntries("https://higitotal.test/pt/", now)
    expect(rows.map((r) => r.url)).toEqual([
      "https://higitotal.test/pt/assistencia-tecnica/fagor",
      "https://higitotal.test/pt/assistencia-tecnica/sammic",
      "https://higitotal.test/pt/assistencia-tecnica/nilfisk",
      "https://higitotal.test/pt/assistencia-tecnica/viper",
    ])
    for (const r of rows) {
      expect(r.lastModified).toBe(now)
      expect(r.changeFrequency).toBe("monthly")
      expect(r.priority).toBe(0.7)
    }
    expect(serviceSitemapEntries("https://x.test/pt")[0].lastModified).toBeInstanceOf(Date)
  })
})
