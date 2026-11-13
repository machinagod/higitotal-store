"use client"

import type { SortOptions } from "@lib/util/sort-products"

export type { SortOptions }

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  /** Catalog mode: no prices, so no price sorts. */
  catalogMode?: boolean
  /** Search results: offer (and default to) relevance. */
  search?: boolean
  "data-testid"?: string
}

const ALL_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "relevance", label: "Relevância" },
  { value: "created_at", label: "Mais recentes" },
  { value: "name_asc", label: "Nome (A–Z)" },
  { value: "price_asc", label: "Preço: mais baixo" },
  { value: "price_desc", label: "Preço: mais alto" },
]

/**
 * Compact sort control — a single-row dropdown so it doesn't eat vertical space
 * (previously a stacked radio group in a sidebar, tall on mobile).
 */
const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
  catalogMode = false,
  search = false,
}: SortProductsProps) => {
  const options = ALL_OPTIONS.filter(
    (o) =>
      (search || o.value !== "relevance") &&
      (!catalogMode || (o.value !== "price_asc" && o.value !== "price_desc"))
  )

  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-grey-60">
      <span className="hidden xsmall:inline">Ordenar por</span>
      <select
        value={sortBy}
        onChange={(e) => setQueryParams("sortBy", e.target.value as SortOptions)}
        aria-label="Ordenar por"
        data-testid={dataTestId}
        className="h-11 rounded-pill border-[1.5px] border-hairline bg-white px-4 text-sm font-medium text-brand-ink outline-none transition focus:border-brand-cyan"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default SortProducts
