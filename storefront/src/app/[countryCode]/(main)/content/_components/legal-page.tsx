import React from "react"
import { Mail, Phone } from "lucide-react"

import { COMPANY } from "@lib/company"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Shared shell for the legal/content pages (terms, privacy, cookies): an
 * article column plus, on desktop, a sticky index of sections and a contact
 * card, so the right half of the page isn't left empty.
 */

export type LegalSection = {
  id: string
  title: string
  body: React.ReactNode
}

export const LEGAL_LAST_UPDATED = "novembro de 2026"

const LEGAL_LINKS = [
  { href: "/content/terms-of-use", label: "Termos de Utilização" },
  { href: "/content/privacy-policy", label: "Política de Privacidade" },
  { href: "/content/cookie-policy", label: "Política de Cookies" },
]

export function LegalPage({
  eyebrow = "Informação legal",
  title,
  intro,
  sections,
  current,
}: {
  eyebrow?: string
  title: string
  intro?: React.ReactNode
  sections: LegalSection[]
  /** href of this page, to mark it in the "other documents" list. */
  current: string
}) {
  return (
    <div className="content-container py-10 small:py-16">
      <div className="grid grid-cols-1 gap-12 small:grid-cols-[minmax(0,1fr)_280px] medium:gap-20">
        <article className="max-w-[760px] text-[15px] leading-relaxed text-grey-70">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-brand-cyan">
            <span className="ind" />
            {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-ink small:text-[40px] small:leading-[1.1]">
            {title}
          </h1>
          <p className="mt-3 text-sm text-grey-50">
            Última atualização: {LEGAL_LAST_UPDATED}
          </p>
          {intro && <div className="mt-6 text-base text-grey-60">{intro}</div>}

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-40">
              <h2 className="mt-10 text-xl font-bold tracking-tight text-brand-ink">
                {i + 1}. {s.title}
              </h2>
              <div className="legal-body mt-3 flex flex-col gap-3">{s.body}</div>
            </section>
          ))}
        </article>

        <aside className="hidden small:block">
          <div className="sticky top-40 flex flex-col gap-6">
            <nav
              aria-label="Nesta página"
              className="rounded-card border border-hairline bg-white p-6"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-grey-50">
                Nesta página
              </p>
              <ol className="mt-3 flex flex-col gap-2 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-grey-60 transition-colors hover:text-brand-cyan"
                    >
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="rounded-card bg-[#f1f4f7] p-6 text-sm">
              <p className="font-bold text-brand-ink">Dúvidas sobre este documento?</p>
              <a
                href={`mailto:${COMPANY.email}`}
                className="mt-3 flex items-center gap-2 font-semibold text-brand-ink transition-colors hover:text-brand-cyan"
              >
                <Mail className="h-4 w-4 text-brand-cyan" />
                {COMPANY.email}
              </a>
              <a
                href={COMPANY.phone.href}
                className="mt-2 flex items-center gap-2 font-semibold text-brand-ink transition-colors hover:text-brand-cyan"
              >
                <Phone className="h-4 w-4 text-brand-cyan" />
                {COMPANY.phone.display}
              </a>
              <p className="mt-1 pl-6 text-xs text-grey-50">
                {COMPANY.phone.costNote}
              </p>
              <ul className="mt-5 flex flex-col gap-1.5 border-t border-hairline pt-4">
                {LEGAL_LINKS.filter((l) => l.href !== current).map((l) => (
                  <li key={l.href}>
                    <LocalizedClientLink
                      href={l.href}
                      className="text-grey-60 underline-offset-2 transition-colors hover:text-brand-cyan hover:underline"
                    >
                      {l.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Inline link styled for legal body text. */
export function LegalLink({
  href,
  children,
  external,
}: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  const cls =
    "font-semibold text-brand-cyan-ink underline underline-offset-2 hover:text-brand-cyan"
  if (external || /^(https?:|mailto:|tel:)/.test(href)) {
    const isWeb = /^https?:/.test(href)
    return (
      <a
        href={href}
        className={cls}
        {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    )
  }
  return (
    <LocalizedClientLink href={href} className={cls}>
      {children}
    </LocalizedClientLink>
  )
}

/** Bulleted list for legal body text. */
export function LegalList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-brand-cyan">
      {children}
    </ul>
  )
}

/** Identification block shared by the terms and privacy pages. */
export function CompanyIdentification() {
  const a = COMPANY.address
  return (
    <>
      <span className="font-semibold text-brand-ink">{COMPANY.legalName}</span>
      , pessoa coletiva n.º&nbsp;{COMPANY.nipc}, com sede na {a.street}, {a.postalCode}{" "}
      {a.city}, {a.country}
    </>
  )
}

/** E-mail + phone (with the DL 59/2021 cost note) + hours, inline. */
export function CompanyContacts() {
  return (
    <>
      e-mail <LegalLink href={`mailto:${COMPANY.email}`}>{COMPANY.email}</LegalLink>
      ; telefone{" "}
      <LegalLink href={COMPANY.phone.href}>{COMPANY.phone.display}</LegalLink> (
      {COMPANY.phone.costNote.toLowerCase()}); horário: {COMPANY.hours.charAt(0).toLowerCase() + COMPANY.hours.slice(1)}
    </>
  )
}
