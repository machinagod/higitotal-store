"use client"

import { clx } from "@medusajs/ui"
import { AlertCircle, ChevronDown } from "lucide-react"
import React, { useCallback, useRef, useState } from "react"

import { sdk } from "@lib/config"
import {
  ContactRequestField,
  ContactRequestPayload,
  ContactRequestProblem,
  PRIVACY_NOTE,
  PRIVACY_POLICY_PATH,
} from "@lib/util/contact-request"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Building blocks shared by the enquiry form (product modal, contact page) and
 * the assistência request form, so every form on the site looks, validates and
 * posts the same way.
 */

/**
 * Text input / select / textarea. 16px on mobile so iOS doesn't zoom in;
 * ≥44px tall; red border when `aria-invalid`.
 */
export const fieldClass =
  "w-full rounded-btn border-[1.5px] border-hairline bg-white px-4 py-2.5 text-base small:text-sm font-medium text-brand-ink outline-none transition-colors placeholder:font-normal placeholder:text-[#8a939c] hover:border-[#cdd5dd] focus:border-brand-cyan focus:shadow-[0_0_0_4px_rgba(0,173,239,0.12)] aria-[invalid=true]:border-rose-600 aria-[invalid=true]:focus:shadow-[0_0_0_4px_rgba(225,29,72,0.12)]"

export const labelClass = "mb-1 block text-[13px] font-semibold text-brand-ink"

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children}
      {required && (
        <>
          {" "}
          <span aria-hidden="true" className="text-brand-cyan">
            *
          </span>
          <span className="sr-only">(obrigatório)</span>
        </>
      )}
    </label>
  )
}

/** Inline error under a field (referenced by the field's aria-describedby). */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p
      id={id}
      className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-rose-700"
    >
      <AlertCircle className="mt-px h-4 w-4 flex-none" aria-hidden="true" />
      {message}
    </p>
  )
}

/**
 * Opens the collapsed "Mais detalhes" section(s) (`<details>`) a form control
 * sits in, so an error there is never hidden.
 */
function reveal(el: Element | null | undefined) {
  let d = el?.closest("details") ?? null
  while (d) {
    if (!d.open) d.open = true
    d = d.parentElement?.closest("details") ?? null
  }
}

/**
 * Focuses an invalid control and centres it, so the error line rendered under
 * it is not left behind the product sheet's sticky "Enviar pedido" bar.
 */
function focusField(el: Element | null | undefined) {
  if (!(el instanceof HTMLElement)) return
  el.focus({ preventScroll: true })
  el.scrollIntoView?.({ block: "center" })
}

/** Focuses a form control, first opening the collapsed section it sits in. */
export function revealAndFocus(el: Element | null | undefined) {
  reveal(el)
  focusField(el)
}

/**
 * Field-level validation state for the uncontrolled forms: errors appear on
 * submit, then update live as the user fixes them.
 */
export function useFieldErrors(
  idPrefix: string,
  validate: (form: HTMLFormElement) => ContactRequestProblem[]
) {
  const [problems, setProblems] = useState<ContactRequestProblem[]>([])
  const attempted = useRef(false)

  const errorId = useCallback(
    (field: ContactRequestField) => `${idPrefix}-${field}-error`,
    [idPrefix]
  )
  const messageFor = (field: ContactRequestField) =>
    problems.find((p) => p.field === field)?.message

  /** Props for a validated control: aria-invalid + aria-describedby. */
  const a11y = (field: ContactRequestField) => {
    const invalid = !!messageFor(field)
    return {
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? errorId(field) : undefined,
    } as const
  }

  /**
   * Validates on submit. Opens the collapsed optional section when any
   * invalid field is in there, then focuses the first invalid field. True
   * when valid.
   */
  const check = (form: HTMLFormElement) => {
    attempted.current = true
    const found = validate(form)
    setProblems(found)
    const controls = found.map((p) => {
      const el = form.elements.namedItem(p.field)
      return el instanceof Element ? el : null
    })
    controls.forEach(reveal)
    focusField(controls[0])
    return found.length === 0
  }

  /** Form onChange: re-validate live once a submit has been attempted. */
  const onChange = (e: React.FormEvent<HTMLFormElement>) => {
    if (attempted.current) setProblems(validate(e.currentTarget))
  }

  const reset = () => {
    attempted.current = false
    setProblems([])
  }

  return { problems, a11y, messageFor, errorId, check, onChange, reset }
}

/**
 * Error summary at the top of the form — only when there are several problems
 * (a single one is announced through its field). Links focus the fields.
 */
