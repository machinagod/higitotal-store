/**
 * Copy + small pure helpers for the contact-request e-mails (staff notification
 * and customer acknowledgement). Kept free of React so it can be unit-tested
 * and shared by the store route and the templates. pt-PT.
 */

/** What a request is about. */
export type ContactRequestKind = 'produto' | 'assistencia' | 'geral'

export const CONTACT_REQUEST_KINDS: readonly ContactRequestKind[] = ['produto', 'assistencia', 'geral']

/** Title the assistência form has always sent (kept for older storefronts). */
export const ASSISTANCE_TITLE = 'Assistência Técnica'

/** Public company details used in the customer-facing e-mail footer. */
export const COMPANY_INFO = {
  legalName: 'Higitotal — Sistemas e Produtos de Higiene, Lda.',
  address: 'Zona Industrial, Rua J, n.º 137, 5370-565 Mirandela, Portugal',
  nipc: '504297040',
  phone: '+351 278 262 913',
  phoneCostNote: 'chamada para a rede fixa nacional',
  email: 'higitotal@higitotal.pt',
  website: 'https://higitotal.pt',
} as const

export const isContactRequestKind = (v: unknown): v is ContactRequestKind =>
  typeof v === 'string' && (CONTACT_REQUEST_KINDS as readonly string[]).includes(v)

/**
 * Explicit `kind` wins; otherwise infer it from the legacy payload: the
 * assistência form's fixed title → assistencia, any product reference →
 * produto, else a general enquiry.
 */
export function inferContactKind(input: {
  kind?: unknown
  productTitle?: string | null
  sku?: string | null
}): ContactRequestKind {
  if (isContactRequestKind(input.kind)) return input.kind
  const title = (input.productTitle ?? '').trim()
  if (title.toLowerCase() === ASSISTANCE_TITLE.toLowerCase()) return 'assistencia'
  if (title || (input.sku ?? '').trim()) return 'produto'
  return 'geral'
}

export const STAFF_HEADINGS: Record<ContactRequestKind, string> = {
  produto: 'Novo pedido de orçamento',
  assistencia: 'Novo pedido de assistência técnica',
  geral: 'Novo pedido de contacto',
}

export const STAFF_INTROS: Record<ContactRequestKind, string> = {
  produto: 'Um cliente pediu um orçamento a partir do site Higitotal.',
  assistencia: 'Um cliente pediu assistência técnica a partir do site Higitotal.',
  geral: 'Um cliente enviou um pedido de contacto a partir do site Higitotal.',
}

/** "telefone" → "Telefone", "email" → "E-mail"; unknown values capitalised. */
export function contactPrefLabel(pref?: string | null): string | undefined {
  const p = (pref ?? '').trim().toLowerCase()
  if (!p) return undefined
  if (p === 'telefone' || p === 'phone') return 'Telefone'
  if (p === 'email' || p === 'e-mail') return 'E-mail'
  return p.charAt(0).toUpperCase() + p.slice(1)
}

/** Header-safe single line, trimmed to `max` characters. */
export function oneLine(value: string | null | undefined, max = 120): string {
  const s = (value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

/** Staff e-mail subject, e.g. "Pedido de orçamento: Drip Floor (2L) — Ana Silva, Hotel Central". */
export function buildStaffSubject(input: {
  kind: ContactRequestKind
  name: string
  empresa?: string | null
  productTitle?: string | null
}): string {
  const who = [oneLine(input.name, 80), oneLine(input.empresa, 80)].filter(Boolean).join(', ')
  const product = oneLine(input.productTitle, 90)
  switch (input.kind) {
    case 'produto':
      return product ? `Pedido de orçamento: ${product} — ${who}` : `Pedido de orçamento — ${who}`
    case 'assistencia':
      return `Pedido de assistência técnica — ${who}`
    default:
      return `Pedido de contacto — ${who}`
  }
}

export const ACK_SUBJECT = 'Recebemos o seu pedido — Higitotal'

/** Body paragraphs of the customer acknowledgement. */
export function buildAckParagraphs(input: {
  name: string
  kind: ContactRequestKind
  productTitle?: string | null
}): string[] {
  const product = input.kind === 'produto' ? oneLine(input.productTitle, 160) : ''
  const team = input.kind === 'assistencia' ? 'técnica' : 'comercial'
  return [
    `Olá, ${oneLine(input.name, 80)}.`,
    `Obrigado pelo seu contacto${product ? ` sobre ${product}` : ''}. A nossa equipa ${team} responderá em dias úteis.`,
    `Para assuntos urgentes: ${COMPANY_INFO.phone} (${COMPANY_INFO.phoneCostNote}).`,
  ]
}
