import { GET } from "../route"

const response = () => {
  const res = {
    statusCode: 200,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(p: unknown) {
      this.payload = p
      return this
    },
  }
  return res
}

const PII = ["Ana Silva", "ana@example.pt", "912345678", "Hotel Central", "Preciso", "utm_source"]

describe("GET /admin/lead-stats", () => {
  it("aggregates the staff contact-request notifications, without personal data", async () => {
    const listNotifications = jest.fn().mockResolvedValue([
      {
        id: "noti_1",
        created_at: "2026-11-10T10:00:00.000Z",
        status: "success",
        data: {
          kind: "produto",
          name: "Ana Silva",
          email: "ana@example.pt",
          phone: "912345678",
          empresa: "Hotel Central",
          message: "Preciso de 3 caixas",
          productTitle: "Drip",
          productUrl: "https://www.higitotal.pt/dk/products/drip?utm_source=google",
          emailOptions: { replyTo: "ana@example.pt", subject: "Pedido — Ana Silva" },
        },
      },
      {
        id: "noti_2",
        created_at: "2026-11-11T10:00:00.000Z",
        status: "success",
        data: { kind: "produto", name: "Ana Silva", items: [{ sku: "A" }, { sku: "B" }] },
      },
    ])
    const req = {
      query: { from: "2026-11-01", to: "2026-11-14" },
      scope: { resolve: jest.fn().mockReturnValue({ listNotifications }) },
    }
    const res = response()
    await GET(req as never, res as never)

    expect(req.scope.resolve).toHaveBeenCalledWith("notification")
    expect(listNotifications.mock.calls[0][0]).toMatchObject({ template: "contact-request" })
    expect(res.statusCode).toBe(200)
    expect(res.payload.range).toMatchObject({ from: "2026-11-01", to: "2026-11-14", days: 14 })
    expect(res.payload.totals).toEqual({ leads: 2, failed: 0, quote_lists: 1, quote_lines: 2 })
    expect(res.payload.by_page).toEqual([
      { path: "/dk/products/drip", leads: 1 },
      { path: null, leads: 1 },
    ])
    const json = JSON.stringify(res.payload)
    for (const pii of PII) expect(json).not.toContain(pii)
  })

  it("400 on an invalid range, without touching the DB", async () => {
    const req = { query: { from: "14/11/2026" }, scope: { resolve: jest.fn() } }
    const res = response()
    await GET(req as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(res.payload).toEqual({ message: "from must be a date (YYYY-MM-DD)" })
    expect(req.scope.resolve).not.toHaveBeenCalled()
  })

  it("defaults to the last 90 days; no notification module → zero leads", async () => {
    const req = {
      query: {},
      scope: {
        resolve: jest.fn(() => {
          throw new Error("not registered")
        }),
      },
    }
    const res = response()
    await GET(req as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload.range.days).toBe(90)
    expect(res.payload.by_day).toHaveLength(90)
    expect(res.payload.totals.leads).toBe(0)
  })
})
