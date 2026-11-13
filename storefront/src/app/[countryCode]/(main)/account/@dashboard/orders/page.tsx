import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"

// Parallel-route slot pages don't receive the root " · Higitotal" title
// template, so the account titles are absolute (never duplicated either way).
export const metadata: Metadata = {
  title: { absolute: "Encomendas · Higitotal" },
  description: "Consulte as suas encomendas anteriores.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink">
          Encomendas
        </h1>
        <p className="text-base-regular text-grey-60">
          Consulte as suas encomendas anteriores e o respetivo estado. Para
          devoluções ou trocas, contacte a nossa equipa.
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} />
      </div>
    </div>
  )
}
