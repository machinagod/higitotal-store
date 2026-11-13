"use client"

import { clx } from "@medusajs/ui"
import React from "react"

import { sdk } from "@lib/config"
import {
  ContactRequestPayload,
  PRIVACY_NOTE,
  PRIVACY_POLICY_PATH,
} from "@lib/util/contact-request"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Building blocks shared by the enquiry form (product modal, contact page) and
 * the assistência request form, so every form on the site looks and posts the
 * same way.
 */

/** Text input / select / textarea. 16px on mobile so iOS doesn't zoom in. */
export const fieldClass =
  "w-full rounded-btn border-[1.5px] border-hairline bg-white px-4 py-3 text-base small:text-sm font-medium text-brand-ink outline-none transition-colors placeholder:font-normal placeholder:text-[#8a939c] hover:border-[#cdd5dd] focus:border-brand-cyan focus:shadow-[0_0_0_4px_rgba(0,173,239,0.12)]"

export const labelClass = "mb-1.5 block text-[13px] font-semibold text-brand-ink"

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

/** "Forma de contacto preferida" — Telefone / E-mail as pill radios. */
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
              defaultChecked={i === 0}
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

/** POST to the backend; throws on any non-2xx (the backend returns 502 when the e-mail fails). */
export async function submitContactRequest(payload: ContactRequestPayload) {
  await sdk.client.fetch("/store/contact-request", {
    method: "POST",
    body: payload,
  })
}
