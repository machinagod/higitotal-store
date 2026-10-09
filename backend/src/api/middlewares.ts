import {
  allowFields,
  configureStoreSearch,
  defineMiddlewares,
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      // Medusa 2.21 enforces a strict allow-list on Store `fields`. The product
      // page requests `*categories.parent_category` for its breadcrumbs (path
      // bar + BreadcrumbList JSON-LD); core only allows `categories`, so the
      // parent would be silently stripped. Category names/handles are public.
      // No `method` key: an allowFields middleware must run before the core
      // query validation, which a method-scoped entry does not.
      matcher: "/store/products",
      middlewares: [allowFields("categories.parent_category")],
    },
    {
      // Storefront search (InstantSearch adapter) goes through POST
      // /store/search. Only the products index (src/search/products.ts) is
      // exposed; Medusa scopes its hits to published products in the
      // publishable key's sales channels.
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            products: true,
          },
        }),
      ],
    },
  ],
})
