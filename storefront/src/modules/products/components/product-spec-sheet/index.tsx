import { HttpTypes } from "@medusajs/types"
import { DocumentText } from "@medusajs/icons"
import { Text } from "@medusajs/ui"

/**
 * Download link for the product's spec sheet (ficha técnica), stored at
 * product.metadata.spec_pdf_url (uploaded to the file store). Renders nothing
 * when the product has no spec sheet.
 */
const ProductSpecSheet = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const raw = (product.metadata as Record<string, unknown> | null)?.[
    "spec_pdf_url"
  ]

  // metadata is admin-settable, so only render an href for an http(s) URL —
  // rejects javascript:/data:/vbscript: etc.
  let url: string | undefined
  if (typeof raw === "string") {
    try {
      const parsed = new URL(raw)
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        url = parsed.toString()
      }
    } catch {
      // not a valid absolute URL — leave undefined
    }
  }

  if (!url) {
    return null
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-x-2 text-ui-fg-interactive hover:text-ui-fg-interactive-hover w-fit"
      data-testid="product-spec-sheet"
    >
      <DocumentText />
      <Text as="span" className="text-medium">
        Ficha técnica (PDF)
      </Text>
    </a>
  )
}

export default ProductSpecSheet
