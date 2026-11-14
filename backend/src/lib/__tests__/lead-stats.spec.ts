import {
  LeadRecord,
  addDays,
  aggregateLeads,
  daysInclusive,
  fetchWindow,
  isIsoDate,
  landingPath,
  leadFromNotification,
  leadLogLine,
  lisbonDate,
  loadLeadRecords,
  parseLeadStatsQuery,
  summarizeLead,
  TOP_PAGES_LIMIT,
} from "../lead-stats"

const rec = (createdAt: string, over: Partial<LeadRecord> = {}): LeadRecord => ({
  createdAt: new Date(createdAt),
  kind: "geral",
  items: 0,
  path: "/dk/contact",
  delivered: true,
  ...over,
})

describe("landingPath", () => {
  it("keeps only the path (no host, query or hash)", () => {
    expect(landingPath("https://www.higitotal.pt/dk/products/x?utm_source=g&email=a@b.pt#top")).toBe(
      "/dk/products/x"
    )
    expect(landingPath("http://store.higitotal.pt/")).toBe("/")
    expect(landingPath("https://www.higitotal.pt")).toBe("/")
  })

  it("normalises trailing and repeated slashes", () => {
    expect(landingPath("https://www.higitotal.pt//dk//orcamento/")).toBe("/dk/orcamento")
  })

  it("accepts a bare path", () => {
    expect(landingPath(" /dk/assistencia-tecnica?x=1 ")).toBe("/dk/assistencia-tecnica")
  })

  it("rejects junk and non-http schemes", () => {
    expect(landingPath(undefined)).toBeNull()
    expect(landingPath(42)).toBeNull()
    expect(landingPath("   ")).toBeNull()
    expect(landingPath("javascript:alert(1)")).toBeNull()
    expect(landingPath("mailto:ana@example.pt")).toBeNull()
    expect(landingPath("http://[::1")).toBeNull()
  })

  it("caps very long paths", () => {
    expect(landingPath(`https://x.pt/${"a".repeat(500)}`)!.length).toBe(200)
  })
})

describe("summarizeLead", () => {
  it("explicit kinds", () => {
    expect(summarizeLead({ kind: "assistencia", productUrl: "https://x.pt/dk/assistencia-tecnica" })).toEqual({
      kind: "assistencia",
      items: 0,
      path: "/dk/assistencia-tecnica",
    })
    expect(summarizeLead({ kind: "geral" }).kind).toBe("geral")
    expect(summarizeLead({ kind: "produto", productTitle: "Drip" }).kind).toBe("produto")
  })

  it("a quote list (items > 0) is 'orcamento' with its line count", () => {
    expect(
      summarizeLead({ kind: "produto", items: [{ sku: "A" }, { title: "B" }, { sku: "C" }] })
    ).toEqual({ kind: "orcamento", items: 3, path: null })
  })

  it("legacy rows without kind are inferred like the handler", () => {
    expect(summarizeLead({ productTitle: "Assistência Técnica" }).kind).toBe("assistencia")
    expect(summarizeLead({ productTitle: "Drip Floor" }).kind).toBe("produto")
    expect(summarizeLead({ sku: "T000222" }).kind).toBe("produto")
    expect(summarizeLead({ message: "Olá" }).kind).toBe("geral")
    expect(summarizeLead({ items: [{ title: "Balde" }] }).kind).toBe("orcamento")
    expect(summarizeLead({ items: [null] }).kind).toBe("orcamento")
  })

  it("tolerates missing / non-object data", () => {
    expect(summarizeLead(null)).toEqual({ kind: "geral", items: 0, path: null })
    expect(summarizeLead("x")).toEqual({ kind: "geral", items: 0, path: null })
  })

  it("never carries personal data", () => {
    const summary = summarizeLead({
      kind: "produto",
      name: "Ana Silva",
      email: "ana@example.pt",
      phone: "912345678",
      empresa: "Hotel Central",
      message: "Preciso de 3 caixas",
      productTitle: "Drip",
      productUrl: "https://www.higitotal.pt/dk/products/drip?email=ana@example.pt",
      emailOptions: { replyTo: "ana@example.pt", subject: "Pedido — Ana Silva" },
    })
    expect(Object.keys(summary).sort()).toEqual(["items", "kind", "path"])
    const json = JSON.stringify(summary)
    for (const pii of ["Ana", "ana@", "912345678", "Hotel", "caixas"]) expect(json).not.toContain(pii)
  })

  it("log line", () => {
    expect(leadLogLine({ kind: "orcamento", items: 4, path: "/dk/orcamento" })).toBe(
      "lead: kind=orcamento items=4 path=/dk/orcamento"
    )
    expect(leadLogLine({ kind: "geral", items: 0, path: null })).toBe("lead: kind=geral items=0 path=-")
  })
})

