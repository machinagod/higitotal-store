"use client"

import { clx } from "@medusajs/ui"
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  ClipboardList,
  ImageIcon,
  Phone,
  Plus,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import { useParams } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"

import { COMPANY } from "@lib/company"
import { pushDataLayer, quoteLeadEvent } from "@lib/quote-list/analytics"
import { useQuoteList } from "@lib/quote-list/context"
import {
  MAX_NOTE_LENGTH,
  QuoteItem,
  buildQuoteRequestItems,
  productCountLabel,
} from "@lib/quote-list/state"
import {
  CONTACT_SUCCESS_MESSAGE,
  ContactRequestPayload,
  QUOTE_LIST_MESSAGE,
} from "@lib/util/contact-request"
import { getBaseURL } from "@lib/util/env"
import ContactRequestForm from "@modules/common/components/contact-request-form"
import { fieldClass } from "@modules/common/components/contact-request-form/fields"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import QuantityStepper from "@modules/quote/components/quantity-stepper"

const lineKey = (i: Pick<QuoteItem, "productId" | "variantId">) =>
  `${i.productId}:${i.variantId ?? ""}`

const outlineBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-hairline bg-white px-4 text-sm font-bold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"

const textBtn =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-pill px-2 text-sm font-semibold text-grey-60 transition-colors hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"

/** What was sent — shown after a successful request (the list is cleared). */
type Sent = { items: QuoteItem[] }

/**
 * `/orcamento` — the quote list ("carrinho de orçamento") and the request
 * form. Catalog mode only (the route 404s otherwise). The list is read from
 * the browser after hydration; until then a neutral placeholder is shown so
 * the empty state never flashes for a visitor who has products.
 */
