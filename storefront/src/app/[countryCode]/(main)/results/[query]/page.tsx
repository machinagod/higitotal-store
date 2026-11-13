import { Metadata } from "next"

import SearchResultsTemplate from "@modules/search/templates/search-results-template"

import { search } from "@modules/search/actions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { decodeSearchTerm } from "@lib/util/listing-copy"

export const metadata: Metadata = {
  title: "Pesquisa",
  description: "Pesquise no catálogo Higitotal de higiene profissional.",
  // Result pages are endless query permutations — keep them out of the index.
  robots: { index: false, follow: true },
}

/** Most hits the results page lists (paged 12 at a time); the backend caps `take` at 100. */
const MAX_RESULTS = 100

type Params = {
  params: { query: string; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export default async function SearchResults({ params, searchParams }: Params) {
  const term = decodeSearchTerm(params.query)
  const { sortBy, page } = searchParams

  const hits = term
    ? await search(term, MAX_RESULTS)
        // Fall back to the default page size if the backend rejects the limit.
        .catch(() => search(term))
        .catch(() => [])
    : []

  const ids = hits
    .map((h) => h.objectID || h.id)
    .filter((id): id is string => {
      return typeof id === "string"
    })

  return (
    <SearchResultsTemplate
      query={term}
      ids={ids}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