export function ErrorSummary({
  problems,
  fieldId,
  className,
}: {
  problems: ContactRequestProblem[]
  fieldId: (field: ContactRequestField) => string
  className?: string
}) {
  if (problems.length < 2) return null
  return (
    <div
      role="alert"
      className={clx(
        "rounded-btn border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800",
        className
      )}
      data-testid="form-error-summary"
    >
      <p className="font-bold">Corrija os seguintes campos:</p>
      <ul className="mt-1 list-disc pl-5">
        {problems.map((p) => (
          <li key={p.field}>
            <a
              href={`#${fieldId(p.field)}`}
              className="inline-block min-h-[24px] py-[3px] underline underline-offset-2"
              onClick={(e) => {
                e.preventDefault()
                revealAndFocus(document.getElementById(fieldId(p.field)))
              }}
            >
              {p.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Preselected "Forma de contacto preferida". */
export const DEFAULT_CONTACT_PREF = "email"

/**
 * "Forma de contacto preferida" — Telefone / E-mail as pill radios. E-mail is
 * preselected (the only contact the minimum form asks for); choosing
 * Telefone makes the phone required.
 */
export function ContactPrefField({
  idPrefix,
  accent = "cyan",
}: {
  idPrefix: string
  accent?: "cyan" | "orange"
}) {
  const options = [
    { value: "telefone", label: "Telefone" },
    { value: "email", label: "E-mail" },
  ]
  return (
    <fieldset>
      <legend className={labelClass}>Forma de contacto preferida</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label
            key={o.value}
            htmlFor={`${idPrefix}-pref-${o.value}`}
            className="cursor-pointer"
          >
            <input
              id={`${idPrefix}-pref-${o.value}`}
              type="radio"
              name="contactPref"
              value={o.value}
              defaultChecked={o.value === DEFAULT_CONTACT_PREF}
              className="peer sr-only"
            />
            <span
              className={clx(
                "inline-flex h-11 items-center rounded-pill border-[1.5px] border-hairline bg-white px-5 text-sm font-semibold text-grey-60 transition-colors hover:border-[#cdd5dd] peer-focus-visible:ring-4",
                accent === "cyan"
                  ? "peer-checked:border-brand-cyan peer-checked:bg-brand-cyan/10 peer-checked:text-brand-ink peer-focus-visible:ring-brand-cyan/20"
                  : "peer-checked:border-svc-signal peer-checked:bg-svc-signal/10 peer-checked:text-brand-ink peer-focus-visible:ring-svc-signal/20"
              )}
            >
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** "Mais detalhes (opcional)" summary title. */
export const OPTIONAL_DETAILS_TITLE = "Mais detalhes (opcional)"

/**
 * The optional part of a form: a native `<details>` disclosure, collapsed by
 * default, titled "Mais detalhes (opcional)" with a hint listing what is
 * inside. Uncontrolled on purpose: once opened it stays open across
 * re-renders (and while the product sheet is closed and reopened, as the
 * sheet keeps the form mounted). `revealAndFocus` opens it when one of its
 * fields has an error. Fields inside are still part of the form (FormData).
 */
export function OptionalDetails({
  hint,
  children,
  accent = "cyan",
  className,
  "data-testid": testId = "optional-details",
}: {
  /** What is inside, e.g. "Telefone, empresa, localidade…". */
  hint: string
  children: React.ReactNode
  accent?: "cyan" | "orange"
  className?: string
  "data-testid"?: string
}) {
  return (
    <details
      className={clx(
        "group rounded-btn border-[1.5px] border-hairline bg-white transition-colors open:border-[#cdd5dd]",
        className
      )}
      data-testid={testId}
    >
      <summary
        className={clx(
          "flex min-h-[44px] cursor-pointer list-none items-center gap-3 rounded-[10px] px-3 py-2 outline-none transition-colors hover:bg-[#f7f9fa] focus-visible:ring-4 xsmall:px-4 [&::-webkit-details-marker]:hidden",
          accent === "cyan"
            ? "focus-visible:ring-brand-cyan/25"
            : "focus-visible:ring-svc-signal/25"
        )}
        data-testid={`${testId}-summary`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-brand-ink">
            {OPTIONAL_DETAILS_TITLE}
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-grey-60">
            {hint}
          </span>
        </span>
        <ChevronDown
          className="h-5 w-5 flex-none text-grey-60 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-hairline px-3 pb-4 pt-3.5 xsmall:px-4">
        {children}
      </div>
    </details>
  )
}

/** "Os campos assinalados com * são obrigatórios." — for forms without a page intro. */
export function RequiredLegend({ className }: { className?: string }) {
  return (
    <p className={clx("text-xs text-grey-60", className)}>
      Os campos assinalados com{" "}
      <span className="font-semibold text-brand-cyan">*</span> são
      obrigatórios.
    </p>
  )
}

/** Hidden bot trap. Real users never see or fill it (field name `company`). */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="hidden">
      <label>
        Não preencher
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <p className={clx("text-xs leading-relaxed text-grey-50", className)}>
      {PRIVACY_NOTE} Saiba mais na nossa{" "}
      <LocalizedClientLink
        href={PRIVACY_POLICY_PATH}
        className="font-semibold text-brand-cyan underline-offset-2 hover:underline"
      >
        Política de Privacidade
      </LocalizedClientLink>
      .
    </p>
  )
}

/**
 * True when the user changed anything (typed text, toggled a radio/checkbox,
 * picked another option) — used to avoid discarding a half-filled form.
 */
export function isFormDirty(form: HTMLFormElement | null | undefined): boolean {
  if (!form) return false
  return Array.from(form.elements).some((el) => {
    if (el instanceof HTMLInputElement) {
      if (el.type === "radio" || el.type === "checkbox") {
        return el.checked !== el.defaultChecked
      }
      if (el.type === "hidden" || el.tabIndex === -1) return false
      return el.value !== el.defaultValue
    }
    if (el instanceof HTMLTextAreaElement) return el.value !== el.defaultValue
    if (el instanceof HTMLSelectElement) {
      const initial = Array.from(el.options).findIndex((o) => o.defaultSelected)
      return el.selectedIndex !== Math.max(initial, 0)
    }
    return false
  })
}

/** POST to the backend; throws on any non-2xx (the backend returns 502 when the e-mail fails). */
export async function submitContactRequest(payload: ContactRequestPayload) {
  await sdk.client.fetch("/store/contact-request", {
    method: "POST",
    body: payload,
  })
}
