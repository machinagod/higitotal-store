"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { ImageIcon, Maximize2 } from "lucide-react"
import Image from "next/image"
import { useCallback, useRef, useState } from "react"

import Lightbox from "./lightbox"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  /** Product title — used for the images' alt text. */
  title: string
}

/** Branded tile shown when a product has no photo yet (short on mobile). */
const NoImageTile = () => (
  <div
    className="relative flex aspect-[2/1] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-card border border-hairline bg-gradient-to-br from-[#f4f8fa] to-[#e8f3f8] small:aspect-[4/3]"
    data-testid="product-image-placeholder"
  >
    <span
      aria-hidden="true"
      className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-cyan/10"
    />
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-cyan shadow-[0_6px_20px_rgba(0,173,239,0.15)] small:h-14 small:w-14">
      <ImageIcon className="h-6 w-6" aria-hidden="true" />
    </span>
    <p className="text-sm font-semibold text-grey-60">
      Imagem brevemente disponível
    </p>
  </div>
)

/**
 * Product gallery: a scroll-snap row of images (swipe on touch; 4:3 on mobile
 * so the title stays near the fold, square on desktop) with dots on mobile and
 * thumbnail buttons on desktop (click or arrow keys). Tapping an image opens a
 * full-screen viewer. Falls back to a branded "Imagem brevemente disponível"
 * tile.
 */
const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const usable = (images || []).filter((i) => !!i.url)
  const thumbs = usable.slice(0, 6)
  const [active, setActive] = useState(0)
  const [zoomAt, setZoomAt] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const slideRefs = useRef<(HTMLButtonElement | null)[]>([])
  const activeRef = useRef(0)
  activeRef.current = active
  const count = usable.length

  const goTo = useCallback((i: number, behavior: ScrollBehavior = "smooth") => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior })
    setActive(i)
  }, [])

  const onScroll = () => {
    const el = trackRef.current
    if (!el || !el.clientWidth) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== activeRef.current && i >= 0 && i < count) setActive(i)
  }

  const closeZoom = useCallback(
    (last: number) => {
      setZoomAt(null)
      goTo(last, "instant" as ScrollBehavior)
      // Back to the image that was opened (now the visible one).
      requestAnimationFrame(() =>
        slideRefs.current[last]?.focus({ preventScroll: true })
      )
    },
    [goTo]
  )

  if (!count) {
    return <NoImageTile />
  }

  const onThumbKey = (e: React.KeyboardEvent, index: number) => {
    const last = thumbs.length - 1
    let next: number | null = null
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1
    if (e.key === "Home") next = 0
    if (e.key === "End") next = last
    if (next === null) return
    e.preventDefault()
    goTo(next)
    thumbRefs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-3" data-testid="product-gallery">
      {/* Main images — swipeable row; object-contain + multiply removes the
          white box halo of product shots. */}
      <div className="relative overflow-hidden rounded-card border border-hairline bg-white">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          aria-label={count > 1 ? "Imagens do produto" : undefined}
          role={count > 1 ? "group" : undefined}
        >
          {usable.map((image, index) => (
            <button
              key={image.id}
              ref={(el) => {
                slideRefs.current[index] = el
              }}
              type="button"
              onClick={() => setZoomAt(index)}
              tabIndex={index === active ? 0 : -1}
              aria-label={
                count > 1
                  ? `Ampliar imagem ${index + 1} de ${count}`
                  : "Ampliar imagem"
              }
              className="group relative aspect-[4/3] w-full flex-none cursor-zoom-in snap-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-cyan/25 small:aspect-square"
              data-testid="product-gallery-slide"
            >
              <Image
                src={image.url}
                priority={index === 0}
                alt={count > 1 ? `${title} — imagem ${index + 1} de ${count}` : title}
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-contain p-4 mix-blend-multiply small:p-10"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-white/90 text-grey-60 opacity-80 transition-opacity group-hover:opacity-100"
              >
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: dots */}
      {count > 1 && (
        <div className="-mt-1 flex justify-center small:hidden">
          {usable.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ver imagem ${index + 1} de ${count}`}
              aria-current={index === active ? "true" : undefined}
              className="flex h-6 w-6 items-center justify-center"
              data-testid="product-gallery-dot"
            >
              <span
                className={clx(
                  "block h-2 rounded-full transition-all",
                  index === active ? "w-4 bg-brand-cyan" : "w-2 bg-grey-30"
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Desktop: thumbnail strip */}
      {thumbs.length > 1 && (
        <div
          className="hidden grid-cols-6 gap-3 small:grid"
          role="group"
          aria-label="Miniaturas do produto"
        >
          {thumbs.map((image, index) => {
            const isActive = index === active
            return (
              <button
                key={image.id}
                type="button"
                ref={(el) => {
                  thumbRefs.current[index] = el
                }}
                onClick={() => goTo(index)}
                onKeyDown={(e) => onThumbKey(e, index)}
                aria-label={`Ver imagem ${index + 1}`}
                aria-pressed={isActive}
                tabIndex={isActive ? 0 : -1}
                className={clx(
                  "relative aspect-square overflow-hidden rounded-[12px] border-2 bg-white transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/25",
                  isActive
                    ? "border-brand-cyan"
                    : "border-hairline hover:border-[#cdd5dd]"
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-contain p-2 mix-blend-multiply"
                />
              </button>
            )
          })}
        </div>
      )}

      {zoomAt !== null && (
        <Lightbox
          images={usable}
          title={title}
          startIndex={zoomAt}
          onClose={closeZoom}
        />
      )}
    </div>
  )
}

export default ImageGallery
