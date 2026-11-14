import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import {
  BRAND_PAGES,
  BRANDS_INDEX_COPY,
  brandIndexSchema,
  brandOpenGraph,
  brandPageCopy,
  brandPageSchema,
  brandPageTitle,
  brandServicePath,
  brandSitemapEntries,
  hitMentionsBrand,
} from "../brand-pages"
import { BRANDS } from "../brands"

/** Sentence count, roughly (". " / final "."). */
const sentences = (text: string) =>
  text.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).filter(Boolean).length

describe("brand page copy", () => {
  it("has copy for every brand, and none for unknown brands", () => {
    for (const b of BRANDS) expect(BRAND_PAGES[b.name], b.name).toBeDefined()
    const names = new Set(BRANDS.map((b) => b.name))
    for (const key of Object.keys(BRAND_PAGES)) expect(names.has(key), key).toBe(true)
  })

  it("keeps the intro to 2–4 sentences that name the brand", () => {
    for (const b of BRANDS) {
      const { intro } = brandPageCopy(b)
      const n = sentences(intro.join(" "))
      expect(n, b.name).toBeGreaterThanOrEqual(2)
      expect(n, b.name).toBeLessThanOrEqual(4)
      // Vileda Swep's copy says "Swep" — the range name.
      const key = b.name === "Vileda Swep" ? "Swep" : b.name.split(" ")[0]
      expect(intro.join(" "), b.name).toContain(key)
      expect(intro.join(" "), b.name).toContain("Higitotal")
    }
  })

  it("keeps meta descriptions within 155 characters (index included)", () => {
    for (const b of BRANDS) {
      const { description } = brandPageCopy(b)
      expect(description.length, b.name).toBeGreaterThan(70)
      expect(description.length, b.name).toBeLessThanOrEqual(155)
    }
    expect(BRANDS_INDEX_COPY.description.length).toBeLessThanOrEqual(155)
    expect(`${BRANDS_INDEX_COPY.title} · Higitotal`.length).toBeLessThanOrEqual(60)
  })

  it("makes no unverifiable commercial claims", () => {
    const all = JSON.stringify(BRAND_PAGES).toLowerCase()
    for (const banned of [
      "oficial",
      "certificad",
      "em stock",
      "entrega em",
      "24h",
      "48h",
      "líder",
      "melhor preço",
    ]) {
      expect(all).not.toContain(banned)
    }
  })

  it("falls back to generic copy for a brand without an entry", () => {
    const copy = brandPageCopy({ name: "Tork" })
    expect(copy.intro.join(" ")).toContain("Tork")
    expect(copy.description.length).toBeLessThanOrEqual(155)
    expect(copy.service).toBeFalsy()
  })
})

describe("brandPageTitle", () => {
  it("is '{Marca} — produtos profissionais' under the site suffix", () => {
    expect(brandPageTitle("Fagor")).toBe("Fagor — produtos profissionais")
    // Every current brand fits in 60 characters with " · Higitotal".
    for (const b of BRANDS) {
      const t = brandPageTitle(b.name)
      expect(typeof t, b.name).toBe("string")
      expect(`${t} · Higitotal`.length, b.name).toBeLessThanOrEqual(60)
    }
  })

  it("drops the site suffix when it would pass 60 characters", () => {
    const long = "Uma Marca Com Um Nome Bastante Comprido"
    expect(brandPageTitle(long)).toEqual({
      absolute: `${long} — produtos profissionais`,
    })
  })
})

describe("brandOpenGraph", () => {
  it("restates site name/locale and uses the default share image, not the SVG logo", () => {
    const og = brandOpenGraph({ title: "T", description: "D", url: "https://x/pt/marcas/fagor" })
    expect(og).toMatchObject({
      type: "website",
      siteName: "Higitotal",
      locale: "pt_PT",
      title: "T",
      url: "https://x/pt/marcas/fagor",
    })
    expect(og.images).toHaveLength(1)
    expect(og.images[0].url).toBe("/opengraph-image.jpg")
    const file = path.resolve(__dirname, "../../app/opengraph-image.jpg")
    expect(fs.existsSync(file)).toBe(true)
  })
})

describe("brandServicePath", () => {
  it("links the serviced brands (repair records) to their assistance page", () => {
    const serviced = BRANDS.filter((b) => brandServicePath(b)).map((b) => b.name)
    expect(serviced).toEqual(["Fagor", "Sammic", "Nilfisk", "Viper"])
    expect(brandServicePath({ name: "Fagor" })).toBe("/assistencia-tecnica/fagor")
    expect(brandServicePath({ name: "Viper" })).toBe("/assistencia-tecnica/viper")
    expect(brandServicePath({ name: "Diversey" })).toBeUndefined()
  })
})

