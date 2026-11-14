import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  BRANDS,
  BRANDS_PATH,
  brandBySlug,
  brandCategories,
  brandForCategory,
  brandHref,
  brandKey,
  brandListing,
  brandSlug,
  splitNavRoots,
  stripBrands,
  type Brand,
} from "../brands"

// Mirrors the live top-level categories (names, handles, metadata, whether
// they have children) at the time of writing — five of them are supplier
// brands, not product categories.
const ROOTS = [
  { name: "Detergentes", handle: "detergentes", metadata: {} },
  { name: "Utensílios Limpeza", handle: "utensilios-limpeza", metadata: {} },
  { name: "Máquinas de Limpeza", handle: "maquinas-de-limpeza", metadata: {} },
  { name: "Equipamento Hoteleiro", handle: "equipamento-hoteleiro", metadata: {} },
  {
    name: "Diversey",
    handle: "diversey",
    metadata: { nav_hidden: "true" },
    category_children: [{ id: "lavandaria" }, { id: "taski" }],
  },
  { name: "Papel", handle: "papel", metadata: {} },
  {
    name: "SCJohnson (DEB)",
    handle: "scjohnson-(deb)",
    metadata: { nav_hidden: "true" },
    category_children: [{ id: "produtos" }],
  },
  {
    name: "Vileda",
    handle: "vileda",
    metadata: { nav_hidden: "true" },
    category_children: [],
  },
  { name: "Vileda Swep", handle: "vileda-swep", metadata: { nav_hidden: "true" } },
  { name: "Unilever", handle: "unilever", metadata: {} },
  { name: "EQ_Máquinas", handle: "eq-maquinas", metadata: {} },
  { name: "Arquivo", handle: "arquivo", metadata: { nav_hidden: true } },
]

// Non-root categories: Taski is a range under Diversey.
const DESCENDANTS = [
  { name: "Lavandaria", handle: "lavandaria-7584815" },
  { name: "Taski", handle: "taski-7584831" },
  { name: "Papel", handle: "papel-7584826" },
]

const LIVE_COLLECTIONS = new Set([
  "vileda",
  "unilever",
  "diversey",
  "maquinas-de-limpeza",
  "fornos-profissionais",
])

describe("brandKey / brandForCategory", () => {
  it("normalises case, accents and punctuation", () => {
    expect(brandKey("SCJohnson (DEB)")).toBe("scjohnsondeb")
    expect(brandKey("scjohnson-(deb)")).toBe("scjohnsondeb")
    expect(brandKey("Máquinas")).toBe("maquinas")
    expect(brandKey(undefined)).toBe("")
  })

  it("recognises brand-named categories by name or handle", () => {
    expect(brandForCategory({ name: "Unilever" })?.name).toBe("Unilever")
    expect(brandForCategory({ name: "SCJohnson (DEB)" })?.name).toBe("SC Johnson (Deb)")
    expect(brandForCategory({ handle: "vileda-swep" })?.name).toBe("Vileda Swep")
    expect(brandForCategory({ name: "Vileda" })?.name).toBe("Vileda")
    expect(brandForCategory({ handle: "taski-7584831" })?.name).toBe("Taski")
    expect(brandForCategory({ name: "Detergentes" })).toBeUndefined()
    expect(brandForCategory({ handle: "papel-7584826" })).toBeUndefined()
    expect(brandForCategory({ name: "" })).toBeUndefined()
  })
})

describe("splitNavRoots", () => {
  const { categories, brands } = splitNavRoots(ROOTS)

  it("keeps only real product categories, in the given order", () => {
    expect(categories.map((c) => c.handle)).toEqual([
      "detergentes",
      "utensilios-limpeza",
      "maquinas-de-limpeza",
      "equipamento-hoteleiro",
      "papel",
    ])
  })

  it("never lists a brand (even without nav_hidden) as a category", () => {
    expect(categories.find((c) => c.name === "Unilever")).toBeUndefined()
  })

  it("lists every brand of the home brand wall, with consistent names", () => {
    const labels = brands.map((b) => b.label)
    for (const name of ["Taski", "Viper", "Celea", "SC Johnson (Deb)"]) {
      expect(labels).toContain(name)
    }
    expect(labels).not.toContain("SCJohnson (DEB)")
  })

  it("links every known brand to its own page", () => {
    const byLabel = Object.fromEntries(brands.map((b) => [b.label, b.href]))
    expect(byLabel["Diversey"]).toBe("/marcas/diversey")
    expect(byLabel["SC Johnson (Deb)"]).toBe("/marcas/sc-johnson-deb")
    expect(byLabel["Vileda Swep"]).toBe("/marcas/vileda-swep")
    expect(byLabel["Fagor"]).toBe("/marcas/fagor")
    // No search-results or category links left for known brands.
    for (const b of brands.slice(0, BRANDS.length)) {
      expect(b.href).toMatch(/^\/marcas\/[a-z0-9-]+$/)
    }
  })

  it("carries logos/wordmarks for the Marcas menu", () => {
    expect(brands.find((b) => b.label === "Fagor")?.logo?.src).toBe(
      "/brands/fagor.svg"
    )
    expect(brands.find((b) => b.label === "SC Johnson (Deb)")?.wordmark).toBe(
      "SC Johnson"
    )
    expect(brands.find((b) => b.label === "Sammic")?.logo).toMatchObject({
      src: "/brands/sammic.svg",
      scale: 1.3,
    })
    // Vileda Swep is a Vileda range and reuses the Vileda mark.
    expect(brands.find((b) => b.label === "Vileda Swep")?.logo?.src).toBe(
      "/brands/vileda.svg"
    )
  })

  it("treats metadata.is_brand roots as brands", () => {
    const { categories, brands } = splitNavRoots([
      { name: "Tork", handle: "tork", metadata: { is_brand: "true" } },
      { name: "Papel", handle: "papel", metadata: {} },
    ])
    expect(categories.map((c) => c.handle)).toEqual(["papel"])
    expect(brands.at(-1)).toEqual({ label: "Tork", href: "/categories/tork" })
  })
})

