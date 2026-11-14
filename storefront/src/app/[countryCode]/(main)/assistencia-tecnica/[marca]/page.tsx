import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  brandServiceBreadcrumbs,
  brandServiceFaqSchema,
  brandServiceMetadata,
  brandServicePath,
  brandServiceSchema,
  brandServiceStaticParams,
  getBrandServicePage,
} from "@lib/brand-service-pages"
import { listRegions } from "@lib/data/regions"
import { canonicalUrl } from "@lib/util/seo"
import { breadcrumbSchema } from "@lib/util/structured-data"
import JsonLd from "@modules/common/components/json-ld"
import BrandServicePageTemplate from "@modules/assistencia/templates/brand-service-page"

type Props = {
  params: Promise<{ countryCode: string; marca: string }>
}

/** Every region × Fagor / Sammic / Nilfisk / Viper; unknown brands 404. */
export async function generateStaticParams() {
  try {
    const regions = await listRegions()
    const countryCodes = (regions ?? [])
      .flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
      .filter(Boolean) as string[]
    return brandServiceStaticParams(countryCodes)
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { marca } = await params
  const page = getBrandServicePage(marca)
  if (!page) notFound()
  const canonical = await canonicalUrl(brandServicePath(page.slug))
  return brandServiceMetadata(page, canonical)
}

export default async function BrandServiceRoute({ params }: Props) {
  const { marca } = await params
  const page = getBrandServicePage(marca)
  if (!page) notFound()

  const canonical = await canonicalUrl(brandServicePath(page.slug))
  const root = await canonicalUrl()

  return (
    <>
      <JsonLd
        data={[
          brandServiceSchema(page, canonical),
          brandServiceFaqSchema(page),
          breadcrumbSchema(brandServiceBreadcrumbs(page, root)),
        ]}
      />
      <BrandServicePageTemplate page={page} />
    </>
  )
}
