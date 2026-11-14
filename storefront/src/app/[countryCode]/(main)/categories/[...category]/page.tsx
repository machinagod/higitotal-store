import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import {
  collectCategoryIds,
  getCategoryByHandle,
  getCategoryById,
  listCategories,
  preferCurated,
} from "@lib/data/categories"
import { getProductsList } from "@lib/data/products"
import { isInternalCategory } from "@lib/util/category-display"
import {
  categoryLabel,
  categoryMetaDescription,
  categoryParentLabel,
  categorySeoTitle,
  listingCanonicalPath,
  listingPageTitle,
} from "@lib/util/seo-meta"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate, {
  categoryPageTitle,
} from "@modules/categories/templates"
import JsonLd from "@modules/common/components/json-ld"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { canonicalUrl, pageMetadata, SITE_NAME } from "@lib/util/seo"
import { breadcrumbSchema } from "@lib/util/structured-data"

type Props = {
  params: { category: string[]; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateStaticParams() {
  try {
    const product_categories = await listCategories()

    if (!product_categories) {
      return []
    }

    const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    const categoryHandles = product_categories.map(
      (category: any) => category.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string | undefined) =>
        categoryHandles.map((handle: any) => ({
          countryCode,
          category: [handle],
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
 * Parent chain (root first) of a category reached by its own handle — the
 * route usually names only the leaf (`/categories/toalhas-de-maos`), so the
 * breadcrumb walks up via `parent_category`. Also returns the immediate
 * parent's children (the category's siblings, itself included) so a leaf can
 * offer "jump to a sibling" chips. Bounded and fail-soft.
 */
async function getAncestors(category: StoreProductCategory | undefined): Promise<{
  chain: { name: string; handle: string | null }[]
  siblings: StoreProductCategory[]
}> {
  const chain: { name: string; handle: string | null }[] = []
  let siblings: StoreProductCategory[] = []
  let current = category ? await getCategoryById(category.id) : null
  for (let depth = 0; depth < 5 && current?.parent_category; depth++) {
    const parent = await getCategoryById(current.parent_category.id)
    if (!parent) break
    if (depth === 0) {
      // Same (merchandising) order as the parent page's own chips; this
      // request is the one the parent page makes, so it is usually cached.
      const ordered = parent.handle
        ? await getCategoryByHandle([parent.handle])
            .then((r) => r.product_categories?.[0]?.category_children)
            .catch(() => undefined)
        : undefined
      siblings = ordered ?? parent.category_children ?? []
    }
    chain.unshift({ name: parent.name, handle: parent.handle ?? null })
    current = parent
  }
  return { chain, siblings }
}

/**
 * Product count of a category (with its sub-categories) and the first product
 * photo, for the meta description and the social image. Fail-soft: the page
 * still gets its metadata (default image, no count) if the listing fails.
 *
 * Request-cached on primitive keys (the comma-joined category ids) so the page
 * can await the very same promise: the HTML shell then waits for it, and the
 * metadata — resolved by then — lands in <head> instead of being streamed
 * into the body after it.
 */
const categoryListingSummary = cache(async function (
  categoryIds: string,
  countryCode: string
): Promise<{ count: number | null; image: string | null }> {
  try {
    const {
      response: { products, count },
    } = await getProductsList({
      queryParams: {
        category_id: categoryIds.split(","),
        limit: 24,
        fields: "id,thumbnail,collection_id",
      },
      countryCode,
    })
    const image = preferCurated(products).find((p) => p.thumbnail)?.thumbnail
    return { count, image: image ?? null }
  } catch {
    return { count: null, image: null }
  }
})

const summaryFor = (category: StoreProductCategory, countryCode: string) =>
  categoryListingSummary(collectCategoryIds(category).join(","), countryCode)

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  let category: StoreProductCategory | undefined
  try {
    const { product_categories } = await getCategoryByHandle(params.category)
    category = product_categories[product_categories.length - 1]
  } catch {
    // handled below
  }
  if (!category) notFound()

  // The by-handle lookup (with the descendant tree) carries no parent; fetch
  // it by id so sub-categories get unique titles ("Lavandaria — Diversey").
  const [byId, { count, image }] = await Promise.all([
    getCategoryById(category.id).catch(() => null),
    summaryFor(category, params.countryCode),
  ])
  const withParent = {
    ...category,
    parent_category: byId?.parent_category ?? null,
  }
  const description =
    category.description?.trim() ||
    categoryMetaDescription(categoryLabel(withParent), {
      parent: categoryParentLabel(withParent),
      count,
    })

  return pageMetadata({
    path: listingCanonicalPath(
      `categories/${params.category.join("/")}`,
      searchParams?.page
    ),
    title: listingPageTitle(categorySeoTitle(withParent), searchParams?.page),
    description,
    images: image ? [image] : undefined,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(params.category)

  if (!product_categories?.length) {
    notFound()
  }

  // Shared with generateMetadata (request-cached), awaited alongside the
  // ancestors so the metadata is ready when the shell flushes (see above).
  const summary = summaryFor(
    product_categories[product_categories.length - 1],
    params.countryCode
  )

  const { chain: ancestors, siblings: parentChildren } =
    product_categories.length === 1
      ? await getAncestors(product_categories[0]).catch(() => ({
          chain: [],
          siblings: [] as StoreProductCategory[],
        }))
      : {
          chain: [],
          // Multi-segment URL: the parent is the previous segment.
          siblings:
            product_categories[product_categories.length - 2]
              ?.category_children ?? [],
        }
  await summary

  const trail = [
    { name: SITE_NAME, url: await canonicalUrl("") },
    ...(await Promise.all(
      [...ancestors, ...(product_categories as StoreProductCategory[])]
        .filter((c) => c.handle && !isInternalCategory(c.name))
        .map(async (c) => ({
          name: categoryPageTitle(c),
          url: await canonicalUrl(`categories/${c.handle}`),
        }))
    )),
  ]

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <CategoryTemplate
        categories={product_categories}
        ancestors={ancestors}
        siblings={parentChildren}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}

