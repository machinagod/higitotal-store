import { describe, expect, it } from "vitest"
import { displayCategoryName, isGenericCategory, isInternalCategory } from "../category-display"
import { COMPANY, yearsInBusiness } from "../../company"

describe("category display", () => {
  it("maps internal/ungrammatical names to customer-facing ones", () => {
    expect(displayCategoryName("ML_Máquinas")).toBe("Máquinas de Limpeza")
    expect(displayCategoryName("EQ_Máquinas")).toBe("Equipamento de Cozinha e Lavandaria")
    expect(displayCategoryName("Utensílios Limpeza")).toBe("Utensílios de Limpeza")
    expect(displayCategoryName("Detergentes")).toBe("Detergentes")
    expect(displayCategoryName(undefined)).toBe("")
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
