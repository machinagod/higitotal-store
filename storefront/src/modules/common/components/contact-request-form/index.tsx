"use client"

import { clx } from "@medusajs/ui"
import { Check, ImageIcon } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"

import {
  buildContactRequestPayload,
  CONTACT_ERROR_MESSAGE,
  CONTACT_SUCCESS_MESSAGE,
  ContactRequestFields,
  ContactRequestItem,
  ContactRequestKind,
  ContactRequestPayload,
  PRODUCT_ENQUIRY_MESSAGE,
  validateContactRequestAll,
} from "@lib/util/contact-request"

import {
  ContactPrefField,
  ErrorSummary,
  FieldError,
  FieldLabel,
  fieldClass,
  Honeypot,
  PrivacyNote,
  submitContactRequest,
  useFieldErrors,
} from "./fields"

export type EnquiryProduct = {
  title: string
  sku?: string
  thumbnail?: string | null
  /** Cart quantity selected on the PDP (non-catalog mode only). */
  quantity?: number
}

type Props = {
  kind: ContactRequestKind
  /** Product the enquiry is about — shows the product row + quantity field. */
  product?: EnquiryProduct
  /** Unique prefix for input ids (several forms can share a page). */
  idPrefix?: string
  /** Focus the first field on mount. */
  autoFocus?: boolean
  /** Placeholder for the message when there is no product context. */
  messagePlaceholder?: string
  /** Rendered under the success message (e.g. a "Fechar" button). */
  successAction?: React.ReactNode
  /** Called once the request was sent, with the body that was posted. */
  onSuccess?: (payload: ContactRequestPayload) => void
  /**
   * Quote list (`/orcamento`): lines read at submit time and sent as `items`.
   * An empty result sends a plain request.
   */
  getItems?: () => ContactRequestItem[]
  /**
   * Text the message box starts with; left unchanged it doesn't count as a
   * message. Defaults to the product enquiry text when `product` is set.
   */
  prefilledMessage?: string
  /** Submit button label (default "Enviar pedido"). */
  submitLabel?: string
  /**
   * "sheet": inside a scrolling dialog — the submit button sticks to the
   * bottom of the dialog (safe-area aware) so it is always reachable.
   */
  layout?: "inline" | "sheet"
  className?: string
}

const GENERAL_PLACEHOLDER =
  "Em que podemos ajudar? Indique produtos, quantidades ou outras informações úteis."

/** Field values as the validator / payload builder expect them. */
const readFields = (form: HTMLFormElement): ContactRequestFields => {
  const fd = new FormData(form)
  const get = (k: string) => (fd.get(k) as string | null) ?? undefined
  return {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    empresa: get("empresa"),
    localidade: get("localidade"),
    quantidadeEstimada: get("quantidadeEstimada"),
    contactPref: get("contactPref"),
    message: get("message"),
    company: get("company"),
  }
}

/**
 * Enquiry form ("Pedir orçamento"). Posts to the backend
 * `POST /store/contact-request`, which e-mails the sales team and sends the
 * customer an acknowledgement. Used inline on the contact page and inside the
 * product page's ContactModal. Inline errors per field (aria-invalid +
 * aria-describedby), a summary when there are several. pt-PT.
 */
