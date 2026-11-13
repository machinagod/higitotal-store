import { describe, expect, it } from "vitest"
import { productEyebrow } from "../product-eyebrow"
import {
  categoryMetaDescription,
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
