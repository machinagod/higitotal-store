import { MetadataRoute } from "next"

import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { getProductsList } from "@lib/data/products"
import { absoluteUrl, getCanonicalCountryCode } from "@lib/util/seo"

// Regenerate hourly so newly published products/categories appear without a
// redeploy, while still serving a cached sitemap to crawlers.
export const revalidate = 3600

const PAGE_SIZE = 100
const MAX_PAGES = 100 // hard cap (~10k products) to bound build/crawl cost

/** Walk the paginated product list until exhausted (or the page cap). */
async function getAllProducts(countryCode: string) {
  const products: { handle?: string | null; updated_at?: string | null }[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const {
      response: { products: batch },
      nextPage,
    } = await getProductsList({
      pageParam: page,
      countryCode,
      queryParams: { limit: PAGE_SIZE, fields: "handle,updated_at" } as any,
    })

    products.push(...batch)
    if (!nextPage || batch.length === 0) break
  }

  return products
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countryCode = await getCanonicalCountryCode()
  const prefix = (path: string) => absoluteUrl(`/${countryCode}/${path}`)
  const now = new Date()

  // Static, indexable marketing/content routes.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl(`/${countryCode}`), changeFrequency: "daily", priority: 1 },
    { url: prefix("store"), changeFrequency: "daily", priority: 0.9 },
    { url: prefix("assistencia-tecnica"), changeFrequency: "monthly", priority: 0.7 },
    { url: prefix("contact"), changeFrequency: "yearly", priority: 0.5 },
    { url: prefix("customer-service"), changeFrequency: "yearly", priority: 0.4 },
    { url: prefix("content/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
    { url: prefix("content/terms-of-use"), changeFrequency: "yearly", priority: 0.2 },
  ].map((e) => ({ lastModified: now, ...e }))

  // Catalog routes — fail soft so a backend hiccup never empties the sitemap.
  let products: MetadataRoute.Sitemap = []
  let categories: MetadataRoute.Sitemap = []
  let collections: MetadataRoute.Sitemap = []

  try {
    const all = await getAllProducts(countryCode)
    products = all
      .filter((p) => p.handle)
      .map((p) => ({
        url: prefix(`products/${p.handle}`),
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }))
  } catch {
    // ignore — keep whatever else resolved
  }

  try {
    const cats = await listCategories()
    categories = (cats ?? [])
      .filter((c: any) => c?.handle)
      .map((c: any) => ({
        url: prefix(`categories/${c.handle}`),
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch {
    // ignore
  }

  try {
    const { collections: cols } = await getCollectionsList(0, 100)
    collections = (cols ?? [])
      .filter((c) => c?.handle)
      .map((c) => ({
        url: prefix(`collections/${c.handle}`),
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
  } catch {
    // ignore
  }

  return [...staticEntries, ...categories, ...collections, ...products]
}
