import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { productCountLabel } from "@lib/util/listing-copy"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  showCount = true,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string | string[]
  productsIds?: string[]
  countryCode: string
  /** Show the "123 produtos" line above the grid. */
  showCount?: boolean
}) {
  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    // Accept a single id or a set (a category + its descendants) so a top-level
    // category lists products from all of its sub-categories.
    queryParams["category_id"] = Array.isArray(categoryId)
      ? categoryId
      : [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await getProductsListWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  if (!count) {
    return (
      <div className="rounded-card border border-hairline bg-white px-6 py-12 text-center">
        <p className="text-base font-semibold text-brand-ink">
          Ainda não há produtos publicados nesta secção.
        </p>
        <p className="mt-2 text-sm text-grey-60">
          Veja o catálogo completo ou contacte-nos para saber o que temos disponível.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <LocalizedClientLink
            href="/store"
            className="flex h-11 items-center rounded-pill bg-brand-cyan px-5 text-sm font-bold text-white transition-colors hover:bg-brand-cyan-ink"
          >
            Ver catálogo
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/contact"
            className="flex h-11 items-center rounded-pill border border-hairline px-5 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"
          >
            Fale connosco
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <>
      {showCount && (
        <p className="mb-4 text-sm text-grey-60" data-testid="products-count">
          {productCountLabel(count)}
          {totalPages > 1 && (
            <span className="text-grey-40">
              {" "}
              · página {Math.min(Math.max(page, 1), totalPages)} de {totalPages}
            </span>
          )}
        </p>
      )}
      <ul
        className="grid w-full grid-cols-2 gap-x-3 gap-y-4 small:grid-cols-3 small:gap-x-6 small:gap-y-8 medium:grid-cols-4"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
