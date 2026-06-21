"use client"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const specs = getProductSpecs(product)

  const tabs = [
    product.description
      ? {
          label: "Descrição",
          component: <DescriptionTab product={product} />,
        }
      : null,
    specs.length > 0
      ? {
          label: "Características",
          component: <SpecsTab specs={specs} />,
        }
      : null,
  ].filter(Boolean) as { label: string; component: JSX.Element }[]

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const DescriptionTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-8">
      <p className="whitespace-pre-line">{product.description}</p>
    </div>
  )
}

type Spec = {
  label: string
  value: string
}

const getProductSpecs = (product: HttpTypes.StoreProduct): Spec[] => {
  const specs: Spec[] = []

  if (product.material) {
    specs.push({ label: "Material", value: product.material })
  }

  if (product.weight) {
    specs.push({ label: "Peso", value: `${product.weight} g` })
  }

  if (product.origin_country) {
    specs.push({ label: "País de origem", value: product.origin_country })
  }

  if (product.type?.value) {
    specs.push({ label: "Tipo", value: product.type.value })
  }

  if (product.length && product.width && product.height) {
    specs.push({
      label: "Dimensões",
      value: `${product.length} x ${product.width} x ${product.height}`,
    })
  }

  return specs
}

const SpecsTab = ({ specs }: { specs: Spec[] }) => {
  return (
    <div className="text-small-regular py-8">
      <table className="w-full">
        <tbody>
          {specs.map((spec) => (
            <tr
              key={spec.label}
              className="border-b border-ui-border-base last:border-b-0"
            >
              <th className="py-2 pr-4 text-left font-semibold align-top whitespace-nowrap">
                {spec.label}
              </th>
              <td className="py-2 text-ui-fg-subtle">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductTabs
