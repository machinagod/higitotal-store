"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export type Recommendation = {
  product_id: string
  handle: string
  title: string
  thumbnail: string | null
  reference: string | null
  suggested_qty: number
  score: number
  rank: number
}

// Reorder recommendations for the signed-in customer (served by the
// @higitotal/medusa-extensions plugin). Returns [] for guests, unlinked
// customers, or when Twenty is offline — callers render nothing in that case.
export const getRecommendations = async (): Promise<Recommendation[]> => {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return []

  return sdk.client
    .fetch<{ recommendations: Recommendation[] }>("/store/recommendations", {
      method: "GET",
      headers,
      next: { tags: ["recommendations"] },
    })
    .then((r) => r.recommendations ?? [])
    .catch(() => [])
}
