import Medusa from "@medusajs/js-sdk"

/** Admin-side JS SDK client (session auth — runs inside the dashboard). */
export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: { type: "session" },
})