describe("leadFromNotification", () => {
  it("maps a stored staff notification row", () => {
    expect(
      leadFromNotification({
        created_at: "2026-11-14T10:00:00.000Z",
        status: "success",
        data: { kind: "geral", productUrl: "https://www.higitotal.pt/dk/contact", name: "Ana" },
      })
    ).toEqual({
      kind: "geral",
      items: 0,
      path: "/dk/contact",
      createdAt: new Date("2026-11-14T10:00:00.000Z"),
      delivered: true,
    })
    expect(leadFromNotification({ created_at: new Date(), status: "failure", data: null }).delivered).toBe(false)
    expect(leadFromNotification({ created_at: new Date(), status: "pending" }).delivered).toBe(false)
  })
})

describe("dates", () => {
  it("lisbonDate uses Lisbon's calendar (WET / WEST)", () => {
    // Summer (UTC+1): 23:30Z is already the next day in Lisbon.
    expect(lisbonDate(new Date("2026-07-31T23:30:00Z"))).toBe("2026-08-01")
    // Winter (UTC+0).
    expect(lisbonDate(new Date("2026-12-31T23:30:00Z"))).toBe("2026-12-31")
    expect(lisbonDate(new Date("2027-01-01T00:00:00Z"))).toBe("2027-01-01")
  })

  it("isIsoDate", () => {
    expect(isIsoDate("2026-02-28")).toBe(true)
    expect(isIsoDate("2026-02-30")).toBe(false)
    expect(isIsoDate("2026-2-3")).toBe(false)
    expect(isIsoDate(20260203)).toBe(false)
  })

  it("addDays / daysInclusive", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    // Across the DST change.
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30")
    expect(daysInclusive("2026-11-14", "2026-11-14")).toBe(1)
    expect(daysInclusive("2026-03-01", "2026-03-31")).toBe(31)
  })
})

describe("parseLeadStatsQuery", () => {
  const today = "2026-11-14"

  it("defaults to the last 90 days ending today", () => {
    expect(parseLeadStatsQuery({}, today)).toEqual({ status: "ok", from: "2026-08-17", to: today })
    expect(parseLeadStatsQuery(undefined, today)).toEqual({ status: "ok", from: "2026-08-17", to: today })
    expect(parseLeadStatsQuery({ from: "", to: "" }, today)).toEqual({
      status: "ok",
      from: "2026-08-17",
      to: today,
    })
  })

  it("explicit range; from alone ends today; to alone gets 90 days", () => {
    expect(parseLeadStatsQuery({ from: "2026-11-01", to: "2026-11-07" }, today)).toEqual({
      status: "ok",
      from: "2026-11-01",
      to: "2026-11-07",
    })
    expect(parseLeadStatsQuery({ from: "2026-11-01" }, today)).toEqual({
      status: "ok",
      from: "2026-11-01",
      to: today,
    })
    expect(parseLeadStatsQuery({ to: "2026-10-31" }, today)).toEqual({
      status: "ok",
      from: "2026-08-03",
      to: "2026-10-31",
    })
  })

  it("rejects bad dates, arrays, inverted and too long ranges", () => {
    expect(parseLeadStatsQuery({ from: "yesterday" }, today)).toEqual({
      status: "invalid",
      message: "from must be a date (YYYY-MM-DD)",
    })
    expect(parseLeadStatsQuery({ to: ["2026-11-01", "2026-11-02"] }, today).status).toBe("invalid")
    expect(parseLeadStatsQuery({ from: "2026-02-30" }, today).status).toBe("invalid")
    expect(parseLeadStatsQuery({ from: "2026-11-10", to: "2026-11-01" }, today)).toEqual({
      status: "invalid",
      message: "from must not be after to",
    })
    expect(parseLeadStatsQuery({ from: "2020-01-01", to: today }, today)).toEqual({
      status: "invalid",
      message: "the range is limited to 731 days",
    })
  })
})

describe("fetchWindow", () => {
  it("covers the range and the 90-vs-90 comparison, with a spare day for the UTC offset", () => {
    // The previous 90 days start on 2026-05-19 (to − 179); one spare day before.
    expect(fetchWindow("2026-11-01", "2026-11-14")).toEqual({
      gte: "2026-05-18T00:00:00.000Z",
      lt: "2026-11-15T00:00:00.000Z",
    })
  })

  it("starts at the range when it goes further back", () => {
    expect(fetchWindow("2025-11-14", "2026-11-14").gte).toBe("2025-11-13T00:00:00.000Z")
  })
})

describe("loadLeadRecords", () => {
  it("lists staff contact-request rows page by page", async () => {
    const row = { created_at: "2026-11-14T10:00:00Z", status: "success", data: { kind: "geral" } }
    const listNotifications = jest
      .fn()
      .mockResolvedValueOnce(Array(500).fill(row))
      .mockResolvedValueOnce([row, row])
    const records = await loadLeadRecords({ listNotifications } as never, {
      gte: "2026-05-17T00:00:00.000Z",
      lt: "2026-11-15T00:00:00.000Z",
    })
    expect(records).toHaveLength(502)
    expect(listNotifications).toHaveBeenCalledTimes(2)
    expect(listNotifications.mock.calls[0][0]).toEqual({
      template: "contact-request",
      created_at: { $gte: "2026-05-17T00:00:00.000Z", $lt: "2026-11-15T00:00:00.000Z" },
    })
    expect(listNotifications.mock.calls[0][1]).toMatchObject({ skip: 0, take: 500 })
    expect(listNotifications.mock.calls[1][1]).toMatchObject({ skip: 500, take: 500 })
  })
})

