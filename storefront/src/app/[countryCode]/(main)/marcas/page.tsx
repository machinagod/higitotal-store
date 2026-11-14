import { Metadata } from "next"

import {
  BRANDS_INDEX_COPY,
  brandIndexSchema,
  brandOpenGraph,
} from "@lib/brand-pages"
import { BRANDS, BRANDS_PATH, brandHref } from "@lib/brands"
import { canonicalUrl, SITE_NAME } from "@lib/util/seo"
import BrandsIndexTemplate from "@modules/brands/templates/brands-index"
import JsonLd from "@modules/common/components/json-ld"

const path = (p: string) => p.replace(/^\//, "")

export async function generateMetadata(): Promise<Metadata> {
  const canonical = await canonicalUrl(path(BRANDS_PATH))
  return {
    // The root layout's title template appends " · Higitotal".
    title: BRANDS_INDEX_COPY.title,
    description: BRANDS_INDEX_COPY.description,
    alternates: { canonical },
    openGraph: brandOpenGraph({
      title: `${BRANDS_INDEX_COPY.title} · ${SITE_NAME}`,
      description: BRANDS_INDEX_COPY.description,
      url: canonical,
    }),
  }
}

export default async function BrandsIndexPage() {
  const [url, homeUrl, items] = await Promise.all([
    canonicalUrl(path(BRANDS_PATH)),
    canonicalUrl(""),
    Promise.all(
      BRANDS.map(async (b) => ({
        name: b.name,
        url: await canonicalUrl(path(brandHref(b))),
      }))
    ),
  ])

  return (
    <>
      <JsonLd
        data={brandIndexSchema({
          url,
          homeUrl,
          description: BRANDS_INDEX_COPY.description,
          items,
        })}
      />
      <BrandsIndexTemplate />
    </>
  )
}
