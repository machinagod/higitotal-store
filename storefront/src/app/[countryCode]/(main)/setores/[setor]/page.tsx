import { DEFAULT_OG_IMAGE } from "@lib/util/seo"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { StoreRegion } from "@medusajs/types"

import { getRegion, listRegions } from "@lib/data/regions"
import {
  getBrandLinks,
  getLiveCategoryHandles,
  getSectorProducts,
} from "@lib/data/sectors"
import {
  SECTORS,
  SECTORS_PATH,
  getSector,
  sectorHref,
  sectorPageTitle,
} from "@lib/sectors"
import { canonicalUrl, SITE_NAME } from "@lib/util/seo"
import { breadcrumbSchema } from "@lib/util/structured-data"
import JsonLd from "@modules/common/components/json-ld"
import { sectorOgImage } from "@modules/sectors/sector-images"
import SectorTemplate from "@modules/sectors/templates/sector-page"

type Props = {
  params: Promise<{ countryCode: string; setor: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )
    return (countryCodes ?? [])
      .filter(Boolean)
      .flatMap((countryCode) =>
        SECTORS.map((s) => ({ countryCode, setor: s.slug }))
      )
  } catch {
    // Backend unreachable at build time (hermetic Docker build): render on
    // demand instead.
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setor } = await params
  const sector = getSector(setor)
  if (!sector) notFound()

  const { title, withSuffix } = sectorPageTitle(sector)
  const canonical = await canonicalUrl(sectorHref(sector).slice(1))
  const ogImage = sectorOgImage(sector.slug) ?? DEFAULT_OG_IMAGE

  return {
    // Within 60 characters: keep the layout's " · Higitotal" suffix when it
    // fits, otherwise an absolute title without it.
    title: withSuffix ? sector.title : { absolute: title },
    description: sector.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: sector.description,
      url: canonical,
      images: [ogImage],
    },
  }
}

export default async function SectorPage({ params }: Props) {
  const { countryCode, setor } = await params
  const sector = getSector(setor)
  if (!sector) notFound()

  const [region, liveHandles, brandLinks, products] = await Promise.all([
    getRegion(countryCode).catch(() => undefined),
    getLiveCategoryHandles(),
    getBrandLinks(),
    getSectorProducts(sector.featuredCategories, countryCode).catch(() => []),
  ])

  const sectorUrl = await canonicalUrl(sectorHref(sector).slice(1))
  const trail = [
    { name: SITE_NAME, url: await canonicalUrl("") },
    { name: "Setores", url: await canonicalUrl(SECTORS_PATH.slice(1)) },
    { name: sector.name, url: sectorUrl },
  ]

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(trail),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: sector.h1,
            description: sector.description,
            url: sectorUrl,
            inLanguage: "pt-PT",
          },
        ]}
      />
      <SectorTemplate
        sector={sector}
        region={region ?? undefined}
        products={region ? products : []}
        liveHandles={liveHandles}
        brandLinks={brandLinks}
      />
    </>
  )
}