describe("aggregateLeads", () => {
  const range = { from: "2026-11-08", to: "2026-11-14" }

  const records: LeadRecord[] = [
    rec("2026-11-14T09:00:00Z", { kind: "produto", path: "/dk/products/drip" }),
    rec("2026-11-14T10:00:00Z", { kind: "orcamento", items: 3, path: "/dk/orcamento" }),
    rec("2026-11-13T23:30:00Z", { kind: "orcamento", items: 2, path: "/dk/orcamento" }), // WET: 13th
    rec("2026-11-10T12:00:00Z", { kind: "assistencia", path: "/dk/assistencia-tecnica" }),
    rec("2026-11-08T00:10:00Z", { kind: "geral", path: null }),
    rec("2026-11-12T12:00:00Z", { kind: "geral", delivered: false }), // failed send
    rec("2026-11-07T12:00:00Z", { kind: "produto" }), // before the range: comparisons only
    rec("2026-11-02T12:00:00Z", { kind: "produto" }),
    rec("2026-09-01T12:00:00Z", { kind: "produto" }),
  ]

  const stats = aggregateLeads(records, range)

  it("range and totals (only delivered leads count)", () => {
    expect(stats.range).toEqual({ from: "2026-11-08", to: "2026-11-14", days: 7, timezone: "Europe/Lisbon" })
    expect(stats.totals).toEqual({ leads: 5, failed: 1, quote_lists: 2, quote_lines: 5 })
  })

  it("by_day lists every Lisbon date of the range", () => {
    expect(stats.by_day).toEqual([
      { date: "2026-11-08", leads: 1 },
      { date: "2026-11-09", leads: 0 },
      { date: "2026-11-10", leads: 1 },
      { date: "2026-11-11", leads: 0 },
      { date: "2026-11-12", leads: 0 },
      { date: "2026-11-13", leads: 1 },
      { date: "2026-11-14", leads: 2 },
    ])
  })

  it("by_kind in a fixed order", () => {
    expect(stats.by_kind).toEqual([
      { kind: "produto", leads: 1 },
      { kind: "orcamento", leads: 2 },
      { kind: "assistencia", leads: 1 },
      { kind: "geral", leads: 1 },
    ])
  })

  it("by_page: most leads first, ties by path, unknown last", () => {
    expect(stats.by_page).toEqual([
      { path: "/dk/orcamento", leads: 2 },
      { path: "/dk/assistencia-tecnica", leads: 1 },
      { path: "/dk/products/drip", leads: 1 },
      { path: null, leads: 1 },
    ])
    expect(stats.pages_distinct).toBe(4)
  })

  it("period comparisons end at `to` and use records outside the range", () => {
    const [d7, d30, d90] = stats.comparisons
    expect(d7).toEqual({
      days: 7,
      current: { from: "2026-11-08", to: "2026-11-14", leads: 5 },
      previous: { from: "2026-11-01", to: "2026-11-07", leads: 2 },
      change: 3,
      change_pct: 150,
    })
    expect(d30.current.leads).toBe(7)
    expect(d30.previous).toEqual({ from: "2026-09-16", to: "2026-10-15", leads: 0 })
    expect(d30.change_pct).toBeNull()
    expect(d90.current.leads).toBe(8)
    expect(d90.days).toBe(90)
  })

  it("rounds the relative change to one decimal", () => {
    const s = aggregateLeads(
      [
        rec("2026-11-14T12:00:00Z"),
        rec("2026-11-01T12:00:00Z"),
        rec("2026-11-02T12:00:00Z"),
        rec("2026-11-03T12:00:00Z"),
      ],
      range
    )
    expect(s.comparisons[0].change).toBe(-2)
    expect(s.comparisons[0].change_pct).toBe(-66.7)
  })

  it("caps the page list", () => {
    const many = Array.from({ length: TOP_PAGES_LIMIT + 5 }, (_, i) =>
      rec("2026-11-14T12:00:00Z", { path: `/p/${i}` })
    )
    const s = aggregateLeads(many, range)
    expect(s.by_page).toHaveLength(TOP_PAGES_LIMIT)
    expect(s.pages_distinct).toBe(TOP_PAGES_LIMIT + 5)
  })

  it("empty input", () => {
    const s = aggregateLeads([], range)
    expect(s.totals).toEqual({ leads: 0, failed: 0, quote_lists: 0, quote_lines: 0 })
    expect(s.by_day.every((d) => d.leads === 0)).toBe(true)
    expect(s.by_page).toEqual([])
    expect(s.comparisons.map((c) => c.change_pct)).toEqual([null, null, null])
  })

  it("output holds no personal data even if records carried extra fields", () => {
    const leaky = {
      ...rec("2026-11-14T12:00:00Z"),
      name: "Ana Silva",
      email: "ana@example.pt",
    } as LeadRecord
    const json = JSON.stringify(aggregateLeads([leaky], range))
    expect(json).not.toContain("Ana")
    expect(json).not.toContain("@")
  })
})
