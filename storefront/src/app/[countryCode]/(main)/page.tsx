import { Metadata } from "next"
import { HttpTypes } from "@medusajs/types"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import TrustBar from "@modules/home/components/trust-bar"
import CategoryCards from "@modules/home/components/category-cards"
import AtFeature from "@modules/home/components/at-feature"
import Suppliers from "@modules/home/components/suppliers"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { getCollectionByHandle } from "@lib/data/collections"
import {
  collectCategoryIds,
  getCategoryByHandle,
  getNavCategories,
  preferCurated,
} from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import { SLIDES } from "@modules/home/components/hero/featured-slides"
import { canonicalUrl, SITE_DESCRIPTION, SITE_NAME } from "@lib/util/seo"

/** Collection whose first product photo anchors the hero. */
const HERO_COLLECTION = "fornos-profissionais"
/**
 * Further hero shots, after the oven: one per line of business, chosen for
 * clean cut-out photos that read on the blue hero (machines, Diversey,
 * Unilever, dishwashing). Missing/unpublished handles are skipped.
 */
const HERO_ROTATION_HANDLES = [
  "n9084701010-162699338", // Varredora Automática SW 750 B Nilfisk
  "100833185-159975999", // Suma Auto Oven 2em1 DA9.10 (Diversey)
  "n50000579-159981035", // Lavadora AS 4325B Full Viper
  "100958290-159976088", // CIF PF Multiusos Maçã 5L (Unilever)
  "7515206-159976839", // Sun Professional Tablets All in E-Tabs
]
/** Products in the "Produtos em destaque" rail (two rows of four). */
const FEATURED_COUNT = 8

export async function generateMetadata(): Promise<Metadata> {
  const canonical = await canonicalUrl("")
  const title = `${SITE_NAME} · Higiene profissional e assistência técnica`

  return {
    title: { absolute: title },
    description: SITE_DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: SITE_DESCRIPTION,
      url: canonical,
    },
  }
}

/** First products of a collection (empty when it is missing or unpublished). */
async function collectionProducts(
  handle: string,
  countryCode: string,
  limit: number
): Promise<HttpTypes.StoreProduct[]> {
  const collection = await getCollectionByHandle(handle).catch(() => null)
  if (!collection?.id) return []
  const {
    response: { products },
  } = await getProductsList({
    queryParams: { collection_id: [collection.id], limit },
    countryCode,
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))
  return products
}

/**
 * A varied "featured" mix: one image-bearing product from each top-level
 * category (incl. its sub-categories), in nav order — so the rail shows a
 * detergent, a utensil, a machine, paper… rather than several near-identical
 * items from one range. Skips `excludeId` (the hero's product) and tops up from
 * the general catalogue if too few categories have photographed products.
 */
async function featuredMix(
  countryCode: string,
  excludeId?: string
): Promise<HttpTypes.StoreProduct[]> {
  const categories = await getNavCategories().catch(() => [])
  const picks = await Promise.all(
    categories.map(async (cat) => {
      const handle = cat.href.split("/").pop() as string
      try {
        const { product_categories } = await getCategoryByHandle([handle])
        const ids = collectCategoryIds(product_categories?.[0])
        if (!ids.length) return undefined
        const {
          response: { products },
        } = await getProductsList({
          queryParams: { category_id: ids, limit: 50 },
          countryCode,
        })
        return preferCurated(products).find(
          (p) => p.thumbnail && p.id !== excludeId
        )
      } catch {
        return undefined
      }
    })
  )

  const seen = new Set<string>(excludeId ? [excludeId] : [])
  const mix: HttpTypes.StoreProduct[] = []
  for (const p of picks) {
    if (p && !seen.has(p.id) && mix.length < FEATURED_COUNT) {
      seen.add(p.id)
      mix.push(p)
    }
  }

  if (mix.length < FEATURED_COUNT) {
    const {
      response: { products: pool },
    } = await getProductsList({ queryParams: { limit: 60 }, countryCode })
    for (const p of pool) {
      if (mix.length >= FEATURED_COUNT) break
      if (p.thumbnail && !seen.has(p.id)) {
        seen.add(p.id)
        mix.push(p)
      }
    }
  }

  // Full rows only (4 per row on desktop, 2 on mobile).
  return mix.length >= 4 ? mix.slice(0, mix.length - (mix.length % 4)) : mix
}

export default async function Home({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Hero product shot: the first photographed product of the hero collection.
  const heroProduct = (
    await collectionProducts(HERO_COLLECTION, countryCode, 4)
  ).find((p) => p.thumbnail)

  const rotation = await Promise.all(
    HERO_ROTATION_HANDLES.map((h) =>
      getProductByHandle(h, region.id).catch(() => undefined)
    )
  )
  const heroImages = [
    heroProduct?.thumbnail,
    ...rotation.map((p) => p?.thumbnail),
  ].filter((src, i, all): src is string => !!src && all.indexOf(src) === i)

  const featured = await featuredMix(countryCode, heroProduct?.id)

  // A representative product image per hero carousel range, so the carousel
  // shows product imagery — including on mobile, where the big hero shot is
  // hidden. Avoids reusing the hero's own photo; empty/draft collections
  // resolve to undefined, leaving that slide text-only.
  const carouselImages = Object.fromEntries(
    await Promise.all(
      SLIDES.map(async (slide) => {
        const products = await collectionProducts(slide.handle, countryCode, 4)
        const pick =
          products.find((p) => p.thumbnail && p.id !== heroProduct?.id) ??
          products.find((p) => p.thumbnail)
        return [slide.handle, pick?.thumbnail ?? undefined] as const
      })
    )
  )

  return (
    <div className="content-container flex flex-col gap-8 py-3 small:gap-16 small:py-10">
      <div className="flex flex-col gap-2.5 small:gap-5">
        <Hero images={heroImages} carouselImages={carouselImages} />
        <TrustBar />
      </div>

      <CategoryCards countryCode={countryCode} />

      {featured.length > 0 && (
        <section>
          <div className="mb-[18px] flex flex-col items-start gap-1 small:mb-7 small:flex-row small:items-end small:justify-between small:gap-5">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan-ink">
                <span className="ind" />
                Destaques
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[34px]">
                Produtos em destaque
              </h2>
            </div>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-cyan-ink hover:text-brand-ink small:text-xs"
            >
              Ver catálogo
              <span aria-hidden>→</span>
            </LocalizedClientLink>
          </div>
          <FeaturedProducts products={featured} region={region} />
        </section>
      )}

      <AtFeature />

      <Suppliers />
    </div>
  )
}
