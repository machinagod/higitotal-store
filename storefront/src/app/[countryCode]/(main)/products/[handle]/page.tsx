import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import JsonLd from "@modules/common/components/json-ld"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { canonicalUrl, pageMetadata, SITE_NAME } from "@lib/util/seo"
import { productMetaDescription, productSeoTitle } from "@lib/util/seo-meta"
import { breadcrumbSchema, productSchema } from "@lib/util/structured-data"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

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

  // Title: "<product> – <manufacturer ref> · Higitotal", the ref only when the
  // SKU is one and the site name only when it fits (see productSeoTitle).
  // Products without a photo get the site's default social image; Twitter
  // inherits the Open Graph title/description/image.
  return pageMetadata({
    path: `products/${product.handle}`,
    title: product.title,
    fullTitle: productSeoTitle(product.title, product.variants?.[0]?.sku),
    description: productMetaDescription(product),
    images: product.thumbnail ? [product.thumbnail] : undefined,
  })
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
  // Internal bookkeeping groups (EQ_/ML_…) are skipped; others use their
  // customer-facing names (same rules as the visible breadcrumb).
  const leaf = pricedProduct.categories?.[0]
  const categoryCrumbs = [leaf?.parent_category, leaf].filter(
    (c): c is NonNullable<typeof c> => !!c && !isInternalCategory(c.name)
  )
  const trail = [
    { name: SITE_NAME, url: await canonicalUrl("") },
    ...(await Promise.all(
      categoryCrumbs.map(async (c) => ({
        name: displayCategoryName(c.name),
        url: await canonicalUrl(`categories/${c.handle}`),
      }))
    )),
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
