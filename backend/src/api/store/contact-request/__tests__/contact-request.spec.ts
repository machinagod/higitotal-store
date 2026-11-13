import { parseContactRequest, sendContactRequest, ContactRequest } from "../handler"
import {
  buildAckParagraphs,
  buildStaffSubject,
  contactPrefLabel,
  inferContactKind,
} from "../../../../modules/email-notifications/contact-request-copy"

describe("inferContactKind", () => {
  it("keeps an explicit valid kind", () => {
    expect(inferContactKind({ kind: "geral", sku: "X1" })).toBe("geral")
    expect(inferContactKind({ kind: "assistencia" })).toBe("assistencia")
  })

  it("infers assistencia from the legacy assistência title", () => {
    expect(inferContactKind({ productTitle: "Assistência Técnica" })).toBe("assistencia")
  })

  it("infers produto from a product title or sku", () => {
    expect(inferContactKind({ productTitle: "Drip Floor (2L)" })).toBe("produto")
    expect(inferContactKind({ sku: "DX1002" })).toBe("produto")
  })

  it("falls back to geral and ignores unknown kinds", () => {
    expect(inferContactKind({})).toBe("geral")
    expect(inferContactKind({ kind: "spam" })).toBe("geral")
  })
})

describe("buildStaffSubject", () => {
  it("names product, customer and company for product enquiries", () => {
    expect(
      buildStaffSubject({ kind: "produto", name: "Ana Silva", empresa: "Hotel Central", productTitle: "Drip Floor (2L)" })
    ).toBe("Pedido de orçamento: Drip Floor (2L) — Ana Silva, Hotel Central")
  })

  it("omits the company when absent", () => {
    expect(buildStaffSubject({ kind: "produto", name: "Ana", productTitle: "Drip Floor" })).toBe(
      "Pedido de orçamento: Drip Floor — Ana"
    )
  })

  it("uses a heading per kind", () => {
    expect(buildStaffSubject({ kind: "assistencia", name: "Rui", empresa: "Restaurante X" })).toBe(
      "Pedido de assistência técnica — Rui, Restaurante X"
    )
    expect(buildStaffSubject({ kind: "geral", name: "Rui" })).toBe("Pedido de contacto — Rui")
  })

  it("strips newlines (header safety) and truncates long titles", () => {
    const subject = buildStaffSubject({ kind: "produto", name: "Ana\r\nBcc: x@y.z", productTitle: "A".repeat(200) })
    expect(subject).not.toMatch(/[\r\n]/)
    expect(subject.length).toBeLessThan(200)
    expect(subject).toContain("…")
  })
})

describe("contactPrefLabel", () => {
  it("capitalises known channels", () => {
    expect(contactPrefLabel("telefone")).toBe("Telefone")
    expect(contactPrefLabel("email")).toBe("E-mail")
    expect(contactPrefLabel("whatsapp")).toBe("Whatsapp")
    expect(contactPrefLabel("")).toBeUndefined()
  })
})

describe("buildAckParagraphs", () => {
  it("mentions the product for product enquiries", () => {
    expect(buildAckParagraphs({ name: "Ana", kind: "produto", productTitle: "Drip Floor (2L)" })).toEqual([
      "Olá, Ana.",
      "Obrigado pelo seu contacto sobre Drip Floor (2L). A nossa equipa comercial responderá em dias úteis.",
      "Para assuntos urgentes: +351 278 262 913 (chamada para a rede fixa nacional).",
    ])
  })

  it("is generic otherwise and names the technical team for assistência", () => {
    expect(buildAckParagraphs({ name: "Ana", kind: "geral", productTitle: "ignored" })[1]).toBe(
      "Obrigado pelo seu contacto. A nossa equipa comercial responderá em dias úteis."
    )
    expect(buildAckParagraphs({ name: "Ana", kind: "assistencia" })[1]).toContain("equipa técnica")
  })
})

