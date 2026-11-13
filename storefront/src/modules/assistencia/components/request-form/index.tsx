"use client"

import { useState } from "react"
import { Phone, Mail, MapPin, Check, ArrowRight } from "lucide-react"

import { COMPANY } from "@lib/company"
import {
  buildContactRequestPayload,
  CONTACT_ERROR_MESSAGE,
  validateContactRequest,
} from "@lib/util/contact-request"
import {
  ContactPrefField,
  FieldLabel,
  fieldClass,
  Honeypot,
  PrivacyNote,
  submitContactRequest,
} from "@modules/common/components/contact-request-form/fields"

/**
 * "Pedir assistência" — technical-assistance request form. Posts to the
 * backend /store/contact-request with kind "assistencia" (e-mails the team via
 * Resend). Shares its fields, privacy note and submit logic with the enquiry
 * form (modules/common/components/contact-request-form). pt-PT.
 */
const RequestForm = () => {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  )
  const [invalid, setInvalid] = useState<string | null>(null)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => ((fd.get(k) as string | null) ?? "").trim()

    // Compose the free-text message so the team gets full context.
    const tipo = get("tipo")
    const equipamento = get("equipamento")
    const descricao = get("mensagem")
    const message = [
      tipo ? `Tipo de serviço: ${tipo}` : null,
      equipamento ? `Equipamento / marca: ${equipamento}` : null,
      descricao ? `\n${descricao}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    const fields = {
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
      empresa: get("empresa"),
      localidade: get("localidade"),
      contactPref: get("contactPref"),
      message,
      company: get("company"), // honeypot
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
          kind: "assistencia",
          // Kept for backends that infer the kind from the title.
          productTitle: "Assistência Técnica",
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
        <div className="mt-7 flex flex-col gap-[14px]">
          <a
            href={COMPANY.phone.href}
            className="flex items-center gap-3 text-[15px] font-semibold"
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
            className="flex items-center gap-3 text-[15px] font-semibold"
          >
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-white/[0.16]">
              <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            {COMPANY.email}
          </a>
          <div className="flex items-center gap-3 text-[15px] font-semibold">
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
            noValidate
          >
            <div>
              <FieldLabel htmlFor="rf-name" required>
                Nome
              </FieldLabel>
              <input
                id="rf-name"
                name="name"
                required
                autoComplete="name"
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="rf-email" required>
                E-mail
              </FieldLabel>
              <input
                id="rf-email"
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
              <FieldLabel htmlFor="rf-phone">Telefone</FieldLabel>
              <input
                id="rf-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="rf-empresa">Empresa</FieldLabel>
              <input
                id="rf-empresa"
                name="empresa"
                autoComplete="organization"
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="rf-localidade">
                Localidade / código postal
              </FieldLabel>
              <input
                id="rf-localidade"
                name="localidade"
                placeholder="Ex.: Mirandela, 5370-565"
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="rf-tipo">Tipo de serviço</FieldLabel>
              <select
                id="rf-tipo"
                name="tipo"
                className={fieldClass}
                defaultValue="Reparação"
              >
                <option>Instalação</option>
                <option>Reparação</option>
                <option>Contrato de manutenção</option>
                <option>Outro / não sei</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="rf-equipamento">Equipamento / marca</FieldLabel>
              <input
                id="rf-equipamento"
                name="equipamento"
                placeholder="Ex.: Fagor, Sammic, Nilfisk"
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="rf-mensagem">Descrição do pedido</FieldLabel>
              <textarea
                id="rf-mensagem"
                name="mensagem"
                rows={3}
                placeholder="Ex.: a máquina de lavar louça não aquece a água."
                className={`${fieldClass} min-h-[96px] resize-y`}
              />
            </div>

            <div className="sm:col-span-2">
              <ContactPrefField idPrefix="rf" accent="orange" />
            </div>

            <Honeypot />

            {(invalid || status === "error") && (
              <p role="alert" className="text-sm font-medium text-rose-700 sm:col-span-2">
                {invalid ?? CONTACT_ERROR_MESSAGE}
              </p>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={status === "sending"}
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
