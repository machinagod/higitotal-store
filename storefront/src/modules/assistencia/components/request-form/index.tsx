"use client"

import { useEffect, useRef, useState } from "react"
import { Phone, Mail, MapPin, Check, ArrowRight } from "lucide-react"

import { COMPANY } from "@lib/company"
import {
  buildAssistanceMessage,
  buildContactRequestPayload,
  CONTACT_ERROR_MESSAGE,
  ContactRequestFields,
  validateContactRequestAll,
} from "@lib/util/contact-request"
import {
  ContactPrefField,
  DEFAULT_CONTACT_PREF,
  ErrorSummary,
  FieldError,
  FieldLabel,
  fieldClass,
  Honeypot,
  OptionalDetails,
  PrivacyNote,
  RequiredLegend,
  submitContactRequest,
  useFieldErrors,
} from "@modules/common/components/contact-request-form/fields"

/** Anchor of the form section on the assistência page. */
export const REQUEST_ANCHOR = "pedir"

const ID = "rf"

/** Error when the (required) description is missing. */
const DESCRIPTION_ERROR = "Descreva o problema ou o pedido."

/** What the customer typed (the message is their own description). */
const readFields = (form: HTMLFormElement) => {
  const fd = new FormData(form)
  const get = (k: string) => ((fd.get(k) as string | null) ?? "").trim()
  const fields: ContactRequestFields = {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    empresa: get("empresa"),
    localidade: get("localidade"),
    contactPref: get("contactPref"),
    message: get("message"),
    modelo: get("modelo"),
    urgente: fd.get("urgente") ? true : null,
    company: get("company"), // honeypot
  }
  return { fields, tipo: get("tipo"), equipamento: get("equipamento") }
}

/**
 * "Pedir assistência" — technical-assistance request form. Posts to the
 * backend /store/contact-request with kind "assistencia" (e-mails the team via
 * Resend; "[URGENTE]" in the subject when the equipment is stopped). Shares
 * its fields, validation UI, privacy note and submit logic with the enquiry
 * form (modules/common/components/contact-request-form). Arriving via
 * `#pedir` (hero / PDP / contact links) focuses the first field. pt-PT.
 *
 * Asks for the minimum: Nome, E-mail and a short description. Everything else
 * (phone, company, location, service type, equipment, model, the urgent flag,
 * preferred contact) sits in the collapsed "Mais detalhes (opcional)" section.
 */
