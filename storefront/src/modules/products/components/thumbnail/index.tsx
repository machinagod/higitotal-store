import { clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

import ImagePlaceholder from "@modules/products/components/image-placeholder"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  /** Accessible/SEO alt text — pass the product title when available. */
  alt?: string
  /** Optional glyph for the no-image placeholder (e.g. a category icon). */
  placeholderIcon?: React.ReactNode
  "data-testid"?: string
}

/** Rendered width per size, for `next/image` `sizes`. */
const SIZES: Record<NonNullable<ThumbnailProps["size"]>, string> = {
  small: "180px",
  medium: "290px",
  large: "440px",
  // Product cards: 2 columns on phones, 3 on tablets/small laptops, 4 above.
  full: "(max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 340px",
  square: "(max-width: 640px) 120px, 240px",
}

/**
 * Product image tile: square, light background, the pack shot fitted inside
 * (`object-contain` with ~8% breathing room) and multiplied onto the tile so
 * white photo backgrounds blend in. One background only — no card shadow.
 */
const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured: _isFeatured,
  className,
  alt,
  placeholderIcon,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <div
      className={clx(
        "relative aspect-square w-full overflow-hidden rounded-btn bg-[#f5f7f9]",
        {
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        },
        className
      )}
      data-testid={dataTestid}
    >
      {initialImage ? (
        <Image
          src={initialImage}
          alt={alt || "Imagem do produto"}
          className="absolute inset-0 h-full w-full object-contain object-center p-[8%] mix-blend-multiply"
          draggable={false}
          quality={50}
          sizes={SIZES[size]}
          fill
        />
      ) : (
        <ImagePlaceholder
          icon={placeholderIcon}
          showLabel={size === "full" || size === "medium" || size === "large"}
        />
      )}
    </div>
  )
}

export default Thumbnail
