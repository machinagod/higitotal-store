import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import QuoteToast from "@modules/quote/components/quote-toast"
import { QuoteListProvider } from "@lib/quote-list/context"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  // The quote list ("carrinho de orçamento") exists only in catalog mode.
  const catalogMode = isCatalogMode()
  return (
    <QuoteListProvider enabled={catalogMode}>
      {/* First focusable element: lets keyboard / screen-reader users jump
          past the header and category navigation. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-pill focus:bg-brand-ink focus:px-5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        Saltar para o conteúdo
      </a>
      <Nav />
      {/* scroll-margin keeps the start of the content clear of the sticky
          header when the skip link scrolls to it. */}
      <main
        id="conteudo"
        tabIndex={-1}
        className="relative scroll-mt-[150px] small:scroll-mt-[170px]"
      >
        {props.children}
      </main>
      <Footer />
      <QuoteToast />
    </QuoteListProvider>
  )
}