const RequestForm = () => {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  )
  const [pref, setPref] = useState(DEFAULT_CONTACT_PREF)
  const [urgent, setUrgent] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const id = (name: string) => `${ID}-${name}`

  const errors = useFieldErrors(ID, (form) =>
    validateContactRequestAll(readFields(form).fields, {
      messageError: DESCRIPTION_ERROR,
    })
  )

  // Focus the first field when the visitor comes for the form (#pedir), both
  // on arrival and when an in-page "Pedir assistência" link is used again.
  useEffect(() => {
    const focusName = () =>
      requestAnimationFrame(() => nameRef.current?.focus({ preventScroll: true }))
    if (window.location.hash === `#${REQUEST_ANCHOR}`) focusName()
    const onHash = () => {
      if (window.location.hash === `#${REQUEST_ANCHOR}`) focusName()
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a")
      if (a?.getAttribute("href") === `#${REQUEST_ANCHOR}`) focusName()
    }
    window.addEventListener("hashchange", onHash)
    document.addEventListener("click", onClick)
    return () => {
      window.removeEventListener("hashchange", onHash)
      document.removeEventListener("click", onClick)
    }
  }, [])

  const onChange = (e: React.FormEvent<HTMLFormElement>) => {
    const t = e.target as HTMLInputElement
    if (t.name === "contactPref") setPref(t.value)
    if (t.name === "urgente") setUrgent(t.checked)
    errors.onChange(e)
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    if (!errors.check(form)) return
    const { fields, tipo, equipamento } = readFields(form)

    setStatus("sending")
    try {
      await submitContactRequest(
        buildContactRequestPayload(fields, {
          kind: "assistencia",
          // Kept for backends that infer the kind from the title.
          productTitle: "Assistência Técnica",
          // The team gets the service type / equipment before the description.
          message: buildAssistanceMessage({
            tipo,
            equipamento,
            descricao: fields.message,
          }),
          productUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        })
      )
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-hero bg-gradient-to-br from-brand-navy to-brand-cyan lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left rail — pitch + direct contacts */}
      <div className="p-8 text-white sm:p-[50px]">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-[#bdeaff]">
          <span className="ind" style={{ background: "#bdeaff" }} />
          Pedir assistência
        </span>
        <h2 className="mt-4 max-w-[14ch] text-3xl font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[36px]">
          Conte-nos o que precisa
        </h2>
        <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-white/90">
          A nossa equipa responde em dias úteis. Para avarias urgentes,
          ligue-nos.
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <a
            href={COMPANY.phone.href}
            className="-mx-2 flex min-h-[44px] items-center gap-3 rounded-btn px-2 py-1 text-[15px] font-semibold transition-colors hover:bg-white/10"
          >
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-white/[0.16]">
              <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span>
              {COMPANY.phone.display}
              <span className="block text-xs font-medium text-white/75">
                {COMPANY.phone.costNote}
              </span>
            </span>
          </a>
          <a
            href={`mailto:${COMPANY.email}`}
            className="-mx-2 flex min-h-[44px] items-center gap-3 rounded-btn px-2 py-1 text-[15px] font-semibold transition-colors hover:bg-white/10"
          >
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-white/[0.16]">
              <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            {COMPANY.email}
          </a>
          <div className="flex min-h-[44px] items-center gap-3 py-1 text-[15px] font-semibold">
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-white/[0.16]">
              <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            {COMPANY.address.city} · {COMPANY.address.country}
          </div>
        </div>
      </div>

      {/* Right rail — form */}
      <div className="bg-white p-6 sm:p-[46px]">
        {status === "done" ? (
          <div
            className="flex h-full flex-col justify-center"
            role="status"
            data-testid="request-form-success"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-svc-ok/15 text-svc-ok">
              <Check className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-extrabold text-brand-ink">
              Pedido enviado
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-grey-60">
              Obrigado. Recebemos o seu pedido e a nossa equipa técnica entrará
              em contacto consigo brevemente. Para avarias urgentes, ligue para{" "}
              {COMPANY.phone.display} ({COMPANY.phone.costNote.toLowerCase()}).
            </p>
          </div>
        ) : (
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={submit}
            onChange={onChange}
            noValidate
            data-testid="assistance-request-form"
          >
            <ErrorSummary
              problems={errors.problems}
              fieldId={(f) => id(f)}
              className="sm:col-span-2"
            />
            <RequiredLegend className="sm:col-span-2" />
            <div>
              <FieldLabel htmlFor={id("name")} required>
                Nome
              </FieldLabel>
              <input
                ref={nameRef}
                id={id("name")}
                name="name"
                required
                autoComplete="name"
                className={fieldClass}
                {...errors.a11y("name")}
              />
              <FieldError id={errors.errorId("name")} message={errors.messageFor("name")} />
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
                {...errors.a11y("email")}
              />
              <FieldError id={errors.errorId("email")} message={errors.messageFor("email")} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={id("message")} required>
                Descrição do pedido
              </FieldLabel>
              <textarea
                id={id("message")}
                name="message"
                required
                rows={3}
                placeholder="Ex.: a máquina de lavar louça não aquece a água."
                className={`${fieldClass} min-h-[96px] resize-y`}
                {...errors.a11y("message")}
              />
              <FieldError
                id={errors.errorId("message")}
                message={errors.messageFor("message")}
              />
            </div>

            <OptionalDetails
              accent="orange"
              className="sm:col-span-2"
              hint="Telefone, empresa, localidade, tipo de serviço, equipamento, urgência…"
              data-testid="assistance-request-details"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
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
                <div>
                  <FieldLabel htmlFor={id("empresa")}>Empresa</FieldLabel>
                  <input
                    id={id("empresa")}
                    name="empresa"
                    autoComplete="organization"
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor={id("localidade")}>
                    Localidade / código postal
                  </FieldLabel>
                  <input
                    id={id("localidade")}
                    name="localidade"
                    placeholder="Ex.: Mirandela, 5370-565"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={id("tipo")}>Tipo de serviço</FieldLabel>
                  {/* No default: hidden in the collapsed section, a preselected
                      type would be sent without the customer choosing it. */}
                  <select
                    id={id("tipo")}
                    name="tipo"
                    className={fieldClass}
                    defaultValue=""
                  >
                    <option value="">Selecione…</option>
                    <option>Instalação</option>
                    <option>Reparação</option>
                    <option>Contrato de manutenção</option>
                    <option>Outro / não sei</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor={id("equipamento")}>Equipamento / marca</FieldLabel>
                  <input
                    id={id("equipamento")}
                    name="equipamento"
                    placeholder="Ex.: Fagor, Sammic, Nilfisk"
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor={id("modelo")}>Modelo / n.º de série</FieldLabel>
                  <input
                    id={id("modelo")}
                    name="modelo"
                    placeholder="Consta da chapa de características do equipamento"
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor={id("urgente")}
                    className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-btn border-[1.5px] border-hairline px-4 py-3 transition-colors hover:border-[#cdd5dd] has-[:checked]:border-svc-signal has-[:checked]:bg-svc-signal/10"
                  >
                    <input
                      id={id("urgente")}
                      name="urgente"
                      type="checkbox"
                      value="sim"
                      aria-describedby={id("urgente-hint")}
                      className="mt-0.5 h-5 w-5 flex-none cursor-pointer accent-svc-signal-ink"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-brand-ink">
                        Equipamento parado (urgente)
                      </span>
                      <span
                        id={id("urgente-hint")}
                        className="mt-0.5 block text-xs leading-relaxed text-grey-60"
                      >
                        {urgent
                          ? `O pedido segue assinalado como urgente. Para uma resposta imediata, ligue também para ${COMPANY.phone.display} (${COMPANY.phone.costNote.toLowerCase()}).`
                          : "Assinale se o equipamento não está a funcionar e a sua atividade está afetada."}
                      </span>
                    </span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <ContactPrefField idPrefix={ID} accent="orange" />
                </div>
              </div>
            </OptionalDetails>

            <Honeypot />

            {status === "error" && (
              <p role="alert" className="text-sm font-medium text-rose-700 sm:col-span-2">
                {CONTACT_ERROR_MESSAGE}
              </p>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={status === "sending"}
                data-testid="assistance-request-submit"
                className="flex h-12 w-full items-center justify-center gap-[10px] rounded-pill bg-svc-signal px-7 text-[13px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_30px_rgba(255,122,26,0.32)] transition hover:bg-svc-signal-ink disabled:opacity-60"
              >
                {status === "sending" ? (
                  "A enviar…"
                ) : (
                  <>
                    Enviar pedido
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
            <PrivacyNote className="text-center sm:col-span-2" />
          </form>
        )}
      </div>
    </div>
  )
}

export default RequestForm
