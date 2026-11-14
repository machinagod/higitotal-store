import { describe, expect, it } from "vitest"

import {
  hygienePlanHref,
  hygienePlanRequest,
} from "../hygiene-plan-request"

describe("hygiene plan request", () => {
  it("builds the contact link, with or without a sector", () => {
    expect(hygienePlanHref("restauracao")).toBe(
      "/contact?pedido=plano-higiene&setor=restauracao"
    )
    expect(hygienePlanHref()).toBe("/contact?pedido=plano-higiene")
  })

  it("tags the request and names a known sector in the message", () => {
    const r = hygienePlanRequest({ pedido: "plano-higiene", setor: "restauracao" })
    expect(r?.sectorName).toBe("Restauração")
    expect(r?.message).toBe(
      "Gostaria de pedir um plano de higiene para a minha instalação (restauração)."
    )
  })

  it("ignores unknown sectors and other requests", () => {
    expect(hygienePlanRequest({ pedido: "plano-higiene", setor: "<script>" })?.message).toBe(
      "Gostaria de pedir um plano de higiene para a minha instalação."
    )
    expect(hygienePlanRequest({ pedido: "outro" })).toBeNull()
    expect(hygienePlanRequest({})).toBeNull()
    expect(hygienePlanRequest({ pedido: ["plano-higiene"] })).not.toBeNull()
  })
})
