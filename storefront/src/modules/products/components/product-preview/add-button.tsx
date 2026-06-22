"use client"

import { useState } from "react"
import { addToCart } from "@lib/data/cart"
import { ShoppingBag, Check, Loader2, Clock } from "lucide-react"

/**
 * Compact add-to-cart icon button for product cards. Adds the product's (single,
 * default) variant straight to the cart — no PDP round-trip — and shows a brief
 * confirmation. Stops propagation so it doesn't trigger the card's link.
 *
 * Out-of-stock variants are still addable (backorder / "sob encomenda") but show a
 * clock icon instead of the bag to signal the lead time.
 */
const ProductCardAddButton = ({
  variantId,
  inStock = true,
  countryCode,
}: {
  variantId?: string
  inStock?: boolean
  countryCode: string
}) => {
  const [state, setState] = useState<"idle" | "adding" | "done">("idle")

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!variantId || state === "adding") return
    setState("adding")
    try {
      await addToCart({ variantId, quantity: 1, countryCode })
      setState("done")
      setTimeout(() => setState("idle"), 1500)
    } catch {
      setState("idle")
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!variantId || state === "adding"}
      aria-label={inStock ? "Adicionar ao carrinho" : "Adicionar (sob encomenda)"}
      title={inStock ? undefined : "Sob encomenda"}
      data-testid="card-add-to-cart"
      className="flex h-10 w-10 flex-none items-center justify-center rounded-btn bg-brand-ink text-white transition-colors hover:bg-brand-cyan disabled:opacity-60"
    >
      {state === "adding" ? (
        <Loader2 className="h-[18px] w-[18px] animate-spin" />
      ) : state === "done" ? (
        <Check className="h-[18px] w-[18px]" />
      ) : inStock ? (
        <ShoppingBag className="h-[18px] w-[18px]" />
      ) : (
        <Clock className="h-[18px] w-[18px]" />
      )}
    </button>
  )
}

export default ProductCardAddButton