export default function QuotePageTemplate() {
  const quote = useQuoteList()
  const { countryCode } = useParams() as { countryCode: string }
  const [sent, setSent] = useState<Sent | null>(null)
  const sentHeadingRef = useRef<HTMLHeadingElement>(null)
  const listHeadingRef = useRef<HTMLHeadingElement>(null)
  const items = quote?.items ?? []
  // Latest list for the submit handler (read at submit time).
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    if (sent) sentHeadingRef.current?.focus()
  }, [sent])

  if (!quote) return null
  const { hydrated } = quote
  const hasItems = hydrated && items.length > 0

  const onSent = (payload: ContactRequestPayload) => {
    if (!payload.items?.length) return // plain enquiry: the form's own message
    const snapshot = [...itemsRef.current]
    pushDataLayer(quoteLeadEvent(payload.items.length))
    setSent({ items: snapshot })
    quote.clear()
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="content-container py-8 small:py-12" data-testid="quote-page">
      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
        <span className="ind" aria-hidden="true" />
        Pedido de orçamento
      </span>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-brand-ink small:text-[40px] small:leading-[1.1]">
        O seu orçamento
      </h1>

      {sent ? (
        <QuoteSent sent={sent} headingRef={sentHeadingRef} />
      ) : (
        <>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-grey-60">
            Reúna os produtos de que precisa, indique as quantidades e envie um
            único pedido. A nossa equipa comercial responde em dias úteis com
            uma proposta para a sua empresa.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 small:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] small:items-start small:gap-12">
            <section aria-labelledby="quote-list-title" data-testid="quote-list-section">
              {!hydrated ? (
                <div
                  className="h-40 animate-pulse rounded-card bg-grey-5"
                  aria-busy="true"
                  aria-label="A carregar a lista"
                />
              ) : hasItems ? (
                <QuoteList
                  items={items}
                  headingRef={listHeadingRef}
                  memoryOnly={quote.memoryOnly}
                />
              ) : (
                <EmptyQuote headingRef={listHeadingRef} />
              )}
            </section>

            <section
              aria-labelledby="quote-form-title"
              className="rounded-card border border-hairline bg-white p-5 shadow-[0_18px_50px_rgba(35,31,32,0.06)] xsmall:p-8 small:sticky small:top-36"
              data-testid="quote-form-section"
            >
              <h2
                id="quote-form-title"
                className="text-2xl font-extrabold tracking-[-0.02em] text-brand-ink"
              >
                {hasItems ? "Os seus dados" : "Envie-nos uma mensagem"}
              </h2>
              <p className="mb-6 mt-1 text-sm text-grey-60">
                {hasItems
                  ? `O pedido inclui ${productCountLabel(items.length)}. Só precisamos do seu nome e e-mail (campos assinalados com *).`
                  : "Os campos assinalados com * são obrigatórios."}
              </p>
              <ContactRequestForm
                kind={hasItems ? "produto" : "geral"}
                idPrefix="quote"
                prefilledMessage={hasItems ? QUOTE_LIST_MESSAGE : undefined}
                submitLabel={hasItems ? "Enviar pedido de orçamento" : "Enviar pedido"}
                getItems={() =>
                  buildQuoteRequestItems(itemsRef.current, {
                    baseUrl: getBaseURL(),
                    countryCode,
                  })
                }
                onSuccess={onSent}
              />
              <p className="mt-5 flex items-start gap-2 border-t border-hairline pt-4 text-sm text-grey-60">
                <Phone className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" aria-hidden="true" />
                <span>
                  Prefere falar connosco?{" "}
                  <a
                    href={COMPANY.phone.href}
                    className="font-bold text-brand-cyan underline-offset-2 hover:underline"
                  >
                    {COMPANY.phone.display}
                  </a>{" "}
                  ({COMPANY.phone.costNote.toLowerCase()})
                </span>
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function QuoteList({
  items,
  headingRef,
  memoryOnly,
}: {
  items: readonly QuoteItem[]
  headingRef: React.RefObject<HTMLHeadingElement>
  memoryOnly: boolean
}) {
  const quote = useQuoteList()!
  const [confirmClear, setConfirmClear] = useState(false)
  const removeRefs = useRef(new Map<string, HTMLButtonElement>())
  const confirmRef = useRef<HTMLButtonElement>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  /** Index whose "Remover" gets focus after a removal. */
  const focusAfterRemove = useRef<number | null>(null)

  useEffect(() => {
    const i = focusAfterRemove.current
    if (i === null) return
    focusAfterRemove.current = null
    const target = items[Math.min(i, items.length - 1)]
    const el = target && removeRefs.current.get(lineKey(target))
    if (el) el.focus()
    else headingRef.current?.focus()
  }, [items, headingRef])

  useEffect(() => {
    if (confirmClear) confirmRef.current?.focus()
  }, [confirmClear])

  const remove = (item: QuoteItem, index: number) => {
    focusAfterRemove.current = index
    quote.remove(item)
    quote.announce(`${item.title} removido do orçamento.`)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <h2
          id="quote-list-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-extrabold tracking-[-0.02em] text-brand-ink outline-none"
        >
          Produtos{" "}
          <span className="font-semibold text-grey-50" data-testid="quote-line-count">
            ({items.length})
          </span>
        </h2>
        {!confirmClear && (
          <button
            ref={clearRef}
            type="button"
            onClick={() => setConfirmClear(true)}
            className={textBtn}
            data-testid="quote-clear"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Limpar lista
          </button>
        )}
      </div>

      {confirmClear && (
        <div
          role="group"
          aria-labelledby="quote-clear-question"
          className="mt-3 flex flex-col gap-3 rounded-btn border border-rose-200 bg-rose-50 p-4 xsmall:flex-row xsmall:items-center"
          data-testid="quote-clear-confirm"
        >
          <p id="quote-clear-question" className="flex-1 text-sm font-semibold text-rose-800">
            Remover {items.length === 1 ? "o produto" : `os ${items.length} produtos`} da
            lista? Esta ação não pode ser anulada.
          </p>
          <div className="flex gap-2">
            <button
              ref={confirmRef}
              type="button"
              onClick={() => {
                setConfirmClear(false)
                quote.clear()
                quote.announce("Lista de orçamento limpa.")
                headingRef.current?.focus()
              }}
              className="inline-flex min-h-[44px] items-center rounded-pill bg-rose-700 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"
              data-testid="quote-clear-yes"
            >
              Sim, limpar a lista
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmClear(false)
                requestAnimationFrame(() => clearRef.current?.focus())
              }}
              className={outlineBtn}
              data-testid="quote-clear-cancel"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {memoryOnly && (
        <p className="mt-3 rounded-btn bg-grey-5 px-4 py-3 text-sm text-grey-60">
          O seu navegador não permite guardar a lista — fica disponível apenas
          durante esta visita.
        </p>
      )}

      <ul className="divide-y divide-hairline" data-testid="quote-lines">
        {items.map((item, index) => (
          <QuoteLine
            key={lineKey(item)}
            item={item}
            onRemove={() => remove(item, index)}
            removeRef={(el) => {
              if (el) removeRefs.current.set(lineKey(item), el)
              else removeRefs.current.delete(lineKey(item))
            }}
          />
        ))}
      </ul>

      <LocalizedClientLink
        href="/store"
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-cyan underline-offset-2 hover:text-brand-cyan-ink hover:underline"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Adicionar mais produtos
      </LocalizedClientLink>
    </>
  )
}

function QuoteLine({
  item,
  onRemove,
  removeRef,
}: {
  item: QuoteItem
  onRemove: () => void
  removeRef: (el: HTMLButtonElement | null) => void
}) {
  const quote = useQuoteList()!
  const key = lineKey(item)
  const noteId = `quote-note-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`
  const [noteOpen, setNoteOpen] = useState(!!item.note)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const justOpened = useRef(false)

  useEffect(() => {
    if (noteOpen && justOpened.current) {
      justOpened.current = false
      noteRef.current?.focus()
    }
  }, [noteOpen])
  // A note added in another tab opens the field here too.
  useEffect(() => {
    if (item.note) setNoteOpen(true)
  }, [item.note])

  const noteLength = item.note?.length ?? 0

  return (
    <li className="flex gap-3 py-4 xsmall:gap-4" data-testid="quote-line" data-product-id={item.productId}>
      <LocalizedClientLink
        href={`/products/${item.handle}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative h-16 w-16 flex-none overflow-hidden rounded-btn border border-hairline bg-white xsmall:h-20 xsmall:w-20"
      >
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt=""
            fill
            sizes="80px"
            className="object-contain p-1.5 mix-blend-multiply"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-brand-cyan/60">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </LocalizedClientLink>

      <div className="min-w-0 flex-1">
        <LocalizedClientLink
          href={`/products/${item.handle}`}
          className="line-clamp-2 text-[15px] font-bold leading-snug text-brand-ink underline-offset-2 hover:text-brand-cyan-ink hover:underline"
          data-testid="quote-line-title"
        >
          {item.title}
        </LocalizedClientLink>
        {item.sku && (
          <p className="mt-0.5 text-xs font-medium text-grey-50" data-testid="quote-line-sku">
            Ref.ª {item.sku}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => quote.setQuantity(item, q)}
            label={`Quantidade de ${item.title}`}
            itemName={item.title}
            data-testid="quote-line-quantity"
          />
          <span className="text-sm text-grey-50" aria-hidden="true">
            un.
          </span>
          <button
            ref={removeRef}
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${item.title} do orçamento`}
            className={clx(textBtn, "ml-auto")}
            data-testid="quote-line-remove"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remover
          </button>
        </div>

        {noteOpen ? (
          <div className="mt-3">
            <label
              htmlFor={noteId}
              className="mb-1 block text-[13px] font-semibold text-brand-ink"
            >
              Nota <span className="font-normal text-grey-50">(opcional)</span>
            </label>
            <textarea
              id={noteId}
              ref={noteRef}
              rows={2}
              maxLength={MAX_NOTE_LENGTH}
              value={item.note ?? ""}
              onChange={(e) => quote.setNote(item, e.target.value)}
              placeholder="Ex.: embalagem, entrega, alternativa aceite"
              aria-describedby={`${noteId}-count`}
              className={clx(fieldClass, "min-h-[64px] resize-y")}
              data-testid="quote-line-note"
            />
            <p id={`${noteId}-count`} className="mt-1 text-right text-xs text-grey-50">
              {noteLength}/{MAX_NOTE_LENGTH} caracteres
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              justOpened.current = true
              setNoteOpen(true)
            }}
            className={clx(textBtn, "-ml-2 mt-1 text-brand-cyan hover:text-brand-cyan-ink")}
            aria-label={`Adicionar nota a ${item.title}`}
            data-testid="quote-line-add-note"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Adicionar nota
          </button>
        )}
      </div>
    </li>
  )
}