describe("hitMentionsBrand", () => {
  const celea = { name: "Celea" }

  it("keeps hits that name the brand as a word, anywhere", () => {
    expect(hitMentionsBrand(celea, { title: "Guardanapos Celea 33x33cm" })).toBe(true)
    expect(hitMentionsBrand(celea, { title: "x", description: "Marca: CELEA." })).toBe(true)
    expect(
      hitMentionsBrand({ name: "Nilfisk" }, { title: "Aspirador VP300", collection: { title: "Nilfisk" } })
    ).toBe(true)
    expect(
      hitMentionsBrand({ name: "Sammic" }, { title: "Braço", categories: [{ name: "Sammic" }] })
    ).toBe(true)
  })

  it("drops typo-tolerant matches and partial words", () => {
    expect(hitMentionsBrand(celea, { title: "Deb Clear Foam Wash (6x1L)" })).toBe(false)
    expect(hitMentionsBrand(celea, { title: "Celeas", subtitle: null })).toBe(false)
    expect(hitMentionsBrand({ name: "Viper" }, { title: "Vipers 2000" })).toBe(false)
    expect(hitMentionsBrand(celea, {})).toBe(false)
  })

  it("matches multi-word names and wordmarks, ignoring punctuation and accents", () => {
    const scj = { name: "SC Johnson (Deb)", wordmark: "SC Johnson" }
    expect(hitMentionsBrand(scj, { title: "Creme S.C. Johnson" })).toBe(false)
    expect(hitMentionsBrand(scj, { title: "Sabonete SC-Johnson" })).toBe(true)
    expect(hitMentionsBrand({ name: "Ação" }, { title: "Produto acao forte" })).toBe(true)
  })
})

describe("brandSitemapEntries", () => {
  it("lists /marcas and one page per brand, under the given base", () => {
    const entries = brandSitemapEntries("https://www.higitotal.pt/pt/")
    expect(entries[0]).toMatchObject({ url: "https://www.higitotal.pt/pt/marcas" })
    expect(entries).toHaveLength(BRANDS.length + 1)
    expect(entries.map((e) => e.url)).toContain(
      "https://www.higitotal.pt/pt/marcas/sc-johnson-deb"
    )
    expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length)
    for (const e of entries) {
      expect(e.priority).toBeGreaterThan(0)
      expect(e.priority).toBeLessThanOrEqual(1)
    }
  })
})

describe("JSON-LD", () => {
  it("brand page: CollectionPage about the Brand + 3-step breadcrumb", () => {
    const [page, crumbs] = brandPageSchema({
      brand: { name: "Fagor" },
      url: "https://x/pt/marcas/fagor",
      homeUrl: "https://x/pt",
      indexUrl: "https://x/pt/marcas",
      logoUrl: "https://x/brands/fagor.svg",
      description: "d",
    })
    expect(page).toMatchObject({
      "@type": "CollectionPage",
      url: "https://x/pt/marcas/fagor",
      about: { "@type": "Brand", name: "Fagor", logo: "https://x/brands/fagor.svg" },
    })
    expect(crumbs["@type"]).toBe("BreadcrumbList")
    expect(crumbs.itemListElement.map((i: any) => [i.position, i.name, i.item])).toEqual([
      [1, "Início", "https://x/pt"],
      [2, "Marcas", "https://x/pt/marcas"],
      [3, "Fagor", "https://x/pt/marcas/fagor"],
    ])
  })

  it("omits the logo when there is none", () => {
    const [page] = brandPageSchema({
      brand: { name: "X" },
      url: "u",
      homeUrl: "h",
      indexUrl: "i",
      description: "d",
    })
    expect(page.about).toEqual({ "@type": "Brand", name: "X" })
  })

  it("index: ItemList of brand pages + 2-step breadcrumb", () => {
    const [page, crumbs] = brandIndexSchema({
      url: "https://x/pt/marcas",
      homeUrl: "https://x/pt",
      description: "d",
      items: [
        { name: "A", url: "https://x/pt/marcas/a" },
        { name: "B", url: "https://x/pt/marcas/b" },
      ],
    })
    expect(page.mainEntity.numberOfItems).toBe(2)
    expect(page.mainEntity.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "B",
      url: "https://x/pt/marcas/b",
    })
    expect(crumbs.itemListElement).toHaveLength(2)
  })
})
