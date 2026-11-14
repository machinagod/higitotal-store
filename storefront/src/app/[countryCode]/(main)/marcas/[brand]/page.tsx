import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  brandOpenGraph,
  brandPageCopy,
  brandPageSchema,
  brandPageTitle,
} from "@lib/brand-pages"
import { BRANDS_PATH, brandBySlug, brandHref } from "@lib/brands"
import { absoluteUrl, canonicalUrl, SITE_NAME } from "@lib/util/seo"
import { resolveBrandProducts } from "@modules/brands/lib/brand-products"
import BrandPageTemplate from "@modules/brands/templates/brand-page"
import JsonLd from "@modules/common/components/json-ld"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: { brand: string; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

const path = (p: string) => p.replace(/^\//, "")

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = brandBySlug(params.brand)
  if (!brand) notFound()

  const { description } = brandPageCopy(brand)
  const title = brandPageTitle(brand.name)
  const canonical = await canonicalUrl(path(brandHref(brand)))

  // The site's default share image, not the (SVG) logo — see brandOpenGraph.
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: brandOpenGraph({
      title: typeof title === "string" ? `${title} · ${SITE_NAME}` : title.absolute,
      description,
      url: canonical,
    }),
  }
}

export default async function BrandPage({ params, searchParams }: Props) {
  const brand = brandBySlug(params.brand)
  if (!brand) notFound()

  const { sortBy, page } = searchParams
  const [products, url, homeUrl, indexUrl] = await Promise.all([
    resolveBrandProducts(brand),
    canonicalUrl(path(brandHref(brand))),
    canonicalUrl(""),
    canonicalUrl(path(BRANDS_PATH)),
  ])

  return (
    <>
      <JsonLd
        data={brandPageSchema({
          brand,
          url,
          homeUrl,
          indexUrl,
          logoUrl: brand.logo ? absoluteUrl(brand.logo.src) : undefined,
          description: brandPageCopy(brand).description,
        })}
      />
      <BrandPageTemplate
        brand={brand}
        products={products}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}
