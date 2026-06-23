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

// Competitor unit price vs our price, as a signed %. Positive = competitor is
// dearer than us; negative = competitor undercuts us.
const delta = (r: Row): string => {
  const ours = r.latest_price?.our_price
  const theirs = r.latest_price?.unit_price ?? r.latest_price?.price
  if (ours == null || theirs == null || ours === 0) return "—"
  const pct = ((theirs - ours) / ours) * 100
  return `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`
}

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
            <Table.HeaderCell>Our price</Table.HeaderCell>
            <Table.HeaderCell>Competitor (unit)</Table.HeaderCell>
            <Table.HeaderCell>Δ</Table.HeaderCell>
            <Table.HeaderCell>Scraped / status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell colSpan={8}>Loading…</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && rows.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={8}>
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
              <Table.Cell>{money(r.latest_price?.our_price)}</Table.Cell>
              <Table.Cell>
                {money(
                  r.latest_price?.unit_price ?? r.latest_price?.price,
                  r.latest_price?.currency_code
                )}
                {r.pack_label ? (
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {r.pack_label}
                  </Text>
                ) : null}
              </Table.Cell>
              <Table.Cell>{delta(r)}</Table.Cell>
              <Table.Cell>
                {r.latest_price?.scraped_at ? (
                  new Date(r.latest_price.scraped_at).toLocaleDateString()
                ) : r.last_error ? (
                  <Text size="xsmall" className="text-ui-fg-error">
                    {r.last_error}
                  </Text>
                ) : (
                  "—"
                )}
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
