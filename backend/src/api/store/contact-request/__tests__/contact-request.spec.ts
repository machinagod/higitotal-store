import {
  ITEM_LIMITS,
  MAX_ITEM_QUANTITY,
  MAX_QUOTE_ITEMS,
  itemQuantity,
  parseContactRequest,
  parseQuoteItems,
  sendContactRequest,
  ContactRequest,
} from "../handler"
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

  it("prefixes [URGENTE] when the equipment is stopped", () => {
    expect(buildStaffSubject({ kind: "assistencia", name: "Rui", empresa: "Restaurante X", urgente: true })).toBe(
      "[URGENTE] Pedido de assistência técnica — Rui, Restaurante X"
    )
    expect(buildStaffSubject({ kind: "assistencia", name: "Rui", urgente: false })).toBe(
      "Pedido de assistência técnica — Rui"
    )
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
      message: "provide a phone, a message or items",
    })
    expect(parseContactRequest({ name: "Ana", email: "ana@empresa.pt", message: "Olá" }).status).toBe("ok")
  })

  it("accepts a quote list without phone or message", () => {
    const r = parseContactRequest({
      name: "Ana",
      email: "ana@empresa.pt",
      items: [{ sku: "PA3008", title: "Toalha de Mãos", quantity: 5 }],
    })
    expect(r.status).toBe("ok")
    // items that sanitise to nothing don't count as content
    expect(
      parseContactRequest({ name: "Ana", email: "ana@empresa.pt", items: [{ quantity: 2 }] }).status
    ).toBe("invalid")
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

  it("accepts the assistência model / serial and the urgent flag", () => {
    const r = parseContactRequest({ ...base, kind: "assistencia", modelo: " LVC-21 SN 123 ", urgente: true })
    expect(r.status === "ok" && r.request).toMatchObject({
      kind: "assistencia",
      modelo: "LVC-21 SN 123",
      urgente: true,
    })
    for (const v of ["true", "1", "on", "sim"]) {
      const s = parseContactRequest({ ...base, urgente: v })
      expect(s.status === "ok" && s.request.urgente).toBe(true)
    }
  })

  it("leaves urgente unset for falsy / unknown values (backward compatible)", () => {
    for (const v of [undefined, false, "false", "0", "", 1, { yes: true }]) {
      const r = parseContactRequest({ ...base, urgente: v })
      expect(r.status === "ok" && r.request.urgente).toBeUndefined()
    }
    const legacy = parseContactRequest(base)
    expect(legacy.status === "ok" && legacy.request.modelo).toBeUndefined()
  })

  it("rejects an over-long modelo", () => {
    expect(parseContactRequest({ ...base, modelo: "x".repeat(201) })).toEqual({
      status: "invalid",
      message: "modelo is too long",
    })
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

  it("sends urgent assistência requests with the [URGENTE] subject and the extra fields", async () => {
    const create = jest.fn().mockResolvedValue([{ status: "success" }])
    await sendContactRequest(
      {
        ...request,
        kind: "assistencia",
        productTitle: "Assistência Técnica",
        sku: undefined,
        modelo: "LVC-21",
        urgente: true,
      },
      deps(create)
    )
    const staff = create.mock.calls[0][0]
    expect(staff.data.emailOptions.subject).toBe(
      "[URGENTE] Pedido de assistência técnica — Ana, Hotel Central"
    )
    expect(staff.data).toMatchObject({ modelo: "LVC-21", urgente: true })
    // The customer acknowledgement stays as before.
    expect(create.mock.calls[1][0].data.emailOptions.subject).toBe("Recebemos o seu pedido — Higitotal")
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

describe("parseQuoteItems", () => {
  it("is absent for missing, non-array or empty input", () => {
    expect(parseQuoteItems(undefined)).toEqual({ status: "ok" })
    expect(parseQuoteItems("x")).toEqual({ status: "ok" })
    expect(parseQuoteItems({ 0: { sku: "A" } })).toEqual({ status: "ok" })
    expect(parseQuoteItems([])).toEqual({ status: "ok" })
  })

  it("trims and keeps only the known fields", () => {
    const r = parseQuoteItems([
      {
        sku: " DX1002 ",
        title: " Drip Floor (2L) ",
        quantity: 3,
        note: "  caixas de 6 ",
        url: "https://store.higitotal.pt/pt/products/dx1002",
        price: 12,
        evil: "<script>",
      },
    ])
    expect(r).toEqual({
      status: "ok",
      items: [
        {
          sku: "DX1002",
          title: "Drip Floor (2L)",
          quantity: 3,
          note: "caixas de 6",
          url: "https://store.higitotal.pt/pt/products/dx1002",
        },
      ],
    })
  })

  it("caps lengths and flattens newlines", () => {
    const r = parseQuoteItems([
      { sku: "S".repeat(150), title: "T".repeat(400), note: "linha 1\r\nlinha 2 " + "n".repeat(400), quantity: 1 },
    ])
    const item = r.status === "ok" ? r.items![0] : undefined
    expect(item!.sku).toHaveLength(ITEM_LIMITS.sku)
    expect(item!.title).toHaveLength(ITEM_LIMITS.title)
    expect(item!.note!.length).toBeLessThanOrEqual(ITEM_LIMITS.note)
    expect(item!.note).toMatch(/^linha 1 linha 2 n/)
  })

  it("clamps quantities to an integer 1–9999", () => {
    const q = (quantity: unknown) => {
      const r = parseQuoteItems([{ sku: "A", quantity }])
      return r.status === "ok" ? r.items![0].quantity : undefined
    }
    expect(q(5)).toBe(5)
    expect(q(2.9)).toBe(2)
    expect(q("12")).toBe(12)
    expect(q(0)).toBe(1)
    expect(q(-4)).toBe(1)
    expect(q(100000)).toBe(9999)
    expect(q("abc")).toBe(1)
    expect(q(undefined)).toBe(1)
    expect(q(Infinity)).toBe(1)
    expect(itemQuantity(MAX_ITEM_QUANTITY + 1)).toBe(MAX_ITEM_QUANTITY)
  })

  it("only keeps product links on the public storefront hosts", () => {
    const url = (u: unknown) => {
      const r = parseQuoteItems([{ sku: "A", quantity: 1, url: u }])
      return r.status === "ok" ? r.items![0].url : undefined
    }
    expect(url("https://store.higitotal.pt/pt/products/a")).toBe("https://store.higitotal.pt/pt/products/a")
    expect(url("https://www.higitotal.pt/pt/products/a")).toBe("https://www.higitotal.pt/pt/products/a")
    expect(url("http://store.higitotal.pt/pt/products/a")).toBeUndefined()
    expect(url("https://store.higitotal.pt.evil.com/x")).toBeUndefined()
    expect(url("https://store.higitotal.pt@evil.com/x")).toBeUndefined()
    expect(url("https://evil.com/?https://store.higitotal.pt/")).toBeUndefined()
    expect(url("javascript:alert(1)")).toBeUndefined()
    expect(url("http://localhost:8000/pt/products/a")).toBeUndefined()
    expect(url(42)).toBeUndefined()
  })

  it("drops entries that are not objects or have neither title nor sku", () => {
    const r = parseQuoteItems([null, "x", 3, [], { quantity: 2, note: "só nota" }, { title: "Só título" }])
    expect(r).toEqual({ status: "ok", items: [{ title: "Só título", quantity: 1 }] })
    expect(parseQuoteItems([{ note: "x" }])).toEqual({ status: "ok" })
  })

  it("rejects more than 100 entries", () => {
    const ok = Array.from({ length: MAX_QUOTE_ITEMS }, (_, i) => ({ sku: `S${i}`, quantity: 1 }))
    expect(parseQuoteItems(ok).status).toBe("ok")
    expect(parseQuoteItems([...ok, { sku: "X", quantity: 1 }])).toEqual({
      status: "invalid",
      message: "at most 100 items are allowed",
    })
  })
})

describe("parseContactRequest with a quote list", () => {
  const base = { name: "Ana", email: "ana@empresa.pt", phone: "912345678" }
  const items = [
    { sku: "DX1002", title: "Drip Floor (2L)", quantity: 3, url: "https://store.higitotal.pt/pt/products/dx1002" },
    { sku: "SU100", title: "Suma Bac D10", quantity: 12, note: "Urgente para março" },
  ]

  it("accepts items alongside the usual fields", () => {
    const r = parseContactRequest({ ...base, kind: "produto", empresa: "Hotel Central", items })
    expect(r.status).toBe("ok")
    expect(r.status === "ok" && r.request.items).toEqual(items)
    expect(r.status === "ok" && r.request.kind).toBe("produto")
  })

  it("infers a product request from the items when the kind is missing", () => {
    const r = parseContactRequest({ ...base, items })
    expect(r.status === "ok" && r.request.kind).toBe("produto")
  })

  it("rejects an oversized list (400)", () => {
    const many = Array.from({ length: 101 }, (_, i) => ({ sku: `S${i}`, quantity: 1 }))
    expect(parseContactRequest({ ...base, items: many })).toEqual({
      status: "invalid",
      message: "at most 100 items are allowed",
    })
  })

  it("still needs a name and a valid e-mail", () => {
    expect(parseContactRequest({ email: "ana@empresa.pt", items }).status).toBe("invalid")
    expect(parseContactRequest({ name: "Ana", email: "ana@", items }).status).toBe("invalid")
    // the list itself replaces the phone-or-message requirement
    expect(parseContactRequest({ name: "Ana", email: "ana@empresa.pt", items }).status).toBe("ok")
  })

  it("leaves items unset for the legacy single-product payload", () => {
    const r = parseContactRequest({ ...base, productTitle: "Drip Floor", sku: "DX1002", quantity: 2 })
    expect(r.status === "ok" && r.request.items).toBeUndefined()
  })
})

describe("buildStaffSubject for a quote list", () => {
  const items = [
    { sku: "A", quantity: 1 },
    { sku: "B", quantity: 2 },
    { sku: "C", quantity: 1 },
    { sku: "D", quantity: 1 },
    { sku: "E", quantity: 9 },
  ]

  it("counts the products and names the company", () => {
    expect(buildStaffSubject({ kind: "produto", name: "Ana Silva", empresa: "Hotel Central", items })).toBe(
      "Pedido de orçamento — 5 produtos — Hotel Central"
    )
  })

  it("falls back to the customer name, singular for one product", () => {
    expect(buildStaffSubject({ kind: "produto", name: "Ana Silva", items: items.slice(0, 1) })).toBe(
      "Pedido de orçamento — 1 produto — Ana Silva"
    )
  })

  it("keeps the [URGENTE] prefix rule and header safety", () => {
    expect(buildStaffSubject({ kind: "produto", name: "Ana", urgente: true, items })).toBe(
      "[URGENTE] Pedido de orçamento — 5 produtos — Ana"
    )
    expect(buildStaffSubject({ kind: "produto", name: "Ana", empresa: "X\r\nBcc: y@z", items })).not.toMatch(/[\r\n]/)
  })

  it("ignores an empty list", () => {
    expect(buildStaffSubject({ kind: "produto", name: "Ana", productTitle: "Drip Floor", items: [] })).toBe(
      "Pedido de orçamento: Drip Floor — Ana"
    )
  })
})

describe("buildAckParagraphs for a quote list", () => {
  it("thanks for the list instead of a single product", () => {
    expect(buildAckParagraphs({ name: "Ana", kind: "produto", productTitle: "x", itemCount: 3 })[1]).toBe(
      "Obrigado pelo seu pedido de orçamento de 3 produtos, que resumimos abaixo. A nossa equipa comercial responderá em dias úteis."
    )
  })
})

describe("sendContactRequest with a quote list", () => {
  it("sends the items to staff (subject with the count) and to the customer without links", async () => {
    const create = jest.fn().mockResolvedValue([{ status: "success" }])
    const items = [
      { sku: "DX1002", title: "Drip Floor (2L)", quantity: 3, url: "https://store.higitotal.pt/pt/products/dx1002" },
      { sku: "SU100", title: "Suma Bac D10", quantity: 12, note: "caixas" },
    ]
    await sendContactRequest(
      { kind: "produto", name: "Ana", email: "ana@empresa.pt", phone: "912345678", empresa: "Hotel Central", items },
      { notification: { createNotifications: create }, logger: { warn: jest.fn() }, to: "vendas@higitotal.pt" }
    )
    const staff = create.mock.calls[0][0]
    expect(staff.data.emailOptions.subject).toBe("Pedido de orçamento — 2 produtos — Hotel Central")
    expect(staff.data.items).toEqual(items)
    const ack = create.mock.calls[1][0]
    expect(ack.data.items).toEqual([
      { sku: "DX1002", title: "Drip Floor (2L)", quantity: 3 },
      { sku: "SU100", title: "Suma Bac D10", quantity: 12, note: "caixas" },
    ])
    expect(ack.data.items[0].url).toBeUndefined()
  })
})
