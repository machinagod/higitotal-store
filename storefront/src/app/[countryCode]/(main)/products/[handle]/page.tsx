import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import JsonLd from "@modules/common/components/json-ld"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { canonicalUrl, SITE_NAME } from "@lib/util/seo"
import { breadcrumbSchema, productSchema } from "@lib/util/structured-data"

type Props = {
  params: { countryCode: string; handle: string }
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then(
      (regions) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    if (!countryCodes) {
      return []
    }

    const products = await Promise.all(
      countryCodes.map((countryCode) => {
        return getProductsList({ countryCode })
      })
    ).then((responses) =>
      responses.map(({ response }) => response.products).flat()
    )

    const staticParams = countryCodes
      ?.map((countryCode) =>
        products.map((product) => ({
          countryCode,
          handle: product.handle,
        }))
      )
      .flat()

    return staticParams
  } catch (error) {
    // Backend unreachable at build time (e.g. hermetic Docker image build) —
    // skip prerendering; these routes render on demand instead.
    return []
  }
}

/** Trim a description to a meta-friendly length on a word boundary. */
function metaDescription(product: { description?: string | null; subtitle?: string | null; title: string }) {
  const source = (product.description || product.subtitle || product.title).trim()
  if (source.length <= 160) return source
  return source.slice(0, 157).replace(/\s+\S*$/, "") + "…"
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)

  if (!product) {
    notFound()
  }

  const canonical = await canonicalUrl(`products/${product.handle}`)
  const description = metaDescription(product)
  const images = product.thumbnail ? [product.thumbnail] : []

  return {
    title: product.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${product.title} · ${SITE_NAME}`,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} · ${SITE_NAME}`,
      description,
      images,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(params.handle, region.id)
  if (!pricedProduct) {
    notFound()
  }

  const canonical = await canonicalUrl(`products/${pricedProduct.handle}`)

  // Home > deepest category (with its parent, if any) > product.
  const leaf = pricedProduct.categories?.[0]
  const trail = [
    { name: SITE_NAME, url: await canonicalUrl("") },
    ...(leaf?.parent_category
      ? [
          {
            name: leaf.parent_category.name,
            url: await canonicalUrl(`categories/${leaf.parent_category.handle}`),
          },
        ]
      : []),
    ...(leaf
      ? [{ name: leaf.name, url: await canonicalUrl(`categories/${leaf.handle}`) }]
      : []),
    { name: pricedProduct.title, url: canonical },
  ]

  return (
    <>
      <JsonLd
        data={[
          productSchema({ product: pricedProduct, url: canonical }),
          breadcrumbSchema(trail),
        ]}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
      />
    </>
  )
}
