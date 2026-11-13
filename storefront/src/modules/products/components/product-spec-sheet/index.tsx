import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { FileText } from "lucide-react"

import { specSheetUrl } from "@lib/util/product-specs"

/**
 * "Ficha técnica (PDF)" secondary button for the product's spec sheet, stored
 * at product.metadata.spec_pdf_url. Renders nothing when there is none.
 */
const ProductSpecSheet = ({
  product,
  className,
}: {
  product: HttpTypes.StoreProduct
  className?: string
}) => {
  const url = specSheetUrl(product.metadata as Record<string, unknown> | null)

  if (!url) {
    return null
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={clx(
        "inline-flex h-12 items-center justify-center gap-2 rounded-pill border-[1.5px] border-hairline bg-white px-5 text-[13px] font-bold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan",
        className
      )}
      data-testid="product-spec-sheet"
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      Ficha técnica (PDF)
      <span className="sr-only"> (abre num novo separador)</span>
    </a>
  )
}

export default ProductSpecSheet
