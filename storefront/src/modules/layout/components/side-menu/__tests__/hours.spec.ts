import { describe, expect, it } from "vitest"
import { shortHours } from "../hours"
import { COMPANY } from "@lib/company"

describe("shortHours", () => {
  it("shortens the published opening hours", () => {
    expect(shortHours("Segunda a sexta, 9h00–12h30 e 14h00–18h30")).toBe(
      "Seg–Sex 9h00–12h30 · 14h00–18h30"
    )
    expect(shortHours(COMPANY.hours)).toMatch(/^Seg–Sex /)
  })

  it("handles -feira, accents and a single slot", () => {
    expect(shortHours("Segunda-feira a sábado, 9h00–13h00")).toBe("Seg–Sáb 9h00–13h00")
  })

  it("returns unknown formats unchanged", () => {
    expect(shortHours("Todos os dias")).toBe("Todos os dias")
    expect(shortHours("Feriados a combinar, 9h")).toBe("Feriados a combinar, 9h")
  })
})
