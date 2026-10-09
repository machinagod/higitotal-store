import { defineProductSearchIndex } from "@rokmohar/medusa-plugin-meilisearch/indexes"

// Published products, indexed as `products` (the logical name the storefront
// searches via POST /store/search). The shipped schema already makes title,
// description and `variants.sku` (the Moloni reference customers search by)
// searchable, and keeps id/handle/thumbnail retrievable for the search hits.
export default defineProductSearchIndex()
