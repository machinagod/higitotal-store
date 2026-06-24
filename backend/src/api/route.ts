import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/** GET / → redirect to the admin dashboard. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.redirect("/app")
}