export default function ContactRequestForm({
  kind,
  product,
  idPrefix = "crf",
  autoFocus = false,
  messagePlaceholder = GENERAL_PLACEHOLDER,
  successAction,
  onSuccess,
  getItems,
  prefilledMessage: prefilledProp,
  submitLabel = "Enviar pedido",
  layout = "inline",
  className,
}: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  )
  const [pref, setPref] = useState("telefone")
  const firstRef = useRef<HTMLInputElement>(null)
  const id = (name: string) => `${idPrefix}-${name}`
  const prefilledMessage =
    prefilledProp ?? (product ? PRODUCT_ENQUIRY_MESSAGE : undefined)

  const errors = useFieldErrors(idPrefix, (form) =>
    validateContactRequestAll(readFields(form), {
      prefilledMessage,
      hasItems: (getItems?.().length ?? 0) > 0,
    })
  )

  useEffect(() => {
    if (autoFocus) firstRef.current?.focus({ preventScroll: true })
  }, [autoFocus])

  const onChange = (e: React.FormEvent<HTMLFormElement>) => {
    const t = e.target as HTMLInputElement
    if (t.name === "contactPref") setPref(t.value)
    errors.onChange(e)
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    if (!errors.check(form)) return

    setStatus("sending")
    try {
      const payload = buildContactRequestPayload(readFields(form), {
        kind,
        productTitle: product?.title,
        sku: product?.sku,
        quantity: product?.quantity,
        productUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
        items: getItems?.(),
      })
      await submitContactRequest(payload)
      setStatus("done")
      onSuccess?.(payload)
    } catch {
      setStatus("error")
    }
  }

  if (status === "done") {
    return (
      <div
        className={clx("flex flex-col items-start py-2", className)}
        role="status"
        data-testid="contact-request-success"
      >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="text-base font-semibold leading-relaxed text-brand-ink">
          {CONTACT_SUCCESS_MESSAGE}
        </p>
        {successAction}
      </div>
    )
  }

  const sheet = layout === "sheet"
  // Paired fields go two-up from 360px; name / e-mail from 512px.
  const pair = "col-span-2 min-[360px]:col-span-1"
  const wide = "col-span-2 xsmall:col-span-1"

  return (
    <form
      className={clx("flex flex-col gap-3.5", className)}
      onSubmit={submit}
      onChange={onChange}
      noValidate
      data-testid="contact-request-form"
    >
      <ErrorSummary problems={errors.problems} fieldId={(f) => id(f)} />

      {product && (
        <div
          className="flex items-center gap-3 rounded-btn border border-hairline bg-[#f7f9fa] p-2.5"
          data-testid="contact-request-product"
        >
          <div className="relative h-12 w-12 flex-none overflow-hidden rounded-[10px] border border-hairline bg-white">
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt=""
                fill
                sizes="48px"
                className="object-contain p-1 mix-blend-multiply"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-brand-cyan/60">
                <ImageIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-bold leading-snug text-brand-ink">
              {product.title}
            </p>
            {product.sku && (
              <p className="mt-0.5 text-xs font-medium text-grey-50">
                Ref.ª {product.sku}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
        <div className={wide}>
          <FieldLabel htmlFor={id("name")} required>
            Nome
          </FieldLabel>
          <input
            ref={firstRef}
            id={id("name")}
            name="name"
            required
            autoComplete="name"
            className={fieldClass}
            {...errors.a11y("name")}
          />
          <FieldError id={errors.errorId("name")} message={errors.messageFor("name")} />
        </div>
        <div className={wide}>
          <FieldLabel htmlFor={id("email")} required>
            E-mail
          </FieldLabel>
          <input
            id={id("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="nome@empresa.pt"
            className={fieldClass}
            {...errors.a11y("email")}
          />
          <FieldError id={errors.errorId("email")} message={errors.messageFor("email")} />
        </div>
        <div className={pair}>
          <FieldLabel htmlFor={id("phone")} required={pref === "telefone"}>
            Telefone
          </FieldLabel>
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className={fieldClass}
            {...errors.a11y("phone")}
          />
          <FieldError id={errors.errorId("phone")} message={errors.messageFor("phone")} />
        </div>
        {product && (
          <div className={pair}>
            <FieldLabel htmlFor={id("quantidade")}>Quantidade estimada</FieldLabel>
            <input
              id={id("quantidade")}
              name="quantidadeEstimada"
              placeholder="Ex.: 20 caixas"
              defaultValue={
                product.quantity && product.quantity > 1
                  ? String(product.quantity)
                  : undefined
              }
              className={fieldClass}
            />
          </div>
        )}
        <div className={pair}>
          <FieldLabel htmlFor={id("empresa")}>Empresa</FieldLabel>
          <input
            id={id("empresa")}
            name="empresa"
            autoComplete="organization"
            className={fieldClass}
          />
        </div>
        <div className={product ? pair : "col-span-2"}>
          <FieldLabel htmlFor={id("localidade")}>Localidade</FieldLabel>
          <input
            id={id("localidade")}
            name="localidade"
            autoComplete="address-level2"
            className={fieldClass}
          />
        </div>
      </div>

      <ContactPrefField idPrefix={idPrefix} />

      <div>
        <FieldLabel htmlFor={id("message")}>Mensagem</FieldLabel>
        <textarea
          id={id("message")}
          name="message"
          rows={product ? 2 : prefilledMessage ? 3 : 5}
          defaultValue={prefilledMessage}
          placeholder={prefilledMessage ? undefined : messagePlaceholder}
          className={clx(fieldClass, product ? "min-h-[72px]" : "min-h-[96px]", "resize-y")}
          {...errors.a11y("message")}
        />
        <FieldError id={errors.errorId("message")} message={errors.messageFor("message")} />
      </div>

      <Honeypot />

      {sheet && <PrivacyNote />}

      <div
        className={clx(
          sheet &&
            "sticky bottom-0 z-[1] -mx-5 mt-auto border-t border-hairline bg-white px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 small:-mx-7 small:px-7 small:pb-5"
        )}
        data-testid="contact-request-actions"
      >
        {status === "error" && (
          <p role="alert" className="mb-2 text-sm font-medium text-rose-700">
            {CONTACT_ERROR_MESSAGE}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          data-testid="contact-request-submit"
          className="flex h-12 w-full items-center justify-center rounded-pill bg-brand-cyan px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:bg-brand-cyan-ink disabled:opacity-60"
        >
          {status === "sending" ? "A enviar…" : submitLabel}
        </button>
      </div>

      {!sheet && <PrivacyNote />}
    </form>
  )
}
