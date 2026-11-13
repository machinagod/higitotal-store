import { clx } from "@medusajs/ui"
import React from "react"

/** Higitotal "H" mark (from /public/higitotal/favicon.svg), inlined. */
export const HigitotalMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 75 75"
    className={className}
    aria-hidden
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="matrix(0.96571279,0,0,0.96571279,8.6320255,-0.74846574)">
      <path
        d="M 11.604156,21.887943 C 31.045209,18.372373 47.855121,11.187088 58.755553,4.0018008 L 57.383978,22.738243 H 11.524501 Z"
        fill="#00adef"
        fillRule="evenodd"
      />
      <path
        d="m 11.175115,25.663725 h 13.21316 L 21.397504,45.396961 40.672855,45.54333 43.576256,25.663725 H 57.031365 L 49.060456,76.48712 H 35.847297 L 39.17411,55.656115 19.771062,55.523052 16.410645,76.48712 H 3.1974864 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </g>
  </svg>
)

type ImagePlaceholderProps = {
  /**
   * Replace the Higitotal mark with another glyph, e.g. the product's category
   * icon (`<CategoryIcon name={…} />`).
   */
  icon?: React.ReactNode
  /** Show the "Imagem brevemente disponível" caption (off for tiny thumbs). */
  showLabel?: boolean
  /** Fill the parent (absolute inset-0). Default true. */
  fill?: boolean
  className?: string
}

/**
 * Branded stand-in for a product without a photo: the light image tile, a
 * muted Higitotal mark (or a category icon) and a short caption — deliberately
 * calm so it never reads as a broken image. Reusable on the PDP gallery.
 */
const ImagePlaceholder = ({
  icon,
  showLabel = true,
  fill = true,
  className,
}: ImagePlaceholderProps) => {
  return (
    <div
      className={clx(
        "flex flex-col items-center justify-center gap-2.5 bg-[#f5f7f9] p-[8%] text-center",
        fill && "absolute inset-0 h-full w-full",
        className
      )}
      data-testid="image-placeholder"
      role="img"
      aria-label="Imagem brevemente disponível"
    >
      <span className="flex aspect-square w-[22%] min-w-[20px] max-w-[72px] items-center justify-center text-grey-30 opacity-80 [&>svg]:h-full [&>svg]:w-full">
        {icon ?? <HigitotalMark />}
      </span>
      {showLabel && (
        <span className="max-w-[22ch] text-[11px] font-medium leading-snug text-grey-50 small:text-xs">
          Imagem brevemente disponível
        </span>
      )}
    </div>
  )
}

export default ImagePlaceholder
