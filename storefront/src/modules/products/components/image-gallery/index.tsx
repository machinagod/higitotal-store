"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { ImageIcon } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  /** Product title — used for the images' alt text. */
  title: string
}

/** Branded tile shown when a product has no photo yet. */
const NoImageTile = () => (
  <div
    className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-card border border-hairline bg-gradient-to-br from-[#f4f8fa] to-[#e8f3f8]"
    data-testid="product-image-placeholder"
  >
    <span
      aria-hidden="true"
      className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-cyan/10"
    />
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-cyan shadow-[0_6px_20px_rgba(0,173,239,0.15)]">
      <ImageIcon className="h-6 w-6" aria-hidden="true" />
    </span>
    <p className="text-sm font-semibold text-grey-60">
      Imagem brevemente disponível
    </p>
  </div>
)

/**
 * Product gallery: main image + thumbnail buttons that switch it (click or
 * arrow keys). Falls back to a branded "Imagem brevemente disponível" tile.
 */
const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const usable = (images || []).filter((i) => !!i.url)
  const thumbs = usable.slice(0, 6)
  const [active, setActive] = useState(0)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])

  if (!usable.length) {
    return <NoImageTile />
  }

  const main = usable[Math.min(active, usable.length - 1)]

  const onThumbKey = (e: React.KeyboardEvent, index: number) => {
    const last = thumbs.length - 1
    let next: number | null = null
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1
    if (e.key === "Home") next = 0
    if (e.key === "End") next = last
    if (next === null) return
    e.preventDefault()
    setActive(next)
    thumbRefs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image — square, white background; product sits cleanly via
          object-contain + multiply (removes the white box halo). */}
      <div className="relative aspect-square w-full overflow-hidden rounded-card border border-hairline bg-white">
        <Image
          key={main.id}
          src={main.url}
          priority={active === 0}
          alt={usable.length > 1 ? `${title} — imagem ${active + 1} de ${usable.length}` : title}
          fill
          sizes="(max-width: 1024px) 100vw, 600px"
          className="object-contain p-6 mix-blend-multiply small:p-10"
        />
      </div>

      {/* Thumbnail strip (only when there are multiple images) */}
      {thumbs.length > 1 && (
        <div
          className="grid grid-cols-5 gap-3 small:grid-cols-6"
          role="group"
          aria-label="Imagens do produto"
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
                onClick={() => setActive(index)}
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
    </div>
  )
}

export default ImageGallery
