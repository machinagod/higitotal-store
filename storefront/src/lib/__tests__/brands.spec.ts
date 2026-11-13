import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  BRANDS,
  brandForCategory,
  brandHref,
  brandKey,
  splitNavRoots,
  stripBrands,
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
  const { categories, brands } = splitNavRoots(ROOTS, {
    collectionHandles: LIVE_COLLECTIONS,
    descendants: DESCENDANTS,
  })

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

  it("links each brand: category with sub-ranges, else collection, else category, else search", () => {
    const byLabel = Object.fromEntries(brands.map((b) => [b.label, b.href]))
    // Diversey's category has sub-ranges (Lavandaria/Clax, Cozinha, Taski…)
    // and more products than the flat collection.
    expect(byLabel["Diversey"]).toBe("/categories/diversey")
    expect(byLabel["SC Johnson (Deb)"]).toBe("/categories/scjohnson-(deb)")
    // Childless brand categories: the (larger) collection wins.
    expect(byLabel["Unilever"]).toBe("/collections/unilever")
    expect(byLabel["Vileda"]).toBe("/collections/vileda")
    // No collection → the category, even without sub-ranges (Taski is a range
    // under Diversey).
    expect(byLabel["Vileda Swep"]).toBe("/categories/vileda-swep")
    expect(byLabel["Taski"]).toBe("/categories/taski-7584831")
    // Neither → a catalogue search.
    expect(byLabel["Fagor"]).toBe("/results/Fagor")
    expect(byLabel["Viper"]).toBe("/results/Viper")
    expect(byLabel["Celea"]).toBe("/results/Celea")
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
    // No logo → no `logo` key (the menu falls back to a monogram).
    expect(brands.find((b) => b.label === "Vileda Swep")?.logo).toBeUndefined()
  })

  it("falls back to the category when the collection no longer exists", () => {
    const { brands } = splitNavRoots(ROOTS, { collectionHandles: new Set() })
    const vileda = brands.find((b) => b.label === "Vileda")
    expect(vileda?.href).toBe("/categories/vileda")
  })

  it("prefers the collection when the brand category's children are unknown", () => {
    const { brands } = splitNavRoots(
      [{ name: "Diversey", handle: "diversey", metadata: {} }],
      { collectionHandles: LIVE_COLLECTIONS }
    )
    expect(brands.find((b) => b.label === "Diversey")?.href).toBe(
      "/collections/diversey"
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

describe("stripBrands / brandHref", () => {
  it("resolves each strip brand, with the correct casing", () => {
    const strip = stripBrands({
      roots: ROOTS,
      descendants: DESCENDANTS,
      collectionHandles: LIVE_COLLECTIONS,
    })
    const names = strip.map((b) => b.name)
    expect(names).toContain("Celea")
    expect(names).not.toContain("CELEA")
    expect(names).not.toContain("Vileda Swep")
    expect(strip.find((b) => b.name === "Vileda")?.href).toBe("/collections/vileda")
    expect(strip.find((b) => b.name === "SC Johnson (Deb)")?.href).toBe(
      "/categories/scjohnson-(deb)"
    )
    expect(strip.find((b) => b.name === "Diversey")?.href).toBe("/categories/diversey")
    expect(strip.find((b) => b.name === "Taski")?.href).toBe(
      "/categories/taski-7584831"
    )
    expect(strip.find((b) => b.name === "Sammic")?.href).toBe("/results/Sammic")
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

  it("trusts the static collection when no live list is given", () => {
    expect(brandHref({ name: "X", collection: "x" })).toBe("/collections/x")
    expect(brandHref({ name: "A B" })).toBe("/results/A%20B")
  })

  it("orders category-with-children > collection > category > search", () => {
    const b = { name: "X", collection: "x" }
    expect(
      brandHref(b, { category: { handle: "x-cat", hasChildren: true } })
    ).toBe("/categories/x-cat")
    expect(brandHref(b, { category: { handle: "x-cat" } })).toBe("/collections/x")
    expect(
      brandHref(b, {
        category: { handle: "x-cat" },
        collectionHandles: new Set(),
      })
    ).toBe("/categories/x-cat")
    expect(brandHref(b, { collectionHandles: new Set() })).toBe("/results/X")
    // Legacy option still works.
    expect(brandHref({ name: "Y" }, { categoryHandle: "y" })).toBe("/categories/y")
  })
})
