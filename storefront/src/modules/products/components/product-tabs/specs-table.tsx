import type { SpecRow } from "@lib/util/product-specs"

/**
 * "Características" table. It is the only details section on the PDP, so it
 * renders open as a plain titled section (no accordion to expand).
 */
export default function SpecsTable({ rows }: { rows: SpecRow[] }) {
  return (
    <section
      aria-labelledby="product-specs-title"
      className="border-y border-hairline py-4"
    >
      <h2
        id="product-specs-title"
        className="px-1 text-base font-bold text-brand-ink"
      >
        Características
      </h2>
      <div className="px-1 pb-1 pt-2 text-sm">
        <table className="w-full">
          <tbody>
            {rows.map((spec) => (
              <tr
                key={spec.label}
                className="border-b border-hairline last:border-b-0"
              >
                <th
                  scope="row"
                  className="w-1/2 py-2.5 pr-4 text-left align-top font-semibold text-brand-ink small:w-2/5"
                >
                  {spec.label}
                </th>
                <td className="py-2.5 text-grey-60">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
