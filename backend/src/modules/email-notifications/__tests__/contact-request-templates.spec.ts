import { PassThrough } from "stream"
import { renderToPipeableStream } from "react-dom/server"
import { createElement, ReactElement } from "react"

/**
 * @react-email/render loads react-dom/server through a dynamic import, which
 * jest (CommonJS, no --experimental-vm-modules) cannot run. Same idea here:
 * stream the tree and wait for every suspended part (the Tailwind wrapper
 * suspends while it builds its CSS) before reading the HTML.
 */
const render = (el: ReactElement) =>
  new Promise<string>((resolve, reject) => {
    let html = ""
    const sink = new PassThrough()
    sink.on("data", (chunk) => (html += chunk))
    sink.on("end", () => resolve(html))
    const { pipe } = renderToPipeableStream(el, {
      onAllReady: () => pipe(sink),
      onError: reject,
    })
  })

import { ContactRequestEmail } from "../templates/contact-request"
import { ContactRequestAckEmail } from "../templates/contact-request-ack"

const items = [
  {
    sku: "DX1002",
    title: "Drip Floor (2L)",
    quantity: 3,
    url: "https://store.higitotal.pt/pt/products/dx1002",
  },
  { sku: "SU100", title: "Suma Bac D10 <b>", quantity: 12, note: "Entrega em março" },
]

const customer = {
  kind: "produto" as const,
  name: "Ana Silva",
  email: "ana@empresa.pt",
  phone: "912345678",
  empresa: "Hotel Central",
}

/** Text content without tags / entities, collapsed (React may split text nodes with comments). */
const text = (html: string) =>
  html
    .replace(/<!--.*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")

describe("ContactRequestEmail (staff) with a quote list", () => {
  it("renders the heading with the count and a Ref.ª / Produto / Quantidade / Nota table", async () => {
    const html = await render(createElement(ContactRequestEmail, { ...customer, items }))
    const t = text(html)
    expect(t).toContain("Novo pedido de orçamento — 2 produtos")
    expect(t).toMatch(/Ref\.ª Produto Quantidade Nota/)
    expect(t).toMatch(/DX1002 Drip Floor \(2L\) 3/)
    expect(t).toMatch(/SU100 Suma Bac D10 <b> 12 Entrega em março/)
    // The product is linked; the title is escaped, not injected as markup.
    expect(html).toContain('href="https://store.higitotal.pt/pt/products/dx1002"')
    expect(html).not.toContain("D10 <b>")
    // No single-product rows when a list is present.
    expect(t).not.toContain("Quantidade (carrinho)")
  })

  it("still renders the single-product layout without items", async () => {
    const html = await render(
      createElement(ContactRequestEmail, { ...customer, productTitle: "Drip Floor (2L)", sku: "DX1002" })
    )
    const t = text(html)
    expect(t).toContain("Novo pedido de orçamento")
    expect(t).toContain("Produto: Drip Floor (2L)")
    expect(html).not.toContain('data-testid="quote-items"')
  })
})

describe("ContactRequestAckEmail (customer) with a quote list", () => {
  it("lists every product with its quantity and note, without links", async () => {
    const html = await render(
      createElement(ContactRequestAckEmail, {
        name: "Ana Silva",
        kind: "produto",
        items: items.map(({ url: _url, ...rest }) => rest),
      })
    )
    const t = text(html)
    expect(t).toContain("pedido de orçamento de 2 produtos")
    expect(t).toMatch(/Drip Floor \(2L\) · Ref\.ª DX1002 3 un\./)
    expect(t).toMatch(/Suma Bac D10 <b> · Ref\.ª SU100 Nota: Entrega em março 12 un\./)
    expect(html).not.toContain("store.higitotal.pt/pt/products")
  })

  it("keeps the single-product acknowledgement", async () => {
    const html = await render(
      createElement(ContactRequestAckEmail, { name: "Ana", kind: "produto", productTitle: "Drip Floor (2L)" })
    )
    expect(text(html)).toContain("Obrigado pelo seu contacto sobre Drip Floor (2L).")
    expect(html).not.toContain('data-testid="ack-items"')
  })
})
