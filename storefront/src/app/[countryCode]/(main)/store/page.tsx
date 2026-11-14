import { Metadata } from "next"

import { pageMetadata } from "@lib/util/seo"
import { listingCanonicalPath, listingPageTitle } from "@lib/util/seo-meta"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
  params: {
    countryCode: string
  }
}

export async function generateMetadata({
  searchParams,
}: Params): Promise<Metadata> {
  // Canonical: the clean /store for page 1 (any sort), `?page=N` beyond it.
  return pageMetadata({
    path: listingCanonicalPath("store", searchParams.page),
    title: listingPageTitle("Catálogo", searchParams.page),
    description:
      "Catálogo de produtos de higiene profissional, papel, equipamento hoteleiro e máquinas de limpeza.",
  })
}

export default async function StorePage({ searchParams, params }: Params) {
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
