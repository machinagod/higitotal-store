import { describe, expect, it } from "vitest"

import {
  COMPANY,
  DIRECTIONS_URL,
  MAPS_URL,
  displayTime,
  weeklyHours,
  yearsInBusiness,
} from "../company"

describe("company facts", () => {
  it("counts whole years since the founding year", () => {
    expect(yearsInBusiness(new Date("2026-11-13"))).toBe(27)
  })

  it("formats 24h times the way the site writes them", () => {
    expect(displayTime("09:00")).toBe("9h00")
    expect(displayTime("18:30")).toBe("18h30")
  })

  it("lists the week Monday-first, closed at the weekend", () => {
    const week = weeklyHours()
    expect(week.map((d) => d.label)).toEqual([
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
      "Domingo",
    ])
    expect(week[0].slots).toEqual(["9h00–12h30", "14h00–18h30"])
    expect(week[4].slots).toEqual(["9h00–12h30", "14h00–18h30"])
    expect(week[5].slots).toEqual([])
    expect(week[6].slots).toEqual([])
  })

  it("keeps the structured opening hours in step with the display text", () => {
    // Every slot of the structured schedule appears in `COMPANY.hours`…
    for (const slot of COMPANY.openingHours) {
      expect(COMPANY.hours).toContain(
        `${displayTime(slot.opens)}–${displayTime(slot.closes)}`
      )
    }
    // …and the text names the same day range (Monday to Friday).
    expect(COMPANY.hours).toMatch(/^Segunda a sexta,/)
    const days = new Set(COMPANY.openingHours.flatMap((s) => s.days))
    expect(Array.from(days)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ])
  })

  it("links to Google Maps by coordinates, never by an embed", () => {
    expect(MAPS_URL).toBe(
      "https://www.google.com/maps/search/?api=1&query=41.5008095%2C-7.164659"
    )
    expect(DIRECTIONS_URL).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=41.5008095%2C-7.164659"
    )
  })
})
