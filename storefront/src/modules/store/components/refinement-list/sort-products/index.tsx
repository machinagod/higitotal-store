"use client"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  { value: "created_at", label: "Mais recentes" },
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
}: SortProductsProps) => {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-grey-60">
      <span className="hidden xsmall:inline">Ordenar por</span>
      <select
        value={sortBy}
        onChange={(e) => setQueryParams("sortBy", e.target.value as SortOptions)}
        aria-label="Ordenar por"
        data-testid={dataTestId}
        className="rounded-pill border-[1.5px] border-hairline bg-white px-4 py-2 text-sm font-medium text-brand-ink outline-none transition focus:border-brand-cyan"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default SortProducts
