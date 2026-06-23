import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import {
  Badge,
  Container,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  Heading,
  Text,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type Row = {
  id: string
  competitor?: { name?: string } | null
  title?: string | null
  product_sku?: string | null
  competitor_url?: string | null
  match_status?: string
  match_score?: number | null
  pack_label?: string | null
  last_error?: string | null
  latest_price?: {
    price?: number | null
    unit_price?: number | null
    our_price?: number | null
    currency_code?: string
    status?: string
    scraped_at?: string
  } | null
}

const money = (minor?: number | null, cur = "EUR") =>
  minor == null ? "—" : `${(minor / 100).toFixed(2)} ${cur}`

// Competitor unit price vs our price as a signed %. Positive = competitor dearer.
const deltaPct = (r: Row): number | null => {
  const ours = r.latest_price?.our_price
  const theirs = r.latest_price?.unit_price ?? r.latest_price?.price
  if (ours == null || theirs == null || ours === 0) return null
  return ((theirs - ours) / ours) * 100
}

const columnHelper = createDataTableColumnHelper<Row>()

const columns = [
  columnHelper.accessor("competitor.name", {
    header: "Competitor",
    cell: ({ row }) => (
      <Text size="small" weight="plus">
        {row.original.competitor?.name ?? "—"}
      </Text>
    ),
  }),
  columnHelper.display({
    id: "listing",
    header: "Listing",
    cell: ({ row }) =>
      row.original.competitor_url ? (
        <a
          href={row.original.competitor_url}
          target="_blank"
          rel="noreferrer"
          className="text-ui-fg-interactive line-clamp-1"
        >
          {row.original.title || row.original.competitor_url}
        </a>
      ) : (
        <Text size="small">{row.original.title || "—"}</Text>
      ),
  }),
  columnHelper.accessor("product_sku", {
    header: "Our SKU",
    cell: ({ getValue }) => (
      <Text size="small" className="text-ui-fg-subtle">
        {getValue() || "—"}
      </Text>
    ),
  }),
  columnHelper.display({
    id: "match",
    header: "Match",
    cell: ({ row }) => (
      <Badge size="2xsmall">
        {row.original.match_status}
        {row.original.match_score != null ? ` ${row.original.match_score}` : ""}
      </Badge>
    ),
  }),
  columnHelper.display({
    id: "our_price",
    header: "Our price",
    cell: ({ row }) => money(row.original.latest_price?.our_price),
  }),
  columnHelper.display({
    id: "competitor_price",
    header: "Competitor (unit)",
    cell: ({ row }) => (
      <div>
        {money(
          row.original.latest_price?.unit_price ?? row.original.latest_price?.price,
          row.original.latest_price?.currency_code
        )}
        {row.original.pack_label ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            {row.original.pack_label}
          </Text>
        ) : null}
      </div>
    ),
  }),
  columnHelper.display({
    id: "delta",
    header: "Δ",
    cell: ({ row }) => {
      const d = deltaPct(row.original)
      if (d == null) return "—"
      return (
        <Text
          size="small"
          className={d > 0 ? "text-ui-tag-green-text" : "text-ui-tag-red-text"}
        >
          {d > 0 ? "+" : ""}
          {d.toFixed(0)}%
        </Text>
      )
    },
  }),
  columnHelper.display({
    id: "status",
    header: "Scraped / status",
    cell: ({ row }) =>
      row.original.latest_price?.scraped_at ? (
        <Text size="small" className="text-ui-fg-subtle">
          {new Date(row.original.latest_price.scraped_at).toLocaleDateString()}
        </Text>
      ) : row.original.last_error ? (
        <Text size="xsmall" className="text-ui-fg-error line-clamp-1">
          {row.original.last_error}
        </Text>
      ) : (
        "—"
      ),
  }),
]

const PAGE_SIZE = 20

const CompetitorPricesPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["competitor-products"],
    queryFn: () =>
      sdk.client.fetch<{ competitor_products: Row[] }>(
        "/admin/competitor-products",
        { method: "GET" }
      ),
  })

  const all = data?.competitor_products ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r.competitor?.name, r.title, r.product_sku]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [all, search])

  const page = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pagination])

  const table = useDataTable({
    columns,
    data: page,
    rowCount: filtered.length,
    getRowId: (row) => row.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    search: { state: search, onSearchChange: setSearch },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 px-6 py-4 md:flex-row md:items-center">
          <div>
            <Heading>Competitor Prices</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Latest competitor price per mapped product, vs ours.
            </Text>
          </div>
          <DataTable.Search placeholder="Search competitor / product / SKU…" />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Competitor Prices",
  icon: CurrencyDollar,
})

export default CompetitorPricesPage
