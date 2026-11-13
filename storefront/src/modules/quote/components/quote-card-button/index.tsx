"use client"

import { clx } from "@medusajs/ui"
import { ClipboardCheck, ClipboardPlus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useQuoteList } from "@lib/quote-list/context"
import { QuoteProductInput } from "@lib/quote-list/state"

/** How long "Adicionado" shows before settling on "No orçamento". */
const JUST_ADDED_MS = 2200

/**
 * Product card CTA in catalog mode (outline, secondary to the PDP's solid
 * button). "Adicionar" puts 1 unit in the quote list; then it reads
 * "Adicionado" briefly and "No orçamento" while the product is in the list,
 * where a click opens the list instead of adding again. One <button>
 * throughout, so keyboard focus is never lost when the label changes.
 *
 * 320px phones leave ~100px for the label: semibold + tight tracking + no
 * side padding keeps every state on one line.
 */
export default function QuoteCardButton({
  product,
}: {
  product: QuoteProductInput
}) {
  const quote = useQuoteList()
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode?: string }
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const t = window.setTimeout(() => setJustAdded(false), JUST_ADDED_MS)
    return () => window.clearTimeout(t)
  }, [justAdded])

  if (!quote) return null
  const line = quote.find(product)
  const inList = !!line

  const onClick = () => {
    if (justAdded) return
    if (inList) {
      router.push(`/${countryCode ?? ""}/orcamento`)
      return
    }
    const res = quote.add(product, 1)
    if (res.status !== "full") setJustAdded(true)
  }

  const label = justAdded ? "Adicionado" : inList ? "No orçamento" : "Adicionar"
  const Icon = justAdded || inList ? ClipboardCheck : ClipboardPlus
  const ariaLabel = justAdded
    ? `${product.title} adicionado ao orçamento`
    : inList
    ? `${product.title} já está no orçamento (${line.quantity} un.). Ver orçamento`
    : `Adicionar ao orçamento: ${product.title}`

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid="card-add-to-quote"
      data-state={justAdded ? "added" : inList ? "in-list" : "idle"}
      className={clx(
        "relative z-10 flex h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-pill border-[1.5px] border-brand-cyan px-0.5 text-xs font-semibold tracking-[-0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 xsmall:px-2 xsmall:text-[13px] xsmall:font-bold xsmall:tracking-normal small:px-3 small:text-sm",
        justAdded || inList
          ? "bg-brand-cyan-50 text-brand-cyan-ink hover:bg-brand-cyan-100"
          : "bg-white text-brand-cyan-ink hover:bg-brand-cyan-50"
      )}
    >
      {/* Icon from 360px; the narrowest cards keep the label only. */}
      <Icon
        className="hidden h-4 w-4 flex-none min-[360px]:block"
        aria-hidden="true"
      />
      {label}
    </button>
  )
}