describe("parseContactRequest", () => {
  const base = { name: " Ana ", email: "ana@empresa.pt", phone: "912345678" }

  it("accepts the legacy payload and infers the kind", () => {
    const r = parseContactRequest({
      ...base,
      contactPref: "telefone",
      productTitle: "Drip Floor (2L)",
      sku: "DX1002",
      quantity: 3,
      productUrl: "https://higitotal.pt/pt/products/dx1002",
    })
    expect(r).toEqual({
      status: "ok",
      request: expect.objectContaining({
        kind: "produto",
        name: "Ana",
        sku: "DX1002",
        quantity: 3,
        productUrl: "https://higitotal.pt/pt/products/dx1002",
      }),
    })
  })

  it("accepts the new optional fields", () => {
    const r = parseContactRequest({
      ...base,
      kind: "geral",
      empresa: "Hotel Central",
      localidade: "Mirandela",
      quantidadeEstimada: 20,
    })
    expect(r.status === "ok" && r.request).toMatchObject({
      kind: "geral",
      empresa: "Hotel Central",
      localidade: "Mirandela",
      quantidadeEstimada: "20",
    })
  })

  it("flags honeypot hits", () => {
    expect(parseContactRequest({ ...base, company: "Bot Inc" })).toEqual({ status: "honeypot" })
  })

  it("requires a name and a valid e-mail", () => {
    expect(parseContactRequest({ ...base, name: "" }).status).toBe("invalid")
    expect(parseContactRequest({ ...base, email: "ana@" }).status).toBe("invalid")
    expect(parseContactRequest(null).status).toBe("invalid")
  })

  it("requires a phone or a message", () => {
    expect(parseContactRequest({ name: "Ana", email: "ana@empresa.pt" })).toEqual({
      status: "invalid",
      message: "provide a phone or a message",
    })
    expect(parseContactRequest({ name: "Ana", email: "ana@empresa.pt", message: "Olá" }).status).toBe("ok")
  })

  it("rejects over-long fields", () => {
    expect(parseContactRequest({ ...base, message: "x".repeat(5001) })).toEqual({
      status: "invalid",
      message: "message is too long",
    })
  })

  it("drops non-http page URLs and invalid quantities", () => {
    const r = parseContactRequest({ ...base, productUrl: "javascript:alert(1)", quantity: -2 })
    expect(r.status === "ok" && r.request.productUrl).toBeUndefined()
    expect(r.status === "ok" && r.request.quantity).toBeUndefined()
  })

  it("ignores non-string field types", () => {
    const r = parseContactRequest({ ...base, empresa: { evil: true } })
    expect(r.status === "ok" && r.request.empresa).toBeUndefined()
  })
})

describe("sendContactRequest", () => {
  const request: ContactRequest = {
    kind: "produto",
    name: "Ana",
    email: "ana@empresa.pt",
    phone: "912345678",
    empresa: "Hotel Central",
    productTitle: "Drip Floor (2L)",
    sku: "DX1002",
  }
  const logger = { warn: jest.fn() }
  const deps = (createNotifications: jest.Mock) => ({
    notification: { createNotifications },
    logger,
    to: "vendas@higitotal.pt",
  })

  it("sends the staff e-mail then the customer acknowledgement", async () => {
    const create = jest.fn().mockResolvedValue([{ status: "success" }])
    await expect(sendContactRequest(request, deps(create))).resolves.toEqual({ ok: true, ackSent: true })

    const staff = create.mock.calls[0][0]
    expect(staff.to).toBe("vendas@higitotal.pt")
    expect(staff.template).toBe("contact-request")
    expect(staff.data.emailOptions).toEqual({
      subject: "Pedido de orçamento: Drip Floor (2L) — Ana, Hotel Central",
      replyTo: "ana@empresa.pt",
    })
    expect(staff.data).toMatchObject({ kind: "produto", empresa: "Hotel Central" })

    const ack = create.mock.calls[1][0]
    expect(ack.to).toBe("ana@empresa.pt")
    expect(ack.template).toBe("contact-request-ack")
    expect(ack.data).toEqual({
      emailOptions: { subject: "Recebemos o seu pedido — Higitotal", replyTo: "vendas@higitotal.pt" },
      name: "Ana",
      kind: "produto",
      productTitle: "Drip Floor (2L)",
    })
  })

  it("fails (and sends no acknowledgement) when the staff e-mail is recorded as failed", async () => {
    const create = jest.fn().mockResolvedValue([{ status: "failure" }])
    await expect(sendContactRequest(request, deps(create))).resolves.toEqual({ ok: false })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it("fails when the staff e-mail throws", async () => {
    const create = jest.fn().mockRejectedValue(new Error("boom"))
    await expect(sendContactRequest(request, deps(create))).resolves.toEqual({ ok: false })
  })

  it("does not fail the request when the acknowledgement throws", async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce([{ status: "success" }])
      .mockRejectedValueOnce(new Error("resend down"))
    await expect(sendContactRequest(request, deps(create))).resolves.toEqual({ ok: true, ackSent: false })
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("resend down"))
  })

  it("does not fail the request when the acknowledgement is recorded as failed", async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce({ status: "success" })
      .mockResolvedValueOnce({ status: "failure" })
    await expect(sendContactRequest(request, deps(create))).resolves.toEqual({ ok: true, ackSent: false })
    expect(logger.warn).toHaveBeenCalled()
  })

  it("leaves the product out of a non-product acknowledgement", async () => {
    const create = jest.fn().mockResolvedValue([{ status: "success" }])
    await sendContactRequest(
      { ...request, kind: "assistencia", productTitle: "Assistência Técnica", sku: undefined },
      deps(create)
    )
    expect(create.mock.calls[0][0].data.emailOptions.subject).toBe(
      "Pedido de assistência técnica — Ana, Hotel Central"
    )
    expect(create.mock.calls[1][0].data.productTitle).toBeUndefined()
  })
})
