import {
  EMPTY_QUOTE,
  QUOTE_STORAGE_KEY,
  QuoteItem,
  parseStored,
  serialize,
} from "./state"

/**
 * External store behind the quote list, shaped for React's
 * `useSyncExternalStore`: `subscribe` / `getSnapshot` (same array reference
 * until the list changes) / `getServerSnapshot` (always empty, so the server
 * render and hydration agree — the real list appears right after hydration).
 *
 * Persistence is localStorage (`ht_quote_v1`). Every storage access is in a
 * try/catch: private mode, blocked site data or a full quota switch the store
 * to an in-memory list for the rest of the visit instead of breaking the page.
 * Other tabs are followed through the `storage` event.
 */

type Listener = () => void

/** The bits of `window` the store uses (injectable for tests). */
export type StoreEnv = {
  storage: () => Pick<Storage, "getItem" | "setItem" | "removeItem"> | null
  events?: Pick<Window, "addEventListener" | "removeEventListener"> | null
}

export type QuoteStore = {
  subscribe(listener: Listener): () => void
  getSnapshot(): readonly QuoteItem[]
  getServerSnapshot(): readonly QuoteItem[]
  /** Applies a change and persists it; returns the new list. */
  update(change: (items: readonly QuoteItem[]) => readonly QuoteItem[]): readonly QuoteItem[]
  /** True once storage failed and the list only lives in memory. */
  isMemoryOnly(): boolean
}

export function createQuoteStore(env: StoreEnv): QuoteStore {
  const listeners = new Set<Listener>()
  let memory: readonly QuoteItem[] = EMPTY_QUOTE
  let memoryOnly = false
  /** Raw string the cached list was parsed from (undefined = not read yet). */
  let cachedRaw: string | null | undefined
  let cached: readonly QuoteItem[] = EMPTY_QUOTE

  const storage = () => {
    if (memoryOnly) return null
    try {
      return env.storage()
    } catch {
      memoryOnly = true
      return null
    }
  }

  const read = (): readonly QuoteItem[] => {
    const s = storage()
    if (!s) return memory
    let raw: string | null
    try {
      raw = s.getItem(QUOTE_STORAGE_KEY)
    } catch {
      memoryOnly = true
      return memory
    }
    if (raw === cachedRaw) return cached
    cachedRaw = raw
    const parsed = parseStored(raw)
    cached = parsed.length ? parsed : EMPTY_QUOTE
    memory = cached
    return cached
  }

  const notify = () => listeners.forEach((l) => l())

  const onStorage = (e: StorageEvent) => {
    // key === null: another tab cleared the whole storage.
    if (e.key === QUOTE_STORAGE_KEY || e.key === null) notify()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      if (listeners.size === 1) env.events?.addEventListener("storage", onStorage)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          env.events?.removeEventListener("storage", onStorage)
        }
      }
    },
    getSnapshot: read,
    getServerSnapshot: () => EMPTY_QUOTE,
    update(change) {
      const prev = read()
      const next = change(prev)
      if (next === prev) return prev
      const value = next.length ? next : EMPTY_QUOTE
      memory = value
      const s = storage()
      if (s) {
        try {
          if (value.length) {
            const raw = serialize(value)
            s.setItem(QUOTE_STORAGE_KEY, raw)
            cachedRaw = raw
          } else {
            s.removeItem(QUOTE_STORAGE_KEY)
            cachedRaw = null
          }
          cached = value
        } catch {
          // Quota / blocked storage: keep going in memory.
          memoryOnly = true
        }
      }
      notify()
      return value
    },
    isMemoryOnly: () => memoryOnly,
  }
}

let browserStore: QuoteStore | null = null

/** The page's single store (browser only). */
export function getBrowserQuoteStore(): QuoteStore {
  if (!browserStore) {
    browserStore = createQuoteStore({
      storage: () =>
        typeof window === "undefined" ? null : window.localStorage,
      events: typeof window === "undefined" ? null : window,
    })
  }
  return browserStore
}