describe("stripBrands / logos", () => {
  it("resolves each strip brand, with the correct casing and its page", () => {
    const strip = stripBrands()
    const names = strip.map((b) => b.name)
    expect(names).toContain("Celea")
    expect(names).not.toContain("CELEA")
    expect(names).not.toContain("Vileda Swep")
    expect(strip.find((b) => b.name === "Vileda")?.href).toBe("/marcas/vileda")
    expect(strip.find((b) => b.name === "SC Johnson (Deb)")?.href).toBe(
      "/marcas/sc-johnson-deb"
    )
    expect(strip.find((b) => b.name === "Sammic")?.href).toBe("/marcas/sammic")
  })

  it("every logo has intrinsic dimensions", () => {
    for (const b of BRANDS) {
      if (b.logo) {
        expect(b.logo.width).toBeGreaterThan(0)
        expect(b.logo.height).toBeGreaterThan(0)
      }
    }
  })

  it("every logo file exists, matches its declared aspect and is inert", () => {
    const publicDir = path.resolve(__dirname, "../../../public")
    for (const b of BRANDS) {
      if (!b.logo) continue
      const file = path.join(publicDir, b.logo.src)
      expect(fs.existsSync(file), b.logo.src).toBe(true)
      const declared = b.logo.width / b.logo.height
      let actual: number
      if (file.endsWith(".svg")) {
        const svg = fs.readFileSync(file, "utf8")
        const vb = svg.match(/viewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/)
        expect(vb, b.logo.src).toHaveLength(4)
        const [, , w, h] = vb!.map(Number)
        actual = w / h
        // Sanitised: no scripts, handlers, foreign content or external refs.
        expect(svg).not.toMatch(/<script|<foreignObject|\son[a-z]+=|<image/i)
        expect(svg).not.toMatch(/href="(?!#)/)
      } else {
        // PNG: IHDR width/height at bytes 16–23.
        const png = fs.readFileSync(file)
        actual = png.readUInt32BE(16) / png.readUInt32BE(20)
      }
      // Within 1% (the older entries round their viewBox).
      expect(Math.abs(actual / declared - 1), b.logo.src).toBeLessThan(0.01)
    }
  })

  it("raster srcsets list the src and real PNGs of the stated width and aspect", () => {
    const publicDir = path.resolve(__dirname, "../../../public")
    const withSrcSet = BRANDS.filter((b) => b.logo?.srcSet)
    expect(withSrcSet.length).toBeGreaterThan(0)
    for (const b of withSrcSet) {
      const logo = b.logo!
      const entries = logo.srcSet!.split(",").map((e) => {
        const [url, descriptor] = e.trim().split(/\s+/)
        return { url, w: Number(descriptor.replace(/w$/, "")) }
      })
      expect(entries.map((e) => e.url), logo.srcSet).toContain(logo.src)
      for (const { url, w } of entries) {
        const file = path.join(publicDir, url)
        expect(file.endsWith(".png"), url).toBe(true)
        const png = fs.readFileSync(file)
        expect(png.readUInt32BE(16), url).toBe(w)
        const actual = png.readUInt32BE(16) / png.readUInt32BE(20)
        expect(
          Math.abs(actual / (logo.width / logo.height) - 1),
          url
        ).toBeLessThan(0.01)
      }
    }
  })
})

describe("brandSlug / brandBySlug / brandHref", () => {
  it("makes lower-case, accent-free, hyphenated slugs", () => {
    expect(brandSlug("Fagor")).toBe("fagor")
    expect(brandSlug("Vileda Swep")).toBe("vileda-swep")
    expect(brandSlug("SC Johnson (Deb)")).toBe("sc-johnson-deb")
    expect(brandSlug("  Ação & Cª  ")).toBe("acao-c")
    expect(brandSlug("")).toBe("")
  })

  it("gives every brand a unique, well-formed slug", () => {
    const slugs = BRANDS.map((b) => brandSlug(b.name))
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("finds the brand back from its slug (round trip)", () => {
    for (const b of BRANDS) {
      expect(brandBySlug(brandSlug(b.name))).toBe(b)
      expect(brandHref(b)).toBe(`${BRANDS_PATH}/${brandSlug(b.name)}`)
    }
    expect(brandBySlug("SC-JOHNSON-DEB")?.name).toBe("SC Johnson (Deb)")
    expect(brandBySlug("nao-existe")).toBeUndefined()
    expect(brandBySlug("")).toBeUndefined()
    expect(brandBySlug(undefined)).toBeUndefined()
  })
})

describe("brandListing / brandCategories", () => {
  // What the brand pages list, resolved like the live site does.
  const byBrand = brandCategories(ROOTS, DESCENDANTS)
  const listing = (name: string) => {
    const b = BRANDS.find((x) => x.name === name) as Brand
    return brandListing(b, {
      category: byBrand.get(b),
      collectionHandles: LIVE_COLLECTIONS,
    })
  }

  it("lists each brand: category with sub-ranges, else collection, else category, else search", () => {
    // Diversey's category has sub-ranges (Lavandaria/Clax, Cozinha, Taski…)
    // and more products than the flat collection.
    expect(listing("Diversey")).toEqual({
      kind: "category",
      handle: "diversey",
      href: "/categories/diversey",
    })
    expect(listing("SC Johnson (Deb)").href).toBe("/categories/scjohnson-(deb)")
    // Childless brand categories: the (larger) collection wins.
    expect(listing("Unilever").href).toBe("/collections/unilever")
    expect(listing("Vileda")).toMatchObject({ kind: "collection", handle: "vileda" })
    // No collection → the category, even without sub-ranges (Taski is a range
    // under Diversey).
    expect(listing("Vileda Swep").href).toBe("/categories/vileda-swep")
    expect(listing("Taski").href).toBe("/categories/taski-7584831")
    // Neither → a catalogue search.
    expect(listing("Fagor")).toEqual({
      kind: "search",
      query: "Fagor",
      href: "/results/Fagor",
    })
    expect(listing("Viper").href).toBe("/results/Viper")
    expect(listing("Celea").href).toBe("/results/Celea")
  })

  it("never maps internal groups or non-brand categories", () => {
    const handles = Array.from(byBrand.values(), (c) => c.handle)
    expect(handles).not.toContain("eq-maquinas")
    expect(handles).not.toContain("papel-7584826")
    expect(byBrand.get(BRANDS.find((b) => b.name === "Diversey")!)).toEqual({
      handle: "diversey",
      hasChildren: true,
    })
  })

  it("falls back to the category when the collection no longer exists", () => {
    const vileda = BRANDS.find((b) => b.name === "Vileda")!
    expect(
      brandListing(vileda, {
        category: byBrand.get(vileda),
        collectionHandles: new Set(),
      }).href
    ).toBe("/categories/vileda")
  })

  it("trusts the static collection when no live list is given", () => {
    expect(brandListing({ name: "X", collection: "x" }).href).toBe("/collections/x")
    expect(brandListing({ name: "A B" }).href).toBe("/results/A%20B")
  })

  it("orders category-with-children > collection > category > search", () => {
    const b = { name: "X", collection: "x" }
    expect(
      brandListing(b, { category: { handle: "x-cat", hasChildren: true } }).href
    ).toBe("/categories/x-cat")
    expect(brandListing(b, { category: { handle: "x-cat" } }).href).toBe(
      "/collections/x"
    )
    expect(
      brandListing(b, {
        category: { handle: "x-cat" },
        collectionHandles: new Set(),
      }).href
    ).toBe("/categories/x-cat")
    expect(brandListing(b, { collectionHandles: new Set() }).href).toBe(
      "/results/X"
    )
  })
})

describe("logoOpticalStyle", () => {
  it("shifts a low-weighted mark up by its measured offset", async () => {
    const { logoOpticalStyle } = await import("../brands")
    expect(
      logoOpticalStyle({ src: "/x.svg", width: 100, height: 30, opticalY: 0.2 }, 30)
    ).toEqual({ transform: "translateY(-6px)" })
  })

  it("does nothing without an offset or below half a pixel", async () => {
    const { logoOpticalStyle } = await import("../brands")
    expect(logoOpticalStyle({ src: "/x.svg", width: 100, height: 30 }, 30)).toEqual({})
    expect(
      logoOpticalStyle({ src: "/x.svg", width: 100, height: 30, opticalY: 0.01 }, 30)
    ).toEqual({})
  })
})
