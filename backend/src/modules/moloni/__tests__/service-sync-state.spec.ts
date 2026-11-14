import MoloniModuleService from "../service"

/** Call service methods on a minimal fake `this` (no Medusa module boot). */
const fakeService = (opts: {
  rows?: { id: string; entity: string; last_modified: string }[]
  listThrows?: boolean
  products?: (params: any) => Promise<any>
}) => {
  const rows = opts.rows ?? []
  const self: any = {
    logger_: { info: jest.fn(), warn: jest.fn() },
    clientPromise_: Promise.resolve({ products: jest.fn((_r: string, p: any) => opts.products!(p)) }),
    listMoloniSyncCursors: jest.fn(async ({ entity }: any) => {
      if (opts.listThrows) throw new Error("relation does not exist")
      return rows.filter((r) => r.entity === entity)
    }),
    updateMoloniSyncCursors: jest.fn(async ({ id, last_modified }: any) => {
      rows.find((r) => r.id === id)!.last_modified = last_modified
    }),
    createMoloniSyncCursors: jest.fn(async ({ entity, last_modified }: any) => {
      rows.push({ id: `c${rows.length}`, entity, last_modified })
    }),
  }
  const proto = MoloniModuleService.prototype as any
  for (const m of ["getSyncState", "setSyncState", "setSyncCursor", "upsertSyncRow_", "getProductsByIds"]) {
    self[m] = proto[m].bind(self)
  }
  return { self, rows }
}

describe("MoloniModuleService sync state", () => {
  it("stores arbitrary state next to the cursors (insert, then update)", async () => {
    const { self, rows } = fakeService({ rows: [{ id: "c0", entity: "products", last_modified: "2026-11-14" }] })
    expect(await self.getSyncState("products:retry")).toBeNull()
    await self.setSyncState("products:retry", '{"1":{}}')
    await self.setSyncState("products:retry", "{}")
    expect(await self.getSyncState("products:retry")).toBe("{}")
    expect(rows).toHaveLength(2)
    // the products cursor itself is untouched
    expect(rows[0].last_modified).toBe("2026-11-14")
    await self.setSyncCursor("products", "2026-11-15")
    expect(rows[0].last_modified).toBe("2026-11-15")
  })

  it("degrades to null / no-op with a warning when the table is unavailable", async () => {
    const { self } = fakeService({ listThrows: true })
    expect(await self.getSyncState("k")).toBeNull()
    await self.setSyncState("k", "v")
    await self.setSyncCursor("products", "x")
    expect(self.logger_.warn).toHaveBeenCalledTimes(3)
  })
})

describe("MoloniModuleService.getProductsByIds", () => {
  it("splits found / not found ([] reply) / errors", async () => {
    const { self } = fakeService({
      products: async ({ product_id }) => {
        if (product_id === 1) return { product_id: 1, reference: "A" }
        if (product_id === 2) return []
        throw new Error("rate limited")
      },
    })
    const r = await self.getProductsByIds([1, 2, 3])
    expect(r.found).toEqual([{ product_id: 1, reference: "A" }])
    expect(r.notFound).toEqual([2])
    expect(r.errors).toEqual([{ id: 3, message: "rate limited" }])
  })
})
