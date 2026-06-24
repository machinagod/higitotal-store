import { defineMiddlewares } from "@medusajs/framework/http"

/**
 * Redirect the bare root `/` to the admin dashboard at `/app`.
 *
 * A plain `src/api/route.ts` at `/` doesn't take effect in this Medusa version
 * (the request 404s before the handler runs), so we do it as a middleware — it
 * runs early enough in the stack to short-circuit with a redirect.
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: "/",
      method: ["GET"],
      middlewares: [
        (_req, res) => {
          res.redirect("/app")
        },
      ],
    },
  ],
})
