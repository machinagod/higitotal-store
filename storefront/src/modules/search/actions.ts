"use server"

import { SEARCH_INDEX_NAME, searchClient } from "@lib/search-client"

/**
 * Searches the products index through the backend's POST /store/search
 * @param {string} query - search query
 */
export async function search(query: string) {
  const { results } = await searchClient.search([
    { indexName: SEARCH_INDEX_NAME, params: { query } },
  ])

  return results[0]?.hits ?? []
}
