import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import RecommendedForYou from "@modules/account/components/recommended-for-you"
import { notFound } from "next/navigation"
import { getCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getRecommendations } from "@lib/data/recommendations"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
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
