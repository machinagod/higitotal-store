import { describe, expect, it } from "vitest"

import {
  MAX_DESCRIPTION,
  MAX_TITLE,
  SECTORS,
  getSector,
  isKnownBrand,
  liveCategoryLinks,
  sectorBrandNames,
  sectorCategoryHandles,
  sectorHref,
  sectorPageTitle,
  sectorSitemapEntries,
} from "@lib/sectors"

describe("sector config integrity", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = SECTORS.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it("covers the required sectors", () => {
    for (const slug of [
      "restauracao",
      "hotelaria",
      "lares-e-saude",
      "escolas-e-autarquias",
      "industria-alimentar",
    ]) {
      expect(getSector(slug)?.slug).toBe(slug)
    }
    expect(getSector("nope")).toBeUndefined()
  })

  it("keeps titles within 60 characters (with or without the suffix)", () => {
    for (const s of SECTORS) {
      expect(s.title.length, s.slug).toBeLessThanOrEqual(MAX_TITLE)
      expect(sectorPageTitle(s).title.length, s.slug).toBeLessThanOrEqual(
        MAX_TITLE
      )
    }
  })

  it("keeps meta descriptions within 155 characters", () => {
    for (const s of SECTORS) {
      expect(s.description.length, s.slug).toBeGreaterThan(50)
      expect(s.description.length, s.slug).toBeLessThanOrEqual(MAX_DESCRIPTION)
    }
  })

  it("has unique titles, H1s and descriptions", () => {
    for (const key of ["title", "h1", "description"] as const) {
      const values = SECTORS.map((s) => s[key])
      expect(new Set(values).size, key).toBe(values.length)
    }
  })

  it("gives every sector 4–6 needs, each with at least one link", () => {
    for (const s of SECTORS) {
      expect(s.needs.length, s.slug).toBeGreaterThanOrEqual(4)
      expect(s.needs.length, s.slug).toBeLessThanOrEqual(6)
      for (const n of s.needs) {
        expect(n.categories.length, `${s.slug}: ${n.title}`).toBeGreaterThan(0)
        expect(n.text.trim(), `${s.slug}: ${n.title}`).not.toBe("")
      }
      if (s.assistance) expect(s.assistance.categories.length).toBeGreaterThan(0)
    }
  })

  it("has intro copy, practices and featured categories", () => {
    for (const s of SECTORS) {
      expect(s.intro.length, s.slug).toBeGreaterThan(0)
      expect(s.practices.length, s.slug).toBeGreaterThan(0)
      expect(s.featuredCategories.length, s.slug).toBeGreaterThan(0)
    }
  })

  it("offers equipment/assistance on the equipment-heavy sectors", () => {
    for (const slug of [
      "restauracao",
      "hotelaria",
      "lares-e-saude",
      "industria-alimentar",
    ]) {
      expect(getSector(slug)?.assistance, slug).toBeDefined()
    }
  })

  it("links only to well-formed category handles, never internal groups", () => {
    for (const h of sectorCategoryHandles()) {
      expect(h).toMatch(/^[a-z0-9-]+$/)
      expect(h).not.toMatch(/^(eq|ml)-maquinas/)
    }
  })

  it("does not repeat a category within one block", () => {
    for (const s of SECTORS) {
      for (const n of [...s.needs, ...(s.assistance ? [s.assistance] : [])]) {
        const handles = n.categories.map((c) => c.handle)
        expect(new Set(handles).size, `${s.slug}: ${n.title}`).toBe(
          handles.length
        )
      }
    }
  })

  it("names only brands that exist in @lib/brands", () => {
    for (const name of sectorBrandNames()) {
      expect(isKnownBrand(name), name).toBe(true)
    }
    expect(isKnownBrand("Acme")).toBe(false)
  })
})

describe("sector helpers", () => {
  it("builds the sector path", () => {
    expect(sectorHref({ slug: "hotelaria" })).toBe("/setores/hotelaria")
  })

  it("adds the site suffix only when it fits", () => {
    expect(sectorPageTitle({ title: "Curto" })).toEqual({
      title: "Curto · Higitotal",
      withSuffix: true,
    })
    const long = "x".repeat(55)
    expect(sectorPageTitle({ title: long })).toEqual({
      title: long,
      withSuffix: false,
    })
  })

  it("drops links to categories missing from the live list", () => {
    const links = [
      { label: "A", handle: "a" },
      { label: "B", handle: "b" },
    ]
    expect(liveCategoryLinks(links, new Set(["b"]))).toEqual([links[1]])
    expect(liveCategoryLinks(links, undefined)).toEqual(links)
  })

  it("lists the index and every sector in the sitemap", () => {
    const when = new Date("2026-01-01")
    const entries = sectorSitemapEntries("https://example.pt/pt/", when)
    expect(entries.map((e) => e.url)).toEqual([
      "https://example.pt/pt/setores",
      ...SECTORS.map((s) => `https://example.pt/pt/setores/${s.slug}`),
    ])
    expect(entries.every((e) => e.lastModified === when)).toBe(true)
  })
})
