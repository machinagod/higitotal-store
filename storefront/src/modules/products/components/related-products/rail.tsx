import { HttpTypes } from "@medusajs/types"
import ProductPreview from "../product-preview"

/**
 * A titled row of product cards under the PDP (eyebrow + h2, as on the home
 * page). No `content-container` of its own: the product template already
 * wraps it in one, so adding another would double the side padding.
 */
export default function ProductRail({
  eyebrow,
  title,
  products,
  region,
  "data-testid": dataTestId,
}: {
  eyebrow: string
  title: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  "data-testid"?: string
}) {
  if (!products.length) return null

  return (
    <section aria-labelledby={`${dataTestId ?? "rail"}-title`} data-testid={dataTestId}>
      <div className="mb-6 flex flex-col gap-1 small:mb-7">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
          <span className="ind" />
          {eyebrow}
        </span>
        <h2
          id={`${dataTestId ?? "rail"}-title`}
          className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[28px]"
        >
          {title}
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-4 small:grid-cols-4 small:gap-x-6 small:gap-y-8">
        {products.map((p) => (
          <li key={p.id}>
            <ProductPreview region={region} product={p} />
          </li>
        ))}
      </ul>
    </section>
  )
}
