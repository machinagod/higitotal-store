import { Metadata } from "next"

import SearchResultsTemplate from "@modules/search/templates/search-results-template"

import { search } from "@modules/search/actions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { decodeSearchTerm } from "@lib/util/listing-copy"

/** Most hits the results page lists (paged 24 at a time); the backend caps `take` at 100. */
const MAX_RESULTS = 100

/** Longest search term echoed in the tab title before it is cut with "…". */
const TITLE_TERM_MAX = 60

type Params = {
  params: { query: string; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const term = decodeSearchTerm(params.query)
  const shown =
    term.length > TITLE_TERM_MAX ? `${term.slice(0, TITLE_TERM_MAX - 1).trimEnd()}…` : term

  return {
    // "Pesquisa: luvas · Higitotal" — the tab and history say what was searched.
    title: shown ? `Pesquisa: ${shown}` : "Pesquisa",
    description: "Pesquise no catálogo Higitotal de higiene profissional.",
    // Result pages are endless query permutations — keep them out of the index.
    robots: { index: false, follow: true },
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
