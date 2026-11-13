import { Metadata } from "next"
import Link from "next/link"

import { COMPANY } from "@lib/company"
import { getNavCategories } from "@lib/data/categories"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A página que procura não existe ou foi movida.",
  robots: { index: false, follow: true },
}

/**
 * Root-level 404 (outside the [countryCode] site layout, so no header/footer):
 * a minimal branded page linking back into the Portuguese storefront. Also
 * served for unmatched URLs under a country prefix (e.g. /pt/xyz).
 */
const COUNTRY = "/pt"

export default async function NotFound() {
  // Fail soft: a backend hiccup must never turn the 404 into a 500.
  const categories = (await getNavCategories().catch(() => []))
    .filter((c) => !isInternalCategory(c.label))
    .slice(0, 6)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Link href={COUNTRY} aria-label="Higitotal — página inicial">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/higitotal/logo-full-transparent.png"
            alt="Higitotal"
            className="h-10 w-auto small:h-12"
          />
        </Link>
        <span className="mt-12 inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-brand-cyan">
          <span className="ind" />
          Erro 404
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-ink small:text-[44px] small:leading-[1.08]">
          Página não encontrada
        </h1>
        <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-grey-60 small:text-lg">
          A página que procura não existe ou foi movida.
        </p>
        <div className="mt-8 flex w-full max-w-[520px] flex-col items-stretch justify-center gap-3 xsmall:flex-row xsmall:items-center">
          <Link
            href={COUNTRY}
            className="inline-flex items-center justify-center rounded-pill bg-brand-cyan px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-transform hover:-translate-y-0.5"
          >
            Voltar à página inicial
          </Link>
          <Link
            href={`${COUNTRY}/store`}
            className="inline-flex items-center justify-center rounded-pill border-[1.5px] border-hairline bg-white px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
          >
            Ver catálogo
          </Link>
        </div>
        {categories.length > 0 && (
          <ul className="mt-12 flex max-w-[640px] flex-wrap justify-center gap-2.5">
            {categories.map((c) => (
              <li key={c.href}>
                <Link
                  href={`${COUNTRY}${c.href}`}
                  className="inline-flex rounded-pill border border-hairline bg-[#f7f9fb] px-4 py-2 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
                >
                  {displayCategoryName(c.label)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="border-t border-hairline px-4 py-5 text-center text-xs text-grey-50">
        {COMPANY.legalName} ·{" "}
        <a href={COMPANY.phone.href} className="hover:text-brand-cyan">
          {COMPANY.phone.display}
        </a>{" "}
        ({COMPANY.phone.costNote.toLowerCase()}) ·{" "}
        <a href={`mailto:${COMPANY.email}`} className="hover:text-brand-cyan">
          {COMPANY.email}
        </a>
      </footer>
    </div>
  )
}
