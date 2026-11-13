"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  catalogMode?: boolean
  'data-testid'?: string
}

const RefinementList = ({
  sortBy,
  search,
  catalogMode,
  'data-testid': dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      // A new order starts from the first page.
      params.delete("page")

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  return (
    <SortProducts
      sortBy={sortBy}
      setQueryParams={setQueryParams}
      catalogMode={catalogMode}
      search={search}
      data-testid={dataTestId}
    />
  )
}

export default RefinementList
