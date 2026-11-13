import { COMPANY } from "@lib/company"

/**
 * Shared logic for the enquiry / contact / assistência forms, which all post to
 * the backend `POST /store/contact-request` route. Framework-free so it can be
 * unit-tested; the React forms only collect fields and call these helpers.
 */

/** What the request is about — drives the staff email heading/subject. */
export type ContactRequestKind = "produto" | "assistencia" | "geral"

/** Query param that opens the enquiry form on a product page (`?pedido=1`). */
export const ENQUIRY_PARAM = "pedido"

/** Link to a product page with the enquiry form already open. */
export function productEnquiryHref(handle: string): string {
  return `/products/${handle}?${ENQUIRY_PARAM}=1`
}

/** True when the search params ask for the enquiry form to open. */
export function wantsEnquiryOpen(
  params: { get(name: string): string | null } | null | undefined
): boolean {
  const v = params?.get(ENQUIRY_PARAM)
  return v === "1" || v === "true"
}

/** Neutral prefilled message when the enquiry is about a specific product. */
export const PRODUCT_ENQUIRY_MESSAGE =
  "Gostaria de receber informação sobre preço, disponibilidade e condições deste produto."

export const CONTACT_SUCCESS_MESSAGE =
  "Obrigado. Recebemos o seu pedido e a nossa equipa comercial entrará em contacto consigo brevemente."

export const CONTACT_ERROR_MESSAGE = `Não foi possível enviar o pedido. Tente novamente ou ligue para ${
  COMPANY.phone.display
} (${COMPANY.phone.costNote.toLowerCase()}).`

export const PRIVACY_NOTE =
  "Os seus dados são usados apenas para responder a este pedido."

export const PRIVACY_POLICY_PATH = "/content/privacy-policy"

/** Raw values as collected from a form (FormData values are strings). */
export type ContactRequestFields = {
  name?: string | null
  email?: string | null
  phone?: string | null
  empresa?: string | null
  localidade?: string | null
  quantidadeEstimada?: string | null
  contactPref?: string | null
  message?: string | null
  /** Bot honeypot — must stay hidden and empty. */
  company?: string | null
}

export type ContactRequestContext = {
  kind: ContactRequestKind
  productTitle?: string
  sku?: string
  /** Cart quantity (non-catalog mode PDP). */
  quantity?: number
  productUrl?: string
}

export type ContactRequestPayload = {
  kind: ContactRequestKind
  name: string
  email: string
  phone?: string
  empresa?: string
  localidade?: string
  quantidadeEstimada?: string
  contactPref?: string
  message?: string
  company?: string
  productTitle?: string
  sku?: string
  quantity?: number
  productUrl?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clean = (v: string | null | undefined): string | undefined => {
  const s = (v ?? "").trim()
  return s ? s : undefined
}

export type ContactRequestProblem = {
  /** Form field to focus. */
  field: "name" | "email" | "phone"
  message: string
}

/**
 * Client-side check mirroring the backend rules (name + valid e-mail, and a
 * phone or a message). Returns the first problem (pt-PT), or null when valid.
 */
export function validateContactRequest(
  f: ContactRequestFields
): ContactRequestProblem | null {
  if (!clean(f.name)) return { field: "name", message: "Indique o seu nome." }
  const email = clean(f.email)
  if (!email || !EMAIL_RE.test(email)) {
    return { field: "email", message: "Indique um e-mail válido." }
  }
  if (!clean(f.phone) && !clean(f.message)) {
    return {
      field: "phone",
      message: "Indique um telefone ou escreva uma mensagem.",
    }
  }
  return null
}

/** Normalised request body for `POST /store/contact-request`. */
export function buildContactRequestPayload(
  f: ContactRequestFields,
  ctx: ContactRequestContext
): ContactRequestPayload {
  const payload: ContactRequestPayload = {
    kind: ctx.kind,
    name: clean(f.name) ?? "",
    email: clean(f.email) ?? "",
    phone: clean(f.phone),
    empresa: clean(f.empresa),
    localidade: clean(f.localidade),
    quantidadeEstimada: clean(f.quantidadeEstimada),
    contactPref: clean(f.contactPref),
    message: clean(f.message),
    company: clean(f.company),
    productTitle: clean(ctx.productTitle),
    sku: clean(ctx.sku),
    quantity:
      typeof ctx.quantity === "number" && Number.isFinite(ctx.quantity)
        ? ctx.quantity
        : undefined,
    productUrl: clean(ctx.productUrl),
  }
  // Drop undefined keys so the JSON body stays minimal.
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  ) as ContactRequestPayload
}
