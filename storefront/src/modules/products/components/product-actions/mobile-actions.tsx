import { Dialog, Transition } from "@headlessui/react"
import { clx } from "@medusajs/ui"
import { ArrowRight, Phone } from "lucide-react"
import React, { Fragment } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { COMPANY } from "@lib/company"
import ChevronDown from "@modules/common/icons/chevron-down"
import X from "@modules/common/icons/x"

import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
  /** No prices / cart: "Ligar" + "Pedir orçamento". */
  catalogMode?: boolean
  onRequestInfo?: () => void
}

/** Height of the bar's button row (+ padding) — reserved at the page bottom. */
const BAR_SPACE = "76px"

const pillBase =
  "flex h-12 min-w-0 items-center justify-center gap-2 rounded-pill px-4 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors"

/**
 * Mobile sticky action bar (below `lg`), shown while the main CTA block is
 * scrolled out of view. Catalog mode: "Ligar" (outline, tel:) + "Pedir
 * orçamento" (filled cyan). Otherwise: variant picker + add to cart.
 */
const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
  catalogMode = false,
  onRequestInfo,
}) => {
  const { state, open, close } = useToggleState()
  const hasVariants = (product.variants?.length ?? 0) > 1

  return (
    <>
      {/* Reserve room at the end of the page so the fixed bar never hides the
          footer's last lines. Mobile/tablet only (bar is lg:hidden). */}
      <style>{`@media (max-width: 1023.98px){body{padding-bottom:calc(${BAR_SPACE} + env(safe-area-inset-bottom))}}`}</style>
      <div
        className={clx("fixed inset-x-0 bottom-0 z-[60] lg:hidden", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-out duration-200"
          enterFrom="opacity-0 translate-y-full"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-full"
        >
          <div
            className="w-full border-t border-hairline bg-white/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(35,31,32,0.08)] backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            data-testid="mobile-actions"
          >
            {catalogMode ? (
              <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3">
                <a
                  href={COMPANY.phone.href}
                  aria-label={`Ligar ${COMPANY.phone.display} (${COMPANY.phone.costNote.toLowerCase()})`}
                  className={clx(
                    pillBase,
                    "border-[1.5px] border-hairline bg-white text-brand-ink hover:border-brand-cyan hover:text-brand-cyan"
                  )}
                  data-testid="mobile-call-button"
                >
                  <Phone className="h-4 w-4 flex-none" aria-hidden="true" />
                  <span className="truncate">Ligar</span>
                </a>
                <button
                  type="button"
                  onClick={onRequestInfo}
                  className={clx(
                    pillBase,
                    "bg-brand-cyan text-white hover:bg-brand-cyan-ink"
                  )}
                  data-testid="mobile-request-info-button"
                >
                  <span className="truncate">Pedir orçamento</span>
                  <ArrowRight className="h-4 w-4 flex-none" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div
                className={clx("w-full gap-3", {
                  "grid grid-cols-2": hasVariants,
                  flex: !hasVariants,
                })}
              >
                {hasVariants && (
                  <button
                    type="button"
                    onClick={open}
                    className={clx(
                      pillBase,
                      "w-full justify-between border-[1.5px] border-hairline bg-white normal-case tracking-normal text-brand-ink"
                    )}
                    data-testid="mobile-actions-button"
                  >
                    <span className="truncate">
                      {variant ? Object.values(options).join(" / ") : "Opções"}
                    </span>
                    <ChevronDown />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!variant || isAdding}
                  className={clx(
                    pillBase,
                    "w-full bg-brand-ink text-white hover:bg-brand-cyan disabled:opacity-50"
                  )}
                  data-testid="mobile-cart-button"
                >
                  <span className="truncate">
                    {!variant
                      ? "Selecionar variante"
                      : isAdding
                      ? "A adicionar…"
                      : !inStock
                      ? "Adicionar (sob encomenda)"
                      : "Adicionar ao carrinho"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </Transition>
      </div>
      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-700 bg-opacity-75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed bottom-0 inset-x-0">
            <div className="flex min-h-full h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Panel
                  className="w-full h-full transform overflow-hidden text-left flex flex-col gap-y-3"
                  data-testid="mobile-actions-modal"
                >
                  <div className="w-full flex justify-end pr-6">
                    <button
                      onClick={close}
                      aria-label="Fechar"
                      className="bg-white w-12 h-12 rounded-full text-ui-fg-base flex justify-center items-center"
                      data-testid="close-modal-button"
                    >
                      <X />
                    </button>
                  </div>
                  <div className="bg-white px-6 py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
                    {hasVariants && (
                      <div className="flex flex-col gap-y-6">
                        {(product.options || []).map((option) => {
                          return (
                            <div key={option.id}>
                              <OptionSelect
                                option={option}
                                current={options[option.title ?? ""]}
                                updateOption={updateOptions}
                                title={option.title ?? ""}
                                disabled={optionsDisabled}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
