import { describe, expect, it, vi } from "vitest"

import { addToQuoteEvent, pushDataLayer, quoteLeadEvent } from "../analytics"
import { EMPTY_QUOTE, QUOTE_STORAGE_KEY, addItem, serialize } from "../state"
import { createQuoteStore } from "../store"

const drip = { productId: "prod_1", handle: "drip", title: "Drip Floor", sku: "DX1002" }

/** Minimal localStorage stand-in. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: vi.fn((k: string) => (data.has(k) ? data.get(k)! : null)),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
  }
}

/** Window stand-in that records the storage listener. */
function events() {
  let handler: ((e: StorageEvent) => void) | null = null
  return {
    addEventListener: vi.fn((_t: string, h: any) => (handler = h)),
    removeEventListener: vi.fn(() => (handler = null)),
    fire: (key: string | null) => handler?.({ key } as StorageEvent),
    get attached() {
      return !!handler
    },
  }
}

describe("createQuoteStore", () => {
  it("reads the stored list and keeps the snapshot reference stable", () => {
    const items = addItem(EMPTY_QUOTE, drip, 2).items
    const storage = memoryStorage({ [QUOTE_STORAGE_KEY]: serialize(items) })
    const store = createQuoteStore({ storage: () => storage })
    const a = store.getSnapshot()
    expect(a).toEqual(items)
    expect(store.getSnapshot()).toBe(a)
  })

  it("renders empty on the server", () => {
    const storage = memoryStorage({ [QUOTE_STORAGE_KEY]: serialize(addItem(EMPTY_QUOTE, drip).items) })
    const store = createQuoteStore({ storage: () => storage })
    expect(store.getServerSnapshot()).toBe(EMPTY_QUOTE)
  })

  it("persists updates, notifies subscribers and removes the key when emptied", () => {
    const storage = memoryStorage()
    const store = createQuoteStore({ storage: () => storage })
    const listener = vi.fn()
    store.subscribe(listener)

    store.update((prev) => addItem(prev, drip, 3).items)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(JSON.parse(storage.data.get(QUOTE_STORAGE_KEY)!)).toEqual({
      v: 1,
      items: [{ ...drip, quantity: 3 }],
    })
    expect(store.getSnapshot()[0].quantity).toBe(3)

    store.update(() => [])
    expect(storage.data.has(QUOTE_STORAGE_KEY)).toBe(false)
    expect(store.getSnapshot()).toBe(EMPTY_QUOTE)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("skips writes and notifications when nothing changed", () => {
    const storage = memoryStorage()
    const store = createQuoteStore({ storage: () => storage })
    const listener = vi.fn()
    store.subscribe(listener)
    store.update((prev) => prev)
    expect(listener).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it("follows other tabs through the storage event", () => {
    const storage = memoryStorage()
    const win = events()
    const store = createQuoteStore({ storage: () => storage, events: win })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    expect(win.attached).toBe(true)

    // Another tab writes the key.
    storage.data.set(QUOTE_STORAGE_KEY, serialize(addItem(EMPTY_QUOTE, drip, 5).items))
    win.fire(QUOTE_STORAGE_KEY)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()[0].quantity).toBe(5)

    win.fire("some_other_key")
    expect(listener).toHaveBeenCalledTimes(1)
    win.fire(null) // storage.clear() elsewhere
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    expect(win.attached).toBe(false)
  })

  it("falls back to memory when storage is unavailable", () => {
    const store = createQuoteStore({
      storage: () => {
        throw new Error("SecurityError")
      },
    })
    expect(store.getSnapshot()).toBe(EMPTY_QUOTE)
    store.update((prev) => addItem(prev, drip, 2).items)
    expect(store.getSnapshot()[0].quantity).toBe(2)
    expect(store.isMemoryOnly()).toBe(true)
  })

  it("falls back to memory when reads throw", () => {
    const store = createQuoteStore({
      storage: () => ({
        getItem: () => {
          throw new Error("blocked")
        },
        setItem: () => {},
        removeItem: () => {},
      }),
    })
    expect(store.getSnapshot()).toBe(EMPTY_QUOTE)
    store.update((prev) => addItem(prev, drip).items)
    expect(store.getSnapshot()).toHaveLength(1)
  })

  it("keeps working in memory when a write fails (quota)", () => {
    const storage = memoryStorage()
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    const store = createQuoteStore({ storage: () => storage })
    store.update((prev) => addItem(prev, drip, 4).items)
    expect(store.isMemoryOnly()).toBe(true)
    expect(store.getSnapshot()[0].quantity).toBe(4)
    store.update((prev) => addItem(prev, drip, 1).items)
    expect(store.getSnapshot()[0].quantity).toBe(5)
  })

  it("works without storage at all (server)", () => {
    const store = createQuoteStore({ storage: () => null })
    expect(store.getSnapshot()).toBe(EMPTY_QUOTE)
    store.update((prev) => addItem(prev, drip).items)
    expect(store.getSnapshot()).toHaveLength(1)
  })
})

describe("quote analytics", () => {
  it("creates the dataLayer when missing and pushes events without PII", () => {
    const host: { dataLayer?: unknown[] } = {}
    pushDataLayer(addToQuoteEvent({ sku: "DX1002", handle: "drip" }, 3), host)
    pushDataLayer(quoteLeadEvent(5), host)
    expect(host.dataLayer).toEqual([
      { event: "add_to_quote", item_id: "DX1002", quantity: 3 },
      { event: "generate_lead", lead_type: "quote", items: 5 },
    ])
  })

  it("keeps an existing dataLayer and falls back to the handle as item_id", () => {
    const existing = [{ event: "gtm.js" }]
    const host = { dataLayer: existing }
    pushDataLayer(addToQuoteEvent({ handle: "drip" }, 1), host)
    expect(host.dataLayer).toBe(existing)
    expect(existing[1]).toEqual({ event: "add_to_quote", item_id: "drip", quantity: 1 })
  })

  it("is a no-op without a host and never throws", () => {
    expect(() => pushDataLayer(quoteLeadEvent(1), undefined)).not.toThrow()
    const frozen = Object.freeze({ dataLayer: Object.freeze([]) as unknown as unknown[] })
    expect(() => pushDataLayer(quoteLeadEvent(1), frozen)).not.toThrow()
  })
})
