import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCategoryByHandle,
  getCategoryById,
  listCategories,
} from "@lib/data/categories"
import { isInternalCategory } from "@lib/util/category-display"
import { categoryMetaDescription } from "@lib/util/listing-copy"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate, {
  categoryPageTitle,
} from "@modules/categories/templates"
import JsonLd from "@modules/common/components/json-ld"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { canonicalUrl, SITE_NAME } from "@lib/util/seo"
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(params.category)
    const category = product_categories[product_categories.length - 1]
    const title = categoryPageTitle(category)
    const description =
      category.description?.trim() || categoryMetaDescription(title)

    const canonical = await canonicalUrl(
      `categories/${params.category.join("/")}`
    )

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        title: `${title} · ${SITE_NAME}`,
        description,
        url: canonical,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(params.category)

  if (!product_categories?.length) {
    notFound()
  }

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

