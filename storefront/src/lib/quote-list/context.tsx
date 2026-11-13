"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { addToQuoteEvent, pushDataLayer } from "./analytics"
import {
  AddResult,
  QuoteItem,
  QuoteProductInput,
  addItem,
  clearItems,
  findLine,
  removeItem,
  setNote as setLineNote,
  setQuantity as setLineQuantity,
} from "./state"
import { getBrowserQuoteStore } from "./store"

type LineKey = Pick<QuoteItem, "productId" | "variantId">

/** Last "added to the list" event — drives the toast. */
export type QuoteToastState = {
  id: number
  title: string
  status: AddResult["status"]
  quantity: number
}

export type QuoteListApi = {
  items: readonly QuoteItem[]
  /** Number of lines (header badge). 0 on the server and during hydration. */
  count: number
  /** False during the server render / hydration pass (list not read yet). */
  hydrated: boolean
  /** True when the browser blocks storage — the list lasts for this visit only. */
  memoryOnly: boolean
  find(key: LineKey): QuoteItem | undefined
  add(product: QuoteProductInput, quantity?: number): AddResult
  setQuantity(key: LineKey, quantity: number): void
  setNote(key: LineKey, note: string): void
  remove(key: LineKey): void
  clear(): void
  /** Polite screen-reader message (also used for removals / clearing). */
  announce(text: string): void
  announcement: { id: number; text: string } | null
  toast: QuoteToastState | null
  dismissToast(): void
}

const QuoteListContext = createContext<QuoteListApi | null>(null)

const noopSubscribe = () => () => {}

function EnabledQuoteListProvider({ children }: { children: React.ReactNode }) {
  const store = getBrowserQuoteStore()
  const items = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
  const [announcement, setAnnouncement] = useState<{
    id: number
    text: string
  } | null>(null)
  const [toast, setToast] = useState<QuoteToastState | null>(null)
  const seq = useRef(0)

  const announce = useCallback((text: string) => {
    seq.current += 1
    setAnnouncement({ id: seq.current, text })
  }, [])

  const add = useCallback(
    (product: QuoteProductInput, quantity = 1): AddResult => {
      let result: AddResult = { items: [], status: "full" }
      const next = store.update((prev) => {
        result = addItem(prev, product, quantity)
        return result.items
      })
      seq.current += 1
      if (result.status === "full") {
        setAnnouncement({
          id: seq.current,
          text: "A lista de orçamento atingiu o limite de 100 produtos.",
        })
      } else {
        const lines = next.length
        const qty = result.line?.quantity ?? quantity
        setAnnouncement({
          id: seq.current,
          text: `${product.title} adicionado ao orçamento (${qty} un.). ${lines} ${
            lines === 1 ? "produto" : "produtos"
          } na lista.`,
        })
        pushDataLayer(addToQuoteEvent(product, quantity))
      }
      setToast({
        id: seq.current,
        title: product.title,
        status: result.status,
        quantity: result.line?.quantity ?? quantity,
      })
      return result
    },
    [store]
  )

  const api = useMemo<QuoteListApi>(
    () => ({
      items,
      count: items.length,
      hydrated,
      memoryOnly: hydrated && store.isMemoryOnly(),
      find: (key) => findLine(items, key),
      add,
      setQuantity: (key, q) => {
        store.update((prev) => setLineQuantity(prev, key, q))
      },
      setNote: (key, note) => {
        store.update((prev) => setLineNote(prev, key, note))
      },
      remove: (key) => {
        store.update((prev) => removeItem(prev, key))
      },
      clear: () => {
        store.update(() => clearItems())
      },
      announce,
      announcement,
      toast,
      dismissToast: () => setToast(null),
    }),
    [items, hydrated, store, add, announce, announcement, toast]
  )

  return (
    <QuoteListContext.Provider value={api}>{children}</QuoteListContext.Provider>
  )
}

/**
 * Provides the quote list to the page. Only active in catalog mode: with
 * `enabled` false nothing is provided, so every quote control renders nothing
 * and the real cart is untouched.
 */
export function QuoteListProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  if (!enabled) return <>{children}</>
  return <EnabledQuoteListProvider>{children}</EnabledQuoteListProvider>
}

/** The quote list, or null when the feature is off (catalog mode disabled). */
export function useQuoteList(): QuoteListApi | null {
  return useContext(QuoteListContext)
}
