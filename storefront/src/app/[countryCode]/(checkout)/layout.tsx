import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import { ShieldCheck } from "lucide-react"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <header className="bg-white/90 backdrop-blur-md border-b border-hairline">
        <nav className="content-container flex h-[60px] small:h-[72px] items-center justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex flex-1 basis-0 items-center gap-x-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:text-brand-cyan"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="hidden small:block">Voltar ao carrinho</span>
            <span className="block small:hidden">Voltar</span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex shrink-0 items-center"
            data-testid="store-link"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/higitotal/logo-full-transparent.png"
              alt="Higitotal"
              className="h-7 small:h-9 w-auto"
            />
          </LocalizedClientLink>
          <div className="flex flex-1 basis-0 items-center justify-end gap-x-1.5 text-[11px] font-semibold uppercase tracking-wide text-grey-50">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-cyan" />
            <span className="hidden small:inline">Pagamento seguro</span>
          </div>
        </nav>
      </header>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <footer className="border-t border-hairline">
        <div className="content-container py-5 text-center text-xs text-grey-50">
          Todos os preços apresentados não incluem IVA à taxa legal em vigor.
          <span className="mx-2">·</span>
          Higitotal — Sistemas e Produtos de Higiene, Lda. · NIF 504297040
        </div>
      </footer>
    </div>
  )
}
