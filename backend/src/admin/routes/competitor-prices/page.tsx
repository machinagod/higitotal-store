import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

type Row = {
  id: string
  competitor?: { name?: string } | null
  title?: string | null
  product_sku?: string | null
  competitor_url?: string | null
  match_status?: string
  match_score?: number | null
  latest_price?: {
    price?: number | null
    currency_code?: string
    status?: string
    scraped_at?: string
  } | null
}

const money = (minor?: number | null, cur = "EUR") =>
  minor == null ? "—" : `${(minor / 100).toFixed(2)} ${cur}`

const CompetitorPricesPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["competitor-products"],
    queryFn: () =>
      sdk.client.fetch<{ competitor_products: Row[] }>(
        "/admin/competitor-products",
        { method: "GET" }
      ),
  })

  const rows = data?.competitor_products ?? []

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Competitor Prices</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Latest observed competitor prices per mapped product.
        </Text>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Competitor</Table.HeaderCell>
            <Table.HeaderCell>Listing</Table.HeaderCell>
            <Table.HeaderCell>Our SKU</Table.HeaderCell>
            <Table.HeaderCell>Match</Table.HeaderCell>
            <Table.HeaderCell>Latest price</Table.HeaderCell>
            <Table.HeaderCell>Scraped</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell colSpan={6}>Loading…</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && rows.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <Text size="small" className="text-ui-fg-subtle">
                  No competitor mappings yet. Add competitors and mappings via the
                  admin API, or enable discovery.
                </Text>
              </Table.Cell>
            </Table.Row>
          )}
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>{r.competitor?.name ?? "—"}</Table.Cell>
              <Table.Cell className="max-w-[280px] truncate">
                {r.competitor_url ? (
                  <a
                    href={r.competitor_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ui-fg-interactive"
                  >
                    {r.title || r.competitor_url}
                  </a>
                ) : (
                  r.title || "—"
                )}
              </Table.Cell>
              <Table.Cell>{r.product_sku ?? "—"}</Table.Cell>
              <Table.Cell>
                <Badge size="2xsmall">
                  {r.match_status}
                  {r.match_score != null ? ` ${r.match_score}` : ""}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {money(r.latest_price?.price, r.latest_price?.currency_code)}
              </Table.Cell>
              <Table.Cell>
                {r.latest_price?.scraped_at
                  ? new Date(r.latest_price.scraped_at).toLocaleDateString()
                  : "—"}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Competitor Prices",
  icon: CurrencyDollar,
})

export default CompetitorPricesPage
