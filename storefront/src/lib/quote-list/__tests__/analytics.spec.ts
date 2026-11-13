import { describe, expect, it } from "vitest"

import {
  formLeadEvent,
  pushDataLayer,
  quoteLeadEvent,
} from "../analytics"

describe("lead events", () => {
  it("maps each single-request form to a lead type", () => {
    expect(formLeadEvent("produto")).toEqual({ event: "generate_lead", lead_type: "product", items: 1 })
    expect(formLeadEvent("assistencia")).toEqual({ event: "generate_lead", lead_type: "assistencia", items: 0 })
    expect(formLeadEvent("geral")).toEqual({ event: "generate_lead", lead_type: "geral", items: 0 })
  })

  it("keeps the quote-list lead separate", () => {
    expect(quoteLeadEvent(4)).toEqual({ event: "generate_lead", lead_type: "quote", items: 4 })
  })

  it("pushes onto dataLayer without personal data", () => {
    const host: { dataLayer?: unknown[] } = {}
    pushDataLayer(formLeadEvent("produto"), host)
    expect(host.dataLayer).toEqual([{ event: "generate_lead", lead_type: "product", items: 1 }])
  })
})
