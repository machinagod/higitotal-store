import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type Gap = {
  product_id: string
  title?: string
  base_unit: "L" | "kg" | "un" | null
  our_unit_price: number | null
  our_cost_unit: number | null
  competitor: { count: number; min: number; median: number; max: number }
  position: "below" | "at" | "above" | "unknown"
  vs_min_pct: number | null
  vs_median_pct: number | null
  below_cost: boolean
}

/** Minor units → "12.34" (EUR). */
const money = (minor?: number | null) =>
  minor == null ? "—" : (minor / 100).toFixed(2)

const POSITIONS = ["above", "at", "below"] as const
type Filter = "all" | (typeof POSITIONS)[number]

const posColor = (p: Gap["position"]): "red" | "green" | "grey" =>
  p === "above" ? "red" : p === "below" ? "green" : "grey"

function GapRow({ g }: { g: Gap }) {
  const unit = g.base_unit ? `/${g.base_unit}` : ""
  const delta = g.vs_median_pct
  return (
    <div className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Text className="truncate font-medium" title={g.title}>
          {g.title ?? g.product_id}
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          ours <strong>{money(g.our_unit_price)}{unit}</strong> · market{" "}
          {money(g.competitor.median)}{unit}{" "}
          <span className="text-ui-fg-muted">
            ({money(g.competitor.min)}–{money(g.competitor.max)})
          </span>{" "}
          · {g.competitor.count} comp
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {g.below_cost ? (
          <Badge color="orange" size="2xsmall">
            below our cost
          </Badge>
        ) : null}
        {delta != null ? (
          <Text
            size="small"
            className={
              delta > 0 ? "text-ui-tag-red-text" : delta < 0 ? "text-ui-tag-green-text" : ""
            }
          >
            {delta > 0 ? "+" : ""}
            {delta}%
          </Text>
        ) : null}
        <Badge color={posColor(g.position)} size="2xsmall">
          {g.position}
        </Badge>
      </div>
    </div>
  )
}

const CompetitorGapsPage = () => {
  const [filter, setFilter] = useState<Filter>("all")
  const { data, isLoading } = useQuery({
    queryKey: ["competitor-gaps"],
    queryFn: () =>
      sdk.client.fetch<{ gaps: Gap[]; count: number }>(
        "/admin/competitor-prices/gaps",
        { method: "GET" }
      ),
  })

  const gaps = data?.gaps ?? []
  const shown = useMemo(
    () => (filter === "all" ? gaps : gaps.filter((g) => g.position === filter)),
    [gaps, filter]
  )
  const aboveCount = gaps.filter((g) => g.position === "above").length
  const belowCostCount = gaps.filter((g) => g.below_cost).length

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading>Pricing Gaps</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Our €/unit vs the competitor distribution ·{" "}
            <span className="text-ui-tag-red-text">{aboveCount} above market</span>
            {belowCostCount > 0 ? (
              <>
                {" · "}
                <span className="text-ui-tag-orange-text">
                  {belowCostCount} undercut below our cost
                </span>
              </>
            ) : null}
          </Text>
        </div>
        <div className="flex gap-1">
          {(["all", ...POSITIONS] as Filter[]).map((f) => (
            <Button
              key={f}
              size="small"
              variant={filter === f ? "primary" : "secondary"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">Loading…</Text>
        </div>
      ) : shown.length === 0 ? (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">
            No products with a comparable competitor price yet.
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {shown.map((g) => (
            <GapRow key={g.product_id} g={g} />
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Pricing Gaps",
  icon: ChartBar,
})

export default CompetitorGapsPage
