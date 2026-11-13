import type { CreateNotificationDTO } from '@medusajs/framework/types'
import {
  ACK_SUBJECT,
  ContactRequestKind,
  buildStaffSubject,
  inferContactKind,
} from '../../../modules/email-notifications/contact-request-copy'

/** Template keys (kept as literals so this module stays free of React/JSX). */
export const CONTACT_REQUEST_TEMPLATE = 'contact-request'
export const CONTACT_REQUEST_ACK_TEMPLATE = 'contact-request-ack'

/** Raw request body. Every field is optional/untrusted. */
export type ContactRequestBody = {
  kind?: unknown
  name?: unknown
  email?: unknown
  phone?: unknown
  empresa?: unknown
  localidade?: unknown
  quantidadeEstimada?: unknown
  contactPref?: unknown
  message?: unknown
  productTitle?: unknown
  sku?: unknown
  quantity?: unknown
  productUrl?: unknown
  /** Assistência: equipment model / serial number. */
  modelo?: unknown
  /** Assistência: equipment stopped (true / "true" / "1" / "on" / "sim"). */
  urgente?: unknown
  /** Honeypot — bots fill hidden fields; humans don't. */
  company?: unknown
}

export type ContactRequest = {
  kind: ContactRequestKind
  name: string
  email: string
  phone?: string
  empresa?: string
  localidade?: string
  quantidadeEstimada?: string
  contactPref?: string
  message?: string
  productTitle?: string
  sku?: string
  quantity?: number
  productUrl?: string
  modelo?: string
  /** Only set (true) when the customer flagged the equipment as stopped. */
  urgente?: boolean
}

/** Discriminated by `status` (the backend tsconfig is not strict, so boolean tags don't narrow). */
export type ParseResult =
  | { status: 'honeypot' }
  | { status: 'ok'; request: ContactRequest }
  | { status: 'invalid'; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Max lengths per field; longer values are rejected (400). */
export const FIELD_LIMITS = {
  name: 200,
  email: 254,
  phone: 50,
  empresa: 200,
  localidade: 200,
  quantidadeEstimada: 100,
  contactPref: 20,
  message: 5000,
  productTitle: 300,
  sku: 100,
  productUrl: 2000,
  modelo: 200,
} as const

type LimitedField = keyof typeof FIELD_LIMITS

const str = (v: unknown): string | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  return s ? s : undefined
}

/** Checkbox / JSON truthiness for flags. */
const flag = (v: unknown): boolean =>
  v === true ||
  (typeof v === 'string' && ['1', 'true', 'on', 'sim', 'yes'].includes(v.trim().toLowerCase()))

/** Only absolute http(s) URLs end up as a link in the staff e-mail. */
const safeUrl = (v: string | undefined): string | undefined => {
  if (!v) return undefined
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : undefined
  } catch {
    return undefined
  }
}

/**
 * Validates and normalises a contact-request body. Backward compatible with
 * the original payload (name/email/phone/contactPref/message/productTitle/sku/
 * quantity/productUrl); `kind`, `empresa`, `localidade`,
 * `quantidadeEstimada`, `modelo` and `urgente` are optional additions.
 */
export function parseContactRequest(body: unknown): ParseResult {
  const b = (body && typeof body === 'object' ? body : {}) as ContactRequestBody

  if (str(b.company)) {
    return { status: 'honeypot' }
  }

  const fields = {} as Record<LimitedField, string | undefined>
  for (const key of Object.keys(FIELD_LIMITS) as LimitedField[]) {
    const value = str(b[key])
    if (value && value.length > FIELD_LIMITS[key]) {
      return { status: 'invalid', message: `${key} is too long` }
    }
    fields[key] = value
  }

  if (!fields.name || !fields.email || !EMAIL_RE.test(fields.email)) {
    return { status: 'invalid', message: 'name and a valid email are required' }
  }
  if (!fields.phone && !fields.message) {
    return { status: 'invalid', message: 'provide a phone or a message' }
  }

  const quantity =
    typeof b.quantity === 'number' && Number.isFinite(b.quantity) && b.quantity > 0
      ? Math.floor(b.quantity)
      : undefined

  const kind = inferContactKind({ kind: b.kind, productTitle: fields.productTitle, sku: fields.sku })

  return {
    status: 'ok',
    request: {
      kind,
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      empresa: fields.empresa,
      localidade: fields.localidade,
      quantidadeEstimada: fields.quantidadeEstimada,
      contactPref: fields.contactPref?.toLowerCase(),
      message: fields.message,
      productTitle: fields.productTitle,
      sku: fields.sku,
      quantity,
      productUrl: safeUrl(fields.productUrl),
      modelo: fields.modelo,
      urgente: flag(b.urgente) ? true : undefined,
    },
  }
}

/** Minimal slice of the notification module used here (eases testing). */
export type NotificationSender = {
  createNotifications(data: CreateNotificationDTO): Promise<unknown>
}

export type Logger = { warn(msg: string): void }

/** The notification module records a failed send instead of throwing. */
const hasFailure = (sent: unknown) =>
  [sent].flat().some((n) => (n as { status?: string } | undefined)?.status === 'failure')

export type SendOutcome = { ok: true; ackSent: boolean } | { ok: false }

/**
 * Sends the staff notification (reply-to = customer) and, only when that
 * succeeded, the customer acknowledgement. A failed acknowledgement is logged
 * and never fails the request.
 */
export async function sendContactRequest(
  request: ContactRequest,
  deps: { notification: NotificationSender; logger: Logger; to: string }
): Promise<SendOutcome> {
  const { notification, logger, to } = deps

  let staff: unknown
  try {
    staff = await notification.createNotifications({
      to,
      channel: 'email',
      template: CONTACT_REQUEST_TEMPLATE,
      data: {
        emailOptions: {
          subject: buildStaffSubject(request),
          // "Reply" in the sales inbox goes straight to the customer
          replyTo: request.email,
        },
        ...request,
      },
    })
  } catch {
    return { ok: false }
  }
  if (hasFailure(staff)) {
    return { ok: false }
  }

  try {
    const ack = await notification.createNotifications({
      to: request.email,
      channel: 'email',
      template: CONTACT_REQUEST_ACK_TEMPLATE,
      data: {
        emailOptions: {
          subject: ACK_SUBJECT,
          // Customer replies reach the team, not the no-reply sender
          replyTo: to,
        },
        name: request.name,
        kind: request.kind,
        productTitle: request.kind === 'produto' ? request.productTitle : undefined,
      },
    })
    if (hasFailure(ack)) {
      logger.warn(`contact-request: acknowledgement e-mail to customer failed (kind ${request.kind})`)
      return { ok: true, ackSent: false }
    }
  } catch (error) {
    logger.warn(
      `contact-request: acknowledgement e-mail to customer failed: ${(error as Error)?.message ?? error}`
    )
    return { ok: true, ackSent: false }
  }
  return { ok: true, ackSent: true }
}
