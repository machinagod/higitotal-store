import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Buildings } from "@medusajs/icons"
import {
  Container,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  DataTableRowSelectionState,
  Heading,
  Text,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type CustomerRow = {
  id: string
  email: string
  company_name?: string | null
  first_name?: string | null
  last_name?: string | null
  created_at: string
}

const columnHelper = createDataTableColumnHelper<CustomerRow>()

// Company is the headline column by default (these are mostly B2B/company
// customers imported from Moloni).
const columns = [
  columnHelper.accessor("company_name", {
    header: "Company",
    cell: ({ getValue }) => (
      <Text size="small" weight="plus">
        {getValue() || "—"}
      </Text>
    ),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => (
      <Text size="small" className="text-ui-fg-subtle">
        {getValue()}
      </Text>
    ),
  }),
  columnHelper.display({
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = [row.original.first_name, row.original.last_name]
        .filter(Boolean)
        .join(" ")
      return (
        <Text size="small" className="text-ui-fg-subtle">
          {name || "—"}
        </Text>
      )
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    cell: ({ getValue }) => (
      <Text size="small" className="text-ui-fg-subtle">
        {new Date(getValue()).toLocaleDateString()}
      </Text>
    ),
  }),
]

const PAGE_SIZE = 20

const CustomersByCompanyPage = () => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [search, setSearch] = useState("")
  const [rowSelection, setRowSelection] =
    useState<DataTableRowSelectionState>({})

  const { data, isLoading } = useQuery({
    queryKey: ["customers-by-company", pagination, search],
    queryFn: () =>
      sdk.admin.customer.list({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        q: search || undefined,
        fields: "id,email,company_name,first_name,last_name,created_at",
      }),
  })

  const table = useDataTable({
    columns,
    data: (data?.customers as CustomerRow[]) ?? [],
    rowCount: data?.count ?? 0,
    getRowId: (row) => row.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    search: { state: search, onSearchChange: setSearch },
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection,
    },
    onRowClick: (_event, row) => navigate(`/customers/${row.id}`),
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 px-6 py-4 md:flex-row md:items-center">
          <div>
            <Heading>Customers by Company</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              All customers with the company shown by default.
            </Text>
          </div>
          <DataTable.Search placeholder="Search customers…" />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Customers by Company",
  icon: Buildings,
})

export default CustomersByCompanyPage
