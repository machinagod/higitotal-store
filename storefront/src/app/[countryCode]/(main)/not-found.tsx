import { Metadata } from "next"
import { ArrowRight, Mail, Phone } from "lucide-react"

import { COMPANY } from "@lib/company"
import { getNavCategories } from "@lib/data/categories"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A página que procura não existe ou foi movida.",
  robots: { index: false, follow: true },
}

export default async function NotFound() {
  // Fail soft: a backend hiccup must never turn the 404 into a 500.
  const categories = (await getNavCategories().catch(() => []))
    .filter((c) => !isInternalCategory(c.label))
    .slice(0, 6)

  return (
    <div className="content-container py-14 small:py-24">
      <div className="mx-auto max-w-[720px] text-center">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-brand-cyan">
          <span className="ind" />
          Erro 404
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-ink small:text-[44px] small:leading-[1.08]">
          Página não encontrada
        </h1>
        <p className="mt-4 text-base leading-relaxed text-grey-60 small:text-lg">
          A página que procura não existe ou foi movida.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 xsmall:flex-row xsmall:items-center">
          <LocalizedClientLink
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand-cyan px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-transform hover:-translate-y-0.5"
          >
            Voltar à página inicial
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center gap-2 rounded-pill border-[1.5px] border-hairline bg-white px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
          >
            Ver catálogo
            <ArrowRight className="h-4 w-4" />
          </LocalizedClientLink>
        </div>

        {categories.length > 0 && (
          <div className="mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-grey-50">
              Categorias
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
              {categories.map((c) => (
                <li key={c.href}>
                  <LocalizedClientLink
                    href={c.href}
                    className="inline-flex rounded-pill border border-hairline bg-[#f7f9fb] px-4 py-2 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
                  >
                    {displayCategoryName(c.label)}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-14 border-t border-hairline pt-8 text-sm text-grey-60">
          <p>Precisa de ajuda? Fale connosco.</p>
          <div className="mt-3 flex flex-col items-center justify-center gap-3 xsmall:flex-row xsmall:gap-6">
            <a
              href={COMPANY.phone.href}
              className="inline-flex items-center gap-2 font-semibold text-brand-ink transition-colors hover:text-brand-cyan"
            >
              <Phone className="h-4 w-4 text-brand-cyan" />
              {COMPANY.phone.display}
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="inline-flex items-center gap-2 font-semibold text-brand-ink transition-colors hover:text-brand-cyan"
            >
              <Mail className="h-4 w-4 text-brand-cyan" />
              {COMPANY.email}
            </a>
          </div>
          <p className="mt-2 text-xs text-grey-50">{COMPANY.phone.costNote}</p>
        </div>
      </div>
    </div>
  )
}
