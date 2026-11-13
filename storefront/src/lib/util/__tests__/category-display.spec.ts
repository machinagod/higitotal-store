import { describe, expect, it } from "vitest"
import {
  brandCategoryName,
  displayCategoryName,
  isGenericCategory,
  isInternalCategory,
} from "../category-display"
import { COMPANY, yearsInBusiness } from "../../company"
import { BRANDS, brandForCategory } from "../../brands"

describe("category display", () => {
  it("maps internal/ungrammatical names to customer-facing ones", () => {
    expect(displayCategoryName("ML_Máquinas")).toBe("Máquinas de Limpeza")
    expect(displayCategoryName("EQ_Máquinas")).toBe("Equipamento de Cozinha e Lavandaria")
    expect(displayCategoryName("Utensílios Limpeza")).toBe("Utensílios de Limpeza")
    expect(displayCategoryName("Detergentes")).toBe("Detergentes")
    expect(displayCategoryName(undefined)).toBe("")
  })

  it("names brand-root categories with the brand's own casing", () => {
    expect(displayCategoryName("SCJohnson (DEB)")).toBe("SC Johnson (Deb)")
    expect(displayCategoryName("Vileda Swep")).toBe("Vileda Swep")
    expect(displayCategoryName("Diversey")).toBe("Diversey")
    expect(brandCategoryName("SCJohnson (DEB)")?.short).toBe("SC Johnson")
    expect(brandCategoryName("Papel")).toBeUndefined()
  })

  it("uses the same brand names as the Marcas list", () => {
    for (const raw of ["SCJohnson (DEB)", "Vileda Swep", "Diversey", "Unilever", "Vileda"]) {
      expect(BRANDS.map((b) => b.name)).toContain(displayCategoryName(raw))
      expect(brandForCategory({ name: raw })?.name).toBe(displayCategoryName(raw))
    }
  })

  it("qualifies generic sub-groups by their parent", () => {
    expect(displayCategoryName("Produtos", "SCJohnson (DEB)")).toBe("Produtos SC Johnson")
    expect(displayCategoryName("Acessórios e Complementos", "Diversey")).toBe(
      "Acessórios e Complementos Diversey"
    )
    expect(displayCategoryName("Outros", "Papel")).toBe("Outros produtos de papel")
    expect(displayCategoryName("Outros", "Detergentes")).toBe("Outros detergentes")
    expect(displayCategoryName("Outros", "Utensílios Limpeza")).toBe(
      "Outros · Utensílios de Limpeza"
    )
    // Non-generic names ignore the parent; no parent → unchanged.
    expect(displayCategoryName("Lavandaria", "Diversey")).toBe("Lavandaria")
    expect(displayCategoryName("Produtos")).toBe("Produtos")
    expect(displayCategoryName("Produtos", null)).toBe("Produtos")
  })

  it("flags bookkeeping groups and generic names", () => {
    expect(isInternalCategory("EQ_Máquinas")).toBe(true)
    expect(isInternalCategory("Maquinas / Acessórios")).toBe(true)
    expect(isInternalCategory("Indiferenciado")).toBe(true)
    expect(isInternalCategory("Papel")).toBe(false)
    expect(isGenericCategory("Outros")).toBe(true)
    expect(isGenericCategory("Papel")).toBe(false)
  })
})

describe("company", () => {
  it("computes years in business from the founding year", () => {
    expect(yearsInBusiness(new Date("2026-11-13"))).toBe(27)
    expect(COMPANY.phone.href).toBe("tel:+351278262913")
  })
})
