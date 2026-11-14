import { errorMessage, runInBatchesWithFallback } from "../batch"

describe("runInBatchesWithFallback", () => {
  it("runs clean batches once each", async () => {
    const run = jest.fn(async () => undefined)
    const r = await runInBatchesWithFallback([1, 2, 3, 4, 5], 2, run)
    expect(run.mock.calls).toEqual([[[1, 2]], [[3, 4]], [[5]]])
    expect(r).toEqual({ succeeded: [1, 2, 3, 4, 5], failed: [] })
  })

  it("replays a failing batch item by item and reports only the bad items", async () => {
    const run = jest.fn(async (batch: number[]) => {
      if (batch.includes(3)) throw new Error("boom 3")
    })
    const onBatchError = jest.fn()
    const r = await runInBatchesWithFallback([1, 2, 3, 4, 5], 3, run, onBatchError)
    expect(r.succeeded).toEqual([1, 2, 4, 5])
    expect(r.failed).toHaveLength(1)
    expect(r.failed[0].item).toBe(3)
    expect(errorMessage(r.failed[0].error)).toBe("boom 3")
    expect(onBatchError).toHaveBeenCalledTimes(1)
    expect(onBatchError.mock.calls[0][1]).toEqual([1, 2, 3])
    // batch [1,2,3] fails → 1, 2, 3 singly → batch [4,5]
    expect(run.mock.calls.map((c) => c[0])).toEqual([[1, 2, 3], [1], [2], [3], [4, 5]])
  })

  it("does not replay a single-item batch", async () => {
    const run = jest.fn(async () => {
      throw "nope"
    })
    const onBatchError = jest.fn()
    const r = await runInBatchesWithFallback(["a"], 10, run, onBatchError)
    expect(run).toHaveBeenCalledTimes(1)
    expect(onBatchError).not.toHaveBeenCalled()
    expect(r.failed.map((f) => errorMessage(f.error))).toEqual(["nope"])
  })

  it("handles an empty list", async () => {
    const run = jest.fn()
    expect(await runInBatchesWithFallback([], 10, run)).toEqual({ succeeded: [], failed: [] })
    expect(run).not.toHaveBeenCalled()
  })
})

describe("errorMessage", () => {
  it("stringifies anything", () => {
    expect(errorMessage(new Error("x"))).toBe("x")
    expect(errorMessage("y")).toBe("y")
    expect(errorMessage({ a: 1 })).toBe('{"a":1}')
    // serialized workflow error
    expect(errorMessage({ message: "Inventory item with sku: RS0010, already exists.", stack: "…" })).toBe(
      "Inventory item with sku: RS0010, already exists."
    )
    const circular: any = {}
    circular.self = circular
    expect(errorMessage(circular)).toBe("[object Object]")
  })
})
