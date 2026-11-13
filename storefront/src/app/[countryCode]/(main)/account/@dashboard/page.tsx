import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import RecommendedForYou from "@modules/account/components/recommended-for-you"
import { notFound } from "next/navigation"
import { getCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getRecommendations } from "@lib/data/recommendations"

// Parallel-route slot pages don't receive the root " · Higitotal" title
// template, so the account titles are absolute (never duplicated either way).
export const metadata: Metadata = {
  title: { absolute: "A minha conta · Higitotal" },
  description: "Visão geral da sua conta Higitotal.",
}

export default async function OverviewTemplate() {
  const customer = await getCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null
  const recommendations = await getRecommendations().catch(() => [])

  if (!customer) {
    notFound()
  }

  return (
    <>
      <Overview customer={customer} orders={orders} />
      <RecommendedForYou recommendations={recommendations} />
    </>
  )
}
