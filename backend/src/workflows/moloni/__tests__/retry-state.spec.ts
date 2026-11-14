import {
  MAX_NOT_FOUND,
  mergeRetryState,
  parseRetryState,
  retryIds,
  serializeRetryState,
} from "../retry-state"

const NOW = "2026-11-14T03:10:00.000Z"

describe("parseRetryState", () => {
  it("returns {} for missing / malformed input", () => {
    expect(parseRetryState(null)).toEqual({})
    expect(parseRetryState(undefined)).toEqual({})
    expect(parseRetryState("")).toEqual({})
    expect(parseRetryState("not json")).toEqual({})
    expect(parseRetryState("[1,2]")).toEqual({})
    expect(parseRetryState("null")).toEqual({})
    // an epoch cursor accidentally stored under the key
    expect(parseRetryState("1970-01-01T00:00:00.000Z")).toEqual({})
  })

  it("keeps only numeric ids with object entries and normalises fields", () => {
    expect(
      parseRetryState(
        JSON.stringify({
          "12": { attempts: 2, firstFailedAt: "a", lastError: "boom", notFound: 1 },
          "13": { attempts: "x" },
          abc: { attempts: 1 },
          "14": 5,
        })
      )
    ).toEqual({
      "12": { attempts: 2, firstFailedAt: "a", lastError: "boom", notFound: 1 },
      "13": { attempts: 1, firstFailedAt: "", lastError: "" },
    })
  })

  it("round-trips through serializeRetryState", () => {
    const state = { "7": { attempts: 1, firstFailedAt: NOW, lastError: "x" } }
    expect(parseRetryState(serializeRetryState(state))).toEqual(state)
  })
})

describe("retryIds", () => {
  it("orders by oldest failure, then id", () => {
    expect(
      retryIds({
        "3": { attempts: 1, firstFailedAt: "2026-11-14T02:00", lastError: "" },
        "2": { attempts: 1, firstFailedAt: "2026-11-14T01:00", lastError: "" },
        "1": { attempts: 1, firstFailedAt: "2026-11-14T02:00", lastError: "" },
      })
    ).toEqual([2, 1, 3])
  })
})

describe("mergeRetryState", () => {
  const prev = {
    "10": { attempts: 3, firstFailedAt: "2026-11-13T00:00:00Z", lastError: "old" },
    "11": { attempts: 1, firstFailedAt: "2026-11-13T00:00:00Z", lastError: "old" },
    "12": { attempts: 1, firstFailedAt: "2026-11-13T00:00:00Z", lastError: "old" },
  }

  it("drops retried products that now succeed, keeps/increments failures, adds new ones", () => {
    const next = mergeRetryState(prev, {
      processed: [10, 11, 20, 21],
      failed: new Map([
        [11, "still broken"],
        [21, "new failure"],
      ]),
      now: NOW,
    })
    expect(next).toEqual({
      // 10 succeeded → gone; 12 not processed (deferred / fetch error) → kept
      "11": { attempts: 2, firstFailedAt: "2026-11-13T00:00:00Z", lastError: "still broken" },
      "12": prev["12"],
      "21": { attempts: 1, firstFailedAt: NOW, lastError: "new failure" },
    })
  })

  it("counts not-found misses and drops after MAX_NOT_FOUND", () => {
    let state = mergeRetryState(prev, { processed: [], failed: new Map(), notFound: [12], now: NOW })
    expect(state["12"].notFound).toBe(1)
    for (let i = 1; i < MAX_NOT_FOUND; i++) {
      state = mergeRetryState(state, { processed: [], failed: new Map(), notFound: [12], now: NOW })
    }
    expect(state["12"]).toBeUndefined()
    // unknown ids in notFound are ignored
    expect(
      mergeRetryState({}, { processed: [], failed: new Map(), notFound: [99], now: NOW })
    ).toEqual({})
  })

  it("a fresh failure resets the not-found counter and truncates long errors", () => {
    const next = mergeRetryState(
      { "5": { attempts: 1, firstFailedAt: NOW, lastError: "", notFound: 2 } },
      { processed: [5], failed: new Map([[5, "e".repeat(1000)]]), now: NOW }
    )
    expect(next["5"].notFound).toBeUndefined()
    expect(next["5"].attempts).toBe(2)
    expect(next["5"].lastError).toHaveLength(300)
  })

  it("does not mutate the previous state", () => {
    const copy = JSON.parse(JSON.stringify(prev))
    mergeRetryState(prev, { processed: [10, 11, 12], failed: new Map(), now: NOW })
    expect(prev).toEqual(copy)
  })
})
