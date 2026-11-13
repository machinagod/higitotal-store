import { describe, expect, it } from "vitest"
import {
  BRANDS,
  brandForCategory,
  brandHref,
  brandKey,
  splitNavRoots,
  stripBrands,
} from "../brands"

// Mirrors the live top-level categories (names, handles, metadata) at the time
// of writing — five of them are supplier brands, not product categories.
const ROOTS = [
  { name: "Detergentes", handle: "detergentes", metadata: {} },
  { name: "Utensílios Limpeza", handle: "utensilios-limpeza", metadata: {} },
  { name: "Máquinas de Limpeza", handle: "maquinas-de-limpeza", metadata: {} },
  { name: "Equipamento Hoteleiro", handle: "equipamento-hoteleiro", metadata: {} },
  { name: "Diversey", handle: "diversey", metadata: { nav_hidden: "true" } },
  { name: "Papel", handle: "papel", metadata: {} },
  { name: "SCJohnson (DEB)", handle: "scjohnson-(deb)", metadata: { nav_hidden: "true" } },
  { name: "Vileda", handle: "vileda", metadata: { nav_hidden: "true" } },
  { name: "Vileda Swep", handle: "vileda-swep", metadata: { nav_hidden: "true" } },
  { name: "Unilever", handle: "unilever", metadata: {} },
  { name: "EQ_Máquinas", handle: "eq-maquinas", metadata: {} },
  { name: "Arquivo", handle: "arquivo", metadata: { nav_hidden: true } },
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
    expect(brandForCategory({ name: "Detergentes" })).toBeUndefined()
    expect(brandForCategory({ name: "" })).toBeUndefined()
  })
})

describe("splitNavRoots", () => {
  const { categories, brands } = splitNavRoots(ROOTS, {
    collectionHandles: LIVE_COLLECTIONS,
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

  it("lists brands, linking to the collection, else the brand category, else search", () => {
    const byLabel = Object.fromEntries(brands.map((b) => [b.label, b.href]))
    expect(byLabel["Diversey"]).toBe("/collections/diversey")
    expect(byLabel["Unilever"]).toBe("/collections/unilever")
    expect(byLabel["Vileda"]).toBe("/collections/vileda")
    expect(byLabel["Vileda Swep"]).toBe("/categories/vileda-swep")
    expect(byLabel["SC Johnson (Deb)"]).toBe("/categories/scjohnson-(deb)")
    expect(byLabel["Fagor"]).toBe("/results/Fagor")
    // Strip-only brands stay out of the nav group.
    expect(byLabel["Celea"]).toBeUndefined()
  })

  it("falls back to the category when the collection no longer exists", () => {
    const { brands } = splitNavRoots(ROOTS, { collectionHandles: new Set() })
    const vileda = brands.find((b) => b.label === "Vileda")
    expect(vileda?.href).toBe("/categories/vileda")
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
    const strip = stripBrands({ roots: ROOTS, collectionHandles: LIVE_COLLECTIONS })
    const names = strip.map((b) => b.name)
    expect(names).toContain("Celea")
    expect(names).not.toContain("CELEA")
    expect(names).not.toContain("Vileda Swep")
    expect(strip.find((b) => b.name === "Vileda")?.href).toBe("/collections/vileda")
    expect(strip.find((b) => b.name === "SC Johnson (Deb)")?.href).toBe(
      "/categories/scjohnson-(deb)"
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

  it("trusts the static collection when no live list is given", () => {
    expect(brandHref({ name: "X", collection: "x" })).toBe("/collections/x")
    expect(brandHref({ name: "A B" })).toBe("/results/A%20B")
  })
})