function EmptyQuote({
  headingRef,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>
}) {
  return (
    <div
      className="flex flex-col items-start rounded-card border border-dashed border-grey-30 bg-grey-5 p-6 xsmall:p-8"
      data-testid="quote-empty"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan-50 text-brand-cyan">
        <ClipboardList className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2
        id="quote-list-title"
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-xl font-extrabold tracking-[-0.02em] text-brand-ink outline-none"
      >
        A sua lista de orçamento está vazia
      </h2>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-grey-60">
        No catálogo, use o botão «Adicionar» de cada produto para o juntar a
        esta lista. Depois indique as quantidades e envie um único pedido. Se
        preferir, descreva no formulário o que procura e respondemos com uma
        proposta.
      </p>
      <LocalizedClientLink
        href="/store"
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand-cyan px-5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-brand-cyan-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
        data-testid="quote-empty-catalog"
      >
        Ver catálogo
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </LocalizedClientLink>
    </div>
  )
}

function QuoteSent({
  sent,
  headingRef,
}: {
  sent: Sent
  headingRef: React.RefObject<HTMLHeadingElement>
}) {
  return (
    <section
      aria-labelledby="quote-sent-title"
      className="mt-6 max-w-[720px] rounded-card border border-hairline bg-white p-5 shadow-[0_18px_50px_rgba(35,31,32,0.06)] xsmall:p-8"
      data-testid="quote-sent"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan-50 text-brand-cyan">
        <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2
        id="quote-sent-title"
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-2xl font-extrabold tracking-[-0.02em] text-brand-ink outline-none"
      >
        Pedido de orçamento enviado
      </h2>
      <p className="mt-2 leading-relaxed text-grey-70">{CONTACT_SUCCESS_MESSAGE}</p>

      <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.06em] text-grey-60">
        Resumo do pedido · {productCountLabel(sent.items.length)}
      </h3>
      <ul className="mt-2 divide-y divide-hairline border-y border-hairline" data-testid="quote-sent-items">
        {sent.items.map((i) => (
          <li key={lineKey(i)} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-brand-ink">{i.title}</p>
              {i.sku && <p className="text-xs text-grey-50">Ref.ª {i.sku}</p>}
              {i.note && <p className="mt-1 text-sm text-grey-60">Nota: {i.note}</p>}
            </div>
            <p className="flex-none whitespace-nowrap font-bold text-brand-ink">
              {i.quantity} un.
            </p>
          </li>
        ))}
      </ul>

      <LocalizedClientLink
        href="/store"
        className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] border-hairline px-5 text-[13px] font-bold uppercase tracking-[0.04em] text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan-ink"
      >
        Continuar no catálogo
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </LocalizedClientLink>
    </section>
  )
}
