"use server"

import { SEARCH_INDEX_NAME, searchClient } from "@lib/search-client"

/**
 * Searches the products index through the backend's POST /store/search.
 * Hits come back in relevance order.
 * @param {string} query - search query
 * @param {number} limit - max hits (omit for the backend default, as the
 *   header's live suggestions do; the results page asks for more)
 */
export async function search(query: string, limit?: number) {
  const { results } = await searchClient.search([
    {
      indexName: SEARCH_INDEX_NAME,
      params: limit ? { query, hitsPerPage: limit } : { query },
    },
  ])

  return results[0]?.hits ?? []
}
