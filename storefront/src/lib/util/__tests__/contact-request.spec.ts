import { describe, expect, it } from "vitest"

import {
  buildContactRequestPayload,
  CONTACT_ERROR_MESSAGE,
  productEnquiryHref,
  validateContactRequest,
  wantsEnquiryOpen,
} from "../contact-request"

describe("enquiry deep link", () => {
  it("builds /products/<handle>?pedido=1", () => {
    expect(productEnquiryHref("dx1002-159978153")).toBe(
      "/products/dx1002-159978153?pedido=1"
    )
  })

  it("detects the pedido param", () => {
    expect(wantsEnquiryOpen(new URLSearchParams("pedido=1"))).toBe(true)
    expect(wantsEnquiryOpen(new URLSearchParams("pedido=true"))).toBe(true)
    expect(wantsEnquiryOpen(new URLSearchParams("pedido=0"))).toBe(false)
    expect(wantsEnquiryOpen(new URLSearchParams(""))).toBe(false)
    expect(wantsEnquiryOpen(null)).toBe(false)
  })
})

describe("validateContactRequest", () => {
  const ok = { name: "Ana", email: "ana@empresa.pt", phone: "912345678" }

  it("accepts name + email + phone", () => {
    expect(validateContactRequest(ok)).toBeNull()
  })

  it("accepts a message instead of a phone", () => {
    expect(validateContactRequest({ ...ok, phone: " ", message: "Olá" })).toBeNull()
  })

  it("requires a name", () => {
    expect(validateContactRequest({ ...ok, name: "  " })).toEqual({
      field: "name",
      message: "Indique o seu nome.",
    })
  })

  it("requires a valid e-mail", () => {
    expect(validateContactRequest({ ...ok, email: "ana@" })?.field).toBe("email")
  })

  it("requires a phone or a message", () => {
    expect(validateContactRequest({ ...ok, phone: "" })?.message).toMatch(/telefone/)
  })
})

describe("buildContactRequestPayload", () => {
  it("trims values, drops empties and keeps the product context", () => {
    const payload = buildContactRequestPayload(
      {
        name: " Ana ",
        email: "ana@empresa.pt",
        phone: "",
        empresa: " Hotel Central ",
        localidade: "Mirandela",
        quantidadeEstimada: "20 caixas",
        contactPref: "email",
        message: "Olá",
        company: "",
      },
      { kind: "produto", productTitle: "Drip Floor (2L)", sku: "DX1002", productUrl: "https://x/pt/products/dx" }
    )
    expect(payload).toEqual({
      kind: "produto",
      name: "Ana",
      email: "ana@empresa.pt",
      empresa: "Hotel Central",
      localidade: "Mirandela",
      quantidadeEstimada: "20 caixas",
      contactPref: "email",
      message: "Olá",
      productTitle: "Drip Floor (2L)",
      sku: "DX1002",
      productUrl: "https://x/pt/products/dx",
    })
  })

  it("passes the honeypot through so the backend can drop bots", () => {
    const payload = buildContactRequestPayload(
      { name: "x", email: "x@y.pt", company: "spam" },
      { kind: "geral" }
    )
    expect(payload.company).toBe("spam")
  })

  it("only keeps a finite numeric cart quantity", () => {
    expect(buildContactRequestPayload({}, { kind: "produto", quantity: 3 }).quantity).toBe(3)
    expect(buildContactRequestPayload({}, { kind: "produto", quantity: NaN }).quantity).toBeUndefined()
  })
})

it("error message names the phone and its cost note", () => {
  expect(CONTACT_ERROR_MESSAGE).toBe(
    "Não foi possível enviar o pedido. Tente novamente ou ligue para +351 278 262 913 (chamada para a rede fixa nacional)."
  )
})
