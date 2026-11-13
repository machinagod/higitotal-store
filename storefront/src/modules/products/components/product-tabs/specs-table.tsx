"use client"

import type { SpecRow } from "@lib/util/product-specs"

import Accordion from "./accordion"

/** Client half of ProductTabs (the accordion needs Radix on the client). */
export default function SpecsAccordion({ rows }: { rows: SpecRow[] }) {
  return (
    <Accordion type="multiple" defaultValue={["Características"]}>
      <Accordion.Item
        title="Características"
        headingSize="medium"
        value="Características"
      >
        <div className="pb-4 pt-2 text-sm">
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
      </Accordion.Item>
    </Accordion>
  )
}
