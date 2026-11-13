"use client"

import { ArrowRight } from "lucide-react"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-8 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-gray-200 pb-6 last:pb-0 last:border-none"
          >
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-start gap-y-3 rounded-card border border-hairline bg-[#f7f9fb] p-6 small:p-8"
      data-testid="no-orders-container"
    >
      <h2 className="text-lg font-bold text-brand-ink">
        Sem encomendas registadas
      </h2>
      <p className="text-sm text-grey-60">
        As encomendas associadas à sua conta aparecem aqui.
      </p>
      <LocalizedClientLink
        href="/store"
        className="mt-2 inline-flex items-center gap-2 rounded-pill bg-brand-cyan px-6 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-transform hover:-translate-y-0.5"
        data-testid="continue-shopping-button"
      >
        Ver catálogo
        <ArrowRight className="h-4 w-4" />
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
