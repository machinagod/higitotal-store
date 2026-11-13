import { describe, expect, it } from "vitest"

import {
  buildAssistanceMessage,
  buildContactRequestPayload,
  CONTACT_ERROR_MESSAGE,
  isTruthyFlag,
  PRODUCT_ENQUIRY_MESSAGE,
  productEnquiryHref,
  QUOTE_LIST_MESSAGE,
  searchWithoutEnquiryParam,
  shortHours,
  validateContactRequest,
  validateContactRequestAll,
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

  it("asks for an e-mail when it is missing and for a valid one when malformed", () => {
    expect(validateContactRequest({ ...ok, email: "" })?.message).toBe(
      "Indique o seu e-mail."
    )
    expect(validateContactRequest({ ...ok, email: "ana@x" })?.message).toMatch(
      /e-mail válido/
    )
  })

  it("requires a phone when Telefone is the preferred contact", () => {
    expect(
      validateContactRequest({
        ...ok,
        phone: "",
        message: "Preciso de 20 caixas",
        contactPref: "telefone",
      })
    ).toEqual({
      field: "phone",
      message:
        "Indique um telefone ou escolha E-mail como forma de contacto preferida.",
    })
    // E-mail preferred: the message is enough.
    expect(
      validateContactRequest({
        ...ok,
        phone: "",
        message: "Preciso de 20 caixas",
        contactPref: "email",
      })
    ).toBeNull()
  })

  it("rejects a phone with fewer than 9 digits", () => {
    expect(validateContactRequest({ ...ok, phone: "12 34" })?.field).toBe("phone")
    expect(validateContactRequest({ ...ok, phone: "+351 912 345 678" })).toBeNull()
  })

  it("treats an unchanged prefilled message as empty", () => {
    const prefilled = PRODUCT_ENQUIRY_MESSAGE
    const f = { ...ok, phone: "", contactPref: "email", message: prefilled }
    expect(validateContactRequest(f, { prefilledMessage: prefilled })).toEqual({
      field: "message",
      message: "Indique um telefone ou escreva uma mensagem.",
    })
    // Re-wrapped whitespace still counts as unchanged.
    expect(
      validateContactRequest(
        { ...f, message: `  ${prefilled.replace(/ /g, "\n")} ` },
        { prefilledMessage: prefilled }
      )?.field
    ).toBe("message")
    // Edited → valid; a phone also satisfies the rule.
    expect(
      validateContactRequest(
        { ...f, message: `${prefilled} São 40 unidades.` },
        { prefilledMessage: prefilled }
      )
    ).toBeNull()
    expect(
      validateContactRequest({ ...f, phone: "912345678" }, { prefilledMessage: prefilled })
    ).toBeNull()
  })

  it("uses the assistência wording for the description", () => {
    expect(
      validateContactRequest(
        { ...ok, phone: "", contactPref: "email", message: "" },
        { messageHint: "descreva o pedido" }
      )?.message
    ).toBe("Indique um telefone ou descreva o pedido.")
  })
})

describe("validateContactRequestAll", () => {
  it("lists every problem in form order", () => {
    expect(
      validateContactRequestAll({ name: "", email: "x", phone: "", contactPref: "telefone" }).map(
        (p) => p.field
      )
    ).toEqual(["name", "email", "phone"])
  })

  it("is empty for a valid request", () => {
    expect(
      validateContactRequestAll({ name: "Ana", email: "ana@empresa.pt", phone: "912345678" })
    ).toEqual([])
  })
})

describe("assistência helpers", () => {
  it("builds the message from type, equipment and the user's description", () => {
    expect(
      buildAssistanceMessage({
        tipo: "Reparação",
        equipamento: " Fagor ",
        descricao: "Não aquece.",
      })
    ).toBe("Tipo de serviço: Reparação\nEquipamento / marca: Fagor\n\nNão aquece.")
    expect(buildAssistanceMessage({ tipo: "Instalação" })).toBe(
      "Tipo de serviço: Instalação"
    )
    expect(buildAssistanceMessage({})).toBeUndefined()
  })

  it("validates the user's description, not the assembled message", () => {
    // The assembled message always has the service type; the description is empty.
    const fields = { name: "Rui", email: "rui@x.pt", phone: "", contactPref: "email", message: "" }
    expect(validateContactRequest(fields, { messageHint: "descreva o pedido" })?.field).toBe(
      "message"
    )
  })

  it("sends modelo and urgente only when set", () => {
    const base = { name: "Rui", email: "rui@x.pt", phone: "912345678" }
    expect(
      buildContactRequestPayload(
        { ...base, modelo: " LVC-21 / SN 123 ", urgente: "on" },
        { kind: "assistencia", message: "Tipo de serviço: Reparação" }
      )
    ).toMatchObject({
      kind: "assistencia",
      modelo: "LVC-21 / SN 123",
      urgente: true,
      message: "Tipo de serviço: Reparação",
    })
    const p = buildContactRequestPayload({ ...base, modelo: "", urgente: null }, { kind: "assistencia" })
    expect(p).not.toHaveProperty("modelo")
    expect(p).not.toHaveProperty("urgente")
  })

  it("parses checkbox / JSON truthiness", () => {
    expect(isTruthyFlag("on")).toBe(true)
    expect(isTruthyFlag(true)).toBe(true)
    expect(isTruthyFlag("false")).toBe(false)
    expect(isTruthyFlag(undefined)).toBe(false)
  })
})

describe("shortHours", () => {
  it("compacts the published hours", () => {
    expect(shortHours("Segunda a sexta, 9h00–12h30 e 14h00–18h30")).toBe(
      "Seg–Sex 9h00–12h30 · 14h00–18h30"
    )
  })

  it("leaves unknown formats alone", () => {
    expect(shortHours("Todos os dias, 24h")).toBe("Todos os dias, 24h")
  })
})

describe("searchWithoutEnquiryParam", () => {
  it("drops pedido and keeps other params", () => {
    expect(searchWithoutEnquiryParam("?pedido=1")).toBe("")
    expect(searchWithoutEnquiryParam("?utm_source=x&pedido=1")).toBe("?utm_source=x")
  })
})

describe("quote list request", () => {
  const items = [
    { sku: "DX1002", title: "Drip Floor (2L)", quantity: 3, url: "https://store.higitotal.pt/pt/products/dx" },
    { title: "Suma Bac D10", quantity: 12, note: "caixas" },
  ]

  it("sends the items with a product request", () => {
    const payload = buildContactRequestPayload(
      { name: "Ana", email: "ana@empresa.pt", phone: "912345678", message: QUOTE_LIST_MESSAGE },
      { kind: "produto", items }
    )
    expect(payload).toEqual({
      kind: "produto",
      name: "Ana",
      email: "ana@empresa.pt",
      phone: "912345678",
      message: QUOTE_LIST_MESSAGE,
      items,
    })
  })

  it("omits an empty list", () => {
    const payload = buildContactRequestPayload({ name: "Ana", email: "a@b.pt", message: "Olá" }, { kind: "geral", items: [] })
    expect(payload).not.toHaveProperty("items")
  })

  it("does not count the unchanged quote message as a message", () => {
    expect(
      validateContactRequestAll(
        { name: "Ana", email: "ana@empresa.pt", contactPref: "email", message: QUOTE_LIST_MESSAGE },
        { prefilledMessage: QUOTE_LIST_MESSAGE }
      )
    ).toEqual([{ field: "message", message: "Indique um telefone ou escreva uma mensagem." }])
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
