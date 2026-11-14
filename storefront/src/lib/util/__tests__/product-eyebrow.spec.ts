import { describe, expect, it } from "vitest"
import {
  productBrand,
  productCategoryLabel,
  productEyebrow,
  sameLabel,
} from "../product-eyebrow"
import { categoryMetaDescription } from "../seo-meta"
import {
  collectionMetaDescription,
  decodeSearchTerm,
  productCountLabel,
} from "../listing-copy"

describe("productEyebrow", () => {
  it("prefers the brand (collection title)", () => {
    expect(
      productEyebrow({
        collection: { title: "Vileda" },
        categories: [{ name: "Utensílios Limpeza" }],
      })
    ).toBe("Vileda")
  })

  it("falls back to the first customer-facing category, display-named", () => {
    expect(
      productEyebrow({
        collection: null,
        categories: [{ name: "EQ_Máquinas" }, { name: "Utensílios Hotelaria" }],
      })
    ).toBe("Utensílios de Hotelaria")
  })

  it("skips internal and generic categories, then tries the parent", () => {
    expect(
      productEyebrow({
        categories: [{ name: "Outros", parent_category: { name: "Papel" } }],
      })
    ).toBe("Papel")
    expect(
      productEyebrow({
        categories: [
          { name: "EQ_Máquinas", parent_category: { name: "Equipamento Hoteleiro" } },
        ],
      })
    ).toBe("Equipamento Hoteleiro")
  })

  it("returns null when nothing is presentable", () => {
    expect(productEyebrow({})).toBeNull()
    expect(productEyebrow({ collection: { title: "  " }, categories: [] })).toBeNull()
    expect(
      productEyebrow({
        categories: [{ name: "Outros" }, { name: "ML_Máquinas", parent_category: null }],
      })
    ).toBeNull()
  })
})

describe("productBrand", () => {
  it("takes a collection only when it is a known brand", () => {
    expect(productBrand({ collection: { title: "Diversey" } })).toBe("Diversey")
    expect(
      productBrand({
        collection: { title: "Máquinas de Limpeza" },
        categories: [{ name: "ML_Máquinas", parent_category: { name: "Máquinas de Limpeza" } }],
      })
    ).toBeNull()
  })

  it("reads a brand-root category (or its parent)", () => {
    expect(
      productBrand({ categories: [{ name: "Cozinha", parent_category: { name: "Diversey" } }] })
    ).toBe("Diversey")
    expect(
      productBrand({ categories: [{ name: "Produtos", parent_category: { name: "SCJohnson (DEB)" } }] })
    ).toBe("SC Johnson (Deb)")
    expect(productBrand({ categories: [{ name: "Vileda" }] })).toBe("Vileda")
  })

  it("finds a known brand named in the title, longest first", () => {
    expect(productBrand({ title: "Aspirador Vp930 Eco Hepa Nilfisk" })).toBe("Nilfisk")
    expect(productBrand({ title: "Rotativa Monodisco Ls 160 VIPER" })).toBe("Viper")
    expect(productBrand({ title: "Mopa Vileda Swep Duo" })).toBe("Vileda Swep")
    // Whole words only.
    expect(productBrand({ title: "Papel Higiénico Celeaxx" })).toBeNull()
  })
})

describe("productCategoryLabel", () => {
  it("prefers a sub-category over a top-level one", () => {
    expect(
      productCategoryLabel({
        categories: [
          { name: "Papel" },
          { name: "Papel Higiénico", parent_category: { name: "Papel" } },
        ],
      })
    ).toBe("Papel Higiénico")
  })
})

describe("productEyebrow context", () => {
  it("one concept: brand when known, else the most specific category", () => {
    expect(
      productEyebrow({
        title: "Aspirador Nilfisk VL500",
        collection: { title: "Máquinas de Limpeza" },
        categories: [{ name: "ML_Máquinas", parent_category: { name: "Máquinas de Limpeza" } }],
      })
    ).toBe("Nilfisk")
    expect(
      productEyebrow({
        title: "Aspirador LSU 135P",
        collection: { title: "Máquinas de Limpeza" },
        categories: [{ name: "ML_Máquinas", parent_category: { name: "Máquinas de Limpeza" } }],
      })
    ).toBe("Máquinas de Limpeza")
  })

  it("hides the label when it repeats the page it is listed on", () => {
    const diversey = {
      collection: { title: "Diversey" },
      categories: [{ name: "Cozinha", parent_category: { name: "Diversey" } }],
    }
    expect(productEyebrow(diversey, { context: ["Diversey"] })).toBeNull()
    expect(productEyebrow(diversey, { context: ["Papel"] })).toBe("Diversey")

    const jumbo = {
      title: "Papel Higiénico Jumbo (12 rolos)",
      categories: [{ name: "Papel Higiénico", parent_category: { name: "Papel" } }],
    }
    expect(productEyebrow(jumbo, { context: ["papel higienico"] })).toBeNull()
    expect(productEyebrow(jumbo, { context: ["Papel", null] })).toBe("Papel Higiénico")
  })

  it("compares labels loosely", () => {
    expect(sameLabel("SCJohnson (DEB)", "scjohnson deb")).toBe(true)
    expect(sameLabel("", "")).toBe(false)
    expect(sameLabel("Papel", "Papel Higiénico")).toBe(false)
  })
})

describe("listing copy", () => {
  it("pluralises the product count", () => {
    expect(productCountLabel(0)).toBe("0 produtos")
    expect(productCountLabel(1)).toBe("1 produto")
    expect(productCountLabel(123)).toBe("123 produtos")
    expect(productCountLabel(NaN)).toBe("0 produtos")
  })

  it("builds the listing meta descriptions", () => {
    expect(categoryMetaDescription("Papel")).toBe(
      "Papel para uso profissional — catálogo Higitotal. Peça preço e disponibilidade."
    )
    expect(collectionMetaDescription("Vileda")).toBe(
      "Vileda: gama para uso profissional no catálogo Higitotal. Peça preço e disponibilidade."
    )
  })

  it("decodes search terms safely", () => {
    expect(decodeSearchTerm("caf%C3%A9%20gel")).toBe("café gel")
    expect(decodeSearchTerm("luvas")).toBe("luvas")
    expect(decodeSearchTerm("%E0%A4%A")).toBe("%E0%A4%A")
  })
})
