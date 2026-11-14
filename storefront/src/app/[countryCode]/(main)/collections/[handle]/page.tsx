import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import {
  getCollectionByHandle,
  getCollectionsList,
} from "@lib/data/collections"
import { getCategoryByHandle } from "@lib/data/categories"
import { getProductsList } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import {
  StoreCollection,
  StoreProductCategory,
  StoreRegion,
} from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { pageMetadata } from "@lib/util/seo"
import { collectionMetaDescription } from "@lib/util/listing-copy"
import {
  collectionCategoryTwin,
  listingCanonicalPath,
  listingPageTitle,
} from "@lib/util/seo-meta"

type Props = {
  params: { handle: string; countryCode: string }
  searchParams: {
    page?: string
    sortBy?: SortOptions
  }
}

export async function generateStaticParams() {
  try {
    const { collections } = await getCollectionsList()

    if (!collections) {
      return []
    }

    const countryCodes = await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string) =>
        collectionHandles.map((handle: string | undefined) => ({
          countryCode,
          handle,
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

/**
 * What the metadata needs beyond the collection itself: the same-handle
 * category it duplicates, if any (canonical target), and its first product
 * photo (social image). Fail-soft. Request-cached so the page awaits the same
 * promise: the shell then waits for it and the metadata lands in <head>
 * instead of being streamed into the body.
 */
const collectionSeo = cache(async function (
  collectionId: string,
  handle: string,
  countryCode: string
): Promise<{ twinHandle: string | null; image: string | null }> {
  const [categories, image] = await Promise.all([
    getCategoryByHandle([handle])
      .then((r) => r.product_categories)
      .catch(() => [] as StoreProductCategory[]),
    collectionImage(collectionId, countryCode),
  ])
  return {
    twinHandle: collectionCategoryTwin(handle, categories)?.handle ?? null,
    image,
  }
})

/** First product photo of a collection (fail-soft), for the social image. */
async function collectionImage(
  collectionId: string,
  countryCode: string
): Promise<string | null> {
  try {
    const {
      response: { products },
    } = await getProductsList({
      queryParams: {
        collection_id: [collectionId],
        limit: 24,
        fields: "id,thumbnail",
      },
      countryCode,
    })
    return products.find((p) => p.thumbnail)?.thumbnail ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  // A collection with a same-handle category (Diversey, Vileda…) duplicates
  // that category: canonicalise to it (the sitemap lists only the category).
  const { twinHandle, image } = await collectionSeo(
    collection.id,
    collection.handle,
    params.countryCode
  )

  return pageMetadata({
    path: twinHandle
      ? `categories/${twinHandle}`
      : listingCanonicalPath(
          `collections/${collection.handle}`,
          searchParams?.page
        ),
    title: listingPageTitle(collection.title, searchParams?.page),
    description: collectionMetaDescription(collection.title),
    images: image ? [image] : undefined,
  })
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  // Shared with generateMetadata (request-cached), see collectionSeo.
  await collectionSeo(collection.id, collection.handle, params.countryCode)

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
