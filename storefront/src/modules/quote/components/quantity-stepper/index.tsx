"use client"

import { clx } from "@medusajs/ui"
import { Minus, Plus } from "lucide-react"
import { useEffect, useState } from "react"

import {
  MAX_QUANTITY,
  MIN_QUANTITY,
  clampQuantity,
  parseQuantityInput,
} from "@lib/quote-list/state"

type Props = {
  value: number
  onChange: (value: number) => void
  /** Accessible name of the number field, e.g. "Quantidade de Drip Floor". */
  label: string
  /** Product name for the ± button labels when several steppers share a page. */
  itemName?: string
  id?: string
  /** lg = PDP (52px), md = list rows (44px). */
  size?: "lg" | "md"
  disabled?: boolean
  className?: string
  "data-testid"?: string
}

/**
 * − [n] + quantity control, integers 1–9999. The field accepts typing (digits
 * only); an empty or invalid entry snaps back on blur. ±buttons are 44px wide
 * touch targets with their own accessible names.
 */
export default function QuantityStepper({
  value,
  onChange,
  label,
  itemName,
  id,
  size = "md",
  disabled,
  className,
  "data-testid": testId,
}: Props) {
  const [text, setText] = useState(String(value))

  // Follow outside changes (another tab, "add" on the PDP) unless mid-edit.
  useEffect(() => {
    setText((t) => (parseQuantityInput(t) === value ? t : String(value)))
  }, [value])

  const h = size === "lg" ? "h-[52px]" : "h-11"
  const btn = clx(
    "flex w-11 flex-none items-center justify-center text-brand-ink transition-colors hover:bg-grey-10 disabled:cursor-not-allowed disabled:text-grey-30 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan",
    h
  )
  const set = (n: number) => {
    const q = clampQuantity(n)
    setText(String(q))
    if (q !== value) onChange(q)
  }

  return (
    <div
      className={clx(
        "flex flex-none items-center overflow-hidden rounded-pill border-[1.5px] border-hairline bg-white focus-within:border-brand-cyan focus-within:ring-4 focus-within:ring-brand-cyan/15",
        className
      )}
      data-testid={testId}
    >
      <button
        type="button"
        aria-label={itemName ? `Diminuir quantidade de ${itemName}` : "Diminuir quantidade"}
        onClick={() => set(value - 1)}
        disabled={disabled || value <= MIN_QUANTITY}
        className={btn}
        data-testid="quantity-decrease"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={label}
        value={text}
        disabled={disabled}
        maxLength={4}
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, "").slice(0, 4)
          setText(t)
          const n = parseQuantityInput(t)
          if (n !== null && n !== value) onChange(n)
        }}
        onBlur={() => {
          const n = parseQuantityInput(text)
          setText(String(n ?? value))
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault()
            set(value + 1)
          } else if (e.key === "ArrowDown") {
            e.preventDefault()
            set(value - 1)
          }
        }}
        className={clx(
          "w-12 min-w-0 bg-transparent text-center text-base font-bold text-brand-ink outline-none",
          h
        )}
        data-testid="quantity-input"
      />
      <button
        type="button"
        aria-label={itemName ? `Aumentar quantidade de ${itemName}` : "Aumentar quantidade"}
        onClick={() => set(value + 1)}
        disabled={disabled || value >= MAX_QUANTITY}
        className={btn}
        data-testid="quantity-increase"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
