import { Metadata } from "next"
import { notFound } from "next/navigation"

import { isCatalogMode } from "@lib/util/catalog-mode"
import QuotePageTemplate from "@modules/quote/templates/quote-page"

export const metadata: Metadata = {
  // The root layout's title template appends " · Higitotal".
  title: "O seu orçamento",
  description:
    "Reúna os produtos e as quantidades de que precisa e envie um único pedido de orçamento à Higitotal.",
  // Per-visitor page (the list lives in the browser): never indexed. Also
  // disallowed in robots.txt and left out of the sitemap.
  robots: { index: false, follow: false },
}

/**
 * Quote list ("carrinho de orçamento") — catalog mode only; with prices and
 * the real cart on, the route does not exist.
 */
export default function QuotePage() {
  if (!isCatalogMode()) notFound()
  return <QuotePageTemplate />
}
