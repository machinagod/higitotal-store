import { ArrowRight, Phone } from "lucide-react"

import { COMPANY } from "@lib/company"
import { isCatalogMode } from "@lib/util/catalog-mode"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Closing call-to-action band for the company pages ("Sobre nós", "A nossa
 * loja"): quote request, contacts and the phone, on the dark "pro" ground
 * the footer and the Assistência feature use.
 */
export default function CompanyCta({
  id,
  title,
  text,
}: {
  /** Heading id (the section is labelled by it). */
  id: string
  title: string
  text: string
}) {
  // In catalog mode the quote list holds the request form; when selling,
  // quote requests go through the contact form.
  const quoteHref = isCatalogMode() ? "/orcamento" : "/contact"
  const { phone } = COMPANY

  return (
    <section
      aria-labelledby={id}
      className="rounded-hero bg-svc-ground px-6 py-9 text-svc-fg small:px-14 small:py-12"
    >
      <div className="flex flex-col gap-7 small:flex-row small:items-center small:justify-between small:gap-10">
        <div className="max-w-[52ch]">
          <h2
            id={id}
            className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-white small:text-[32px]"
          >
            {title}
          </h2>
          <p className="mt-3 leading-relaxed text-svc-fg-muted">{text}</p>
        </div>

        <div className="flex flex-col gap-5 small:items-end">
          <div className="flex flex-col gap-2.5 xsmall:flex-row">
            <LocalizedClientLink
              href={quoteHref}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-brand-cyan px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-brand-cyan-ink"
              data-testid="company-cta-quote"
            >
              Pedir orçamento
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/contact"
              className="inline-flex min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-svc-line px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-svc-ground-2"
              data-testid="company-cta-contact"
            >
              Contactos
            </LocalizedClientLink>
          </div>
          <a
            href={phone.href}
            className="group inline-flex min-h-[44px] items-center gap-3 rounded-btn"
            data-testid="company-cta-phone"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-cyan-bright/15 text-brand-cyan-bright">
              <Phone className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-white group-hover:underline">
                {phone.display}
              </span>
              <span className="text-xs font-medium text-svc-fg-muted">
                {phone.costNote}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
