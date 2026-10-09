import { createInstantSearchAdapter } from "@medusajs/instantsearch-adapter"
import type { InstantSearchProps } from "react-instantsearch"

import { MEDUSA_BACKEND_URL } from "@lib/config"

// Search goes through the backend's `POST /store/search` (Medusa's Search
// Module, Meilisearch as its provider) rather than straight to Meilisearch.
// The module serves versioned physical indexes (`products_v1`, `products_v2`,
// ...) behind the logical name, and scopes hits to published products in the
// publishable key's sales channels.
export const { searchClient } = createInstantSearchAdapter({
  baseUrl: MEDUSA_BACKEND_URL,
  path: "/store/search",
  publishableApiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

// The adapter implements InstantSearch's search-client protocol, which is what
// Medusa ships it for. Its declared type is structural, while InstantSearch
// types `searchClient` from the installed algoliasearch v5 client, so the two
// cannot be related by the checker. This is the single boundary cast.
export const instantSearchClient =
  searchClient as unknown as InstantSearchProps["searchClient"]

// Logical index name, as declared in backend/src/search/products.ts and
// allowed by the `/store/search` middleware.
export const SEARCH_INDEX_NAME = "products"
