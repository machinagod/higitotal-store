import { defineProductSearchIndex } from "@rokmohar/medusa-plugin-meilisearch/indexes"

// Published products, indexed as `products` (the storefront's
// NEXT_PUBLIC_INDEX_NAME default). The shipped schema already makes title,
// description and `variants.sku` (the Moloni reference customers search by)
// searchable, and keeps id/handle/thumbnail retrievable for the search hits.
export default defineProductSearchIndex()
