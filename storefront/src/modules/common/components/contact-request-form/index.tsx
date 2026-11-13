"use client"

import { clx } from "@medusajs/ui"
import { Check, ImageIcon } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"

import {
  buildContactRequestPayload,
  CONTACT_ERROR_MESSAGE,
  CONTACT_SUCCESS_MESSAGE,
  ContactRequestKind,
  PRODUCT_ENQUIRY_MESSAGE,
  validateContactRequest,
} from "@lib/util/contact-request"

import {
  ContactPrefField,
  FieldLabel,
  fieldClass,
  Honeypot,
  PrivacyNote,
  submitContactRequest,
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
  /** Focus the first field on mount (modal). */
  autoFocus?: boolean
  /** Placeholder for the message when there is no product context. */
  messagePlaceholder?: string
  /** Rendered under the success message (e.g. a "Fechar" button). */
  successAction?: React.ReactNode
  className?: string
}

const GENERAL_PLACEHOLDER =
  "Em que podemos ajudar? Indique produtos, quantidades ou outras informações úteis."

/**
 * Enquiry form ("Pedir orçamento"). Posts to the backend
 * `POST /store/contact-request`, which e-mails the sales team and sends the
 * customer an acknowledgement. Used inline on the contact page and inside the
 * product page's ContactModal. pt-PT.
 */
export default function ContactRequestForm({
  kind,
  product,
  idPrefix = "crf",
  autoFocus = false,
  messagePlaceholder = GENERAL_PLACEHOLDER,
  successAction,
  className,
}: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  )
  const [invalid, setInvalid] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const id = (name: string) => `${idPrefix}-${name}`

  useEffect(() => {
    if (autoFocus) firstRef.current?.focus({ preventScroll: true })
  }, [autoFocus])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string | null) ?? undefined
    const fields = {
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
    const problem = validateContactRequest(fields)
    setInvalid(problem?.message ?? null)
    if (problem) {
      const el = e.currentTarget.elements.namedItem(problem.field)
      if (el instanceof HTMLElement) el.focus()
      return
    }

    setStatus("sending")
    try {
      await submitContactRequest(
        buildContactRequestPayload(fields, {
          kind,
          productTitle: product?.title,
          sku: product?.sku,
          quantity: product?.quantity,
          productUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        })
      )
      setStatus("done")
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

  return (
    <form
      className={clx("flex flex-col gap-4", className)}
      onSubmit={submit}
      noValidate
      data-testid="contact-request-form"
    >
      {product && (
        <div
          className="flex items-center gap-3 rounded-btn border border-hairline bg-[#f7f9fa] p-3"
          data-testid="contact-request-product"
        >
          <div className="relative h-14 w-14 flex-none overflow-hidden rounded-[10px] border border-hairline bg-white">
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt=""
                fill
                sizes="56px"
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

      <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
        <div>
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
          />
        </div>
        <div>
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
          />
        </div>
        <div>
          <FieldLabel htmlFor={id("phone")}>Telefone</FieldLabel>
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className={fieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor={id("empresa")}>Empresa</FieldLabel>
          <input
            id={id("empresa")}
            name="empresa"
            autoComplete="organization"
            className={fieldClass}
          />
        </div>
        <div className={clx(!product && "xsmall:col-span-2")}>
          <FieldLabel htmlFor={id("localidade")}>Localidade</FieldLabel>
          <input
            id={id("localidade")}
            name="localidade"
            autoComplete="address-level2"
            className={fieldClass}
          />
        </div>
        {product && (
          <div>
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
      </div>

      <ContactPrefField idPrefix={idPrefix} />

      <div>
        <FieldLabel htmlFor={id("message")}>Mensagem</FieldLabel>
        <textarea
          id={id("message")}
          name="message"
          rows={product ? 3 : 5}
          defaultValue={product ? PRODUCT_ENQUIRY_MESSAGE : undefined}
          placeholder={product ? undefined : messagePlaceholder}
          className={clx(fieldClass, "min-h-[96px] resize-y")}
        />
      </div>

      <Honeypot />

      {(invalid || status === "error") && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {invalid ?? CONTACT_ERROR_MESSAGE}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        data-testid="contact-request-submit"
        className="flex h-12 w-full items-center justify-center rounded-pill bg-brand-cyan px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:bg-brand-cyan-ink disabled:opacity-60"
      >
        {status === "sending" ? "A enviar…" : "Enviar pedido"}
      </button>

      <PrivacyNote />
    </form>
  )
}
