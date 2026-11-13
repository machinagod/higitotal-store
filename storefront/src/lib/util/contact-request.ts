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

/**
 * The query string without the enquiry param (leading "?" included when
 * anything is left), so a refresh after the deep link doesn't reopen the form.
 */
export function searchWithoutEnquiryParam(search: string): string {
  const params = new URLSearchParams(search)
  params.delete(ENQUIRY_PARAM)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/** Neutral prefilled message when the enquiry is about a specific product. */
export const PRODUCT_ENQUIRY_MESSAGE =
  "Gostaria de receber informação sobre preço, disponibilidade e condições deste produto."

/** Prefilled message of the quote-list form (`/orcamento`); unchanged it counts as empty. */
export const QUOTE_LIST_MESSAGE =
  "Gostaria de receber uma proposta para os produtos e quantidades indicados."

/** One line of a quote list in the request body (see lib/quote-list). */
export type ContactRequestItem = {
  sku?: string
  title: string
  quantity: number
  note?: string
  url?: string
}

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
  /** Assistência: equipment model / serial number. */
  modelo?: string | null
  /** Assistência: equipment stopped (urgent). Checkbox values ("on") count as true. */
  urgente?: boolean | string | null
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
  /** Quote list lines (`/orcamento`); omitted when empty. */
  items?: ContactRequestItem[]
  /**
   * Message actually sent, when it differs from what the user typed (the
   * assistência form prefixes the service type / equipment). Defaults to
   * `fields.message`.
   */
  message?: string
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
  modelo?: string
  /** Only present (true) when the equipment is stopped. */
  urgente?: true
  company?: string
  productTitle?: string
  sku?: string
  quantity?: number
  productUrl?: string
  items?: ContactRequestItem[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clean = (v: string | null | undefined): string | undefined => {
  const s = (v ?? "").trim()
  return s ? s : undefined
}

/** Collapses whitespace / case so a re-wrapped prefilled message still compares equal. */
const normalise = (v: string | null | undefined) =>
  (v ?? "").replace(/\s+/g, " ").trim().toLowerCase()

/** Checkbox / JSON truthiness for the `urgente` flag. */
export function isTruthyFlag(v: unknown): boolean {
  if (v === true) return true
  if (typeof v !== "string") return false
  return ["1", "true", "on", "sim", "yes"].includes(v.trim().toLowerCase())
}

/** Fields the validator can flag (also the form control names). */
export type ContactRequestField = "name" | "email" | "phone" | "message"

export type ContactRequestProblem = {
  /** Form field to mark invalid / focus. */
  field: ContactRequestField
  message: string
}

export type ValidateOptions = {
  /**
   * Text the message box is prefilled with (product enquiry). Left unchanged
   * it says nothing about the request, so it counts as empty for the
   * "telefone ou mensagem" rule.
   */
  prefilledMessage?: string
  /** How the message is asked for in errors (assistência: "descreva o pedido"). */
  messageHint?: string
}

/** Minimum digits for a phone number (PT numbers have 9). */
export const MIN_PHONE_DIGITS = 9

/**
 * Client-side checks, in form order. Mirrors the backend (name + valid e-mail,
 * and a phone or a message) and adds lead-quality rules the backend doesn't
 * enforce (older storefronts must keep working):
 *  - a phone is required when "Telefone" is the preferred contact;
 *  - a phone, when given, needs at least 9 digits;
 *  - an unchanged prefilled message counts as no message.
 * Returns every problem (pt-PT); empty when valid.
 */
export function validateContactRequestAll(
  f: ContactRequestFields,
  opts: ValidateOptions = {}
): ContactRequestProblem[] {
  const problems: ContactRequestProblem[] = []
  if (!clean(f.name)) {
    problems.push({ field: "name", message: "Indique o seu nome." })
  }

  const email = clean(f.email)
  if (!email) {
    problems.push({ field: "email", message: "Indique o seu e-mail." })
  } else if (!EMAIL_RE.test(email)) {
    problems.push({
      field: "email",
      message: "Indique um e-mail válido (ex.: nome@empresa.pt).",
    })
  }

  const phone = clean(f.phone)
  const message = clean(f.message)
  const hasMessage =
    !!message &&
    !(
      opts.prefilledMessage &&
      normalise(message) === normalise(opts.prefilledMessage)
    )
  const pref = normalise(f.contactPref)
  const hint = opts.messageHint ?? "escreva uma mensagem"

  if (phone && phone.replace(/\D/g, "").length < MIN_PHONE_DIGITS) {
    problems.push({
      field: "phone",
      message: "Indique um telefone válido, com pelo menos 9 dígitos.",
    })
  } else if (!phone && pref === "telefone") {
    problems.push({
      field: "phone",
      message:
        "Indique um telefone ou escolha E-mail como forma de contacto preferida.",
    })
  } else if (!phone && !hasMessage) {
    problems.push({
      // With e-mail preferred the natural fix is the message.
      field: pref === "email" ? "message" : "phone",
      message: `Indique um telefone ou ${hint}.`,
    })
  }
  return problems
}

/** First problem only (see validateContactRequestAll), or null when valid. */
export function validateContactRequest(
  f: ContactRequestFields,
  opts: ValidateOptions = {}
): ContactRequestProblem | null {
  return validateContactRequestAll(f, opts)[0] ?? null
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
    message: clean(ctx.message ?? f.message),
    modelo: clean(f.modelo),
    urgente: isTruthyFlag(f.urgente) ? true : undefined,
    company: clean(f.company),
    productTitle: clean(ctx.productTitle),
    sku: clean(ctx.sku),
    quantity:
      typeof ctx.quantity === "number" && Number.isFinite(ctx.quantity)
        ? ctx.quantity
        : undefined,
    productUrl: clean(ctx.productUrl),
    items: ctx.items?.length ? ctx.items : undefined,
  }
  // Drop undefined keys so the JSON body stays minimal.
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  ) as ContactRequestPayload
}

/**
 * Assistência: the message the team receives — service type and equipment as
 * header lines, then the customer's own description.
 */
export function buildAssistanceMessage(input: {
  tipo?: string | null
  equipamento?: string | null
  descricao?: string | null
}): string | undefined {
  const tipo = clean(input.tipo)
  const equipamento = clean(input.equipamento)
  const descricao = clean(input.descricao)
  const head = [
    tipo ? `Tipo de serviço: ${tipo}` : null,
    equipamento ? `Equipamento / marca: ${equipamento}` : null,
  ].filter(Boolean)
  const out = [head.join("\n"), descricao].filter(Boolean).join("\n\n")
  return out || undefined
}

/**
 * Compact opening hours for tight spots (PDP call button):
 * "Segunda a sexta, 9h00–12h30 e 14h00–18h30" → "Seg–Sex 9h00–12h30 · 14h00–18h30".
 * Unknown formats are returned unchanged.
 */
export function shortHours(hours: string): string {
  const m = hours.match(/^\s*segunda\s+a\s+sexta,?\s+(.+)$/i)
  if (!m) return hours
  return `Seg–Sex ${m[1].replace(/\s+e\s+/g, " · ").trim()}`
}
