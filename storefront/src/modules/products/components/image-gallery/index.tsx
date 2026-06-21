import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const main = images?.[0]
  const thumbs = (images || []).slice(0, 5)

  return (
    <div className="flex flex-col gap-3">
      {/* Main image — square, white background; product sits cleanly via
          object-contain + multiply (removes the white box halo). */}
      <div className="relative aspect-square w-full overflow-hidden rounded-card border border-hairline bg-white">
        {main?.url ? (
          <Image
            src={main.url}
            priority
            alt="Imagem do produto"
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-contain p-6 small:p-10 mix-blend-multiply"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-fg-muted">
            Sem imagem
          </div>
        )}
      </div>

      {/* Thumbnail strip (only when there are multiple images) */}
      {thumbs.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {thumbs.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-[12px] border border-hairline bg-white"
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  alt={`Imagem ${index + 1}`}
                  fill
                  sizes="120px"
                  className="object-contain p-2 mix-blend-multiply"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
