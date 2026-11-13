import { getStripBrands } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Every logo sits in the same fixed box; wide marks (Nilfisk) are capped by
// width, compact ones (Fagor) by height, so they read at a similar weight.
const BOX_W = 112
const BOX_H = 30

function fit(width: number, height: number) {
  const scale = Math.min(BOX_W / width, BOX_H / height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

/**
 * "Marcas com que trabalhamos" strip. One uniform treatment: every brand —
 * logo or wordmark — renders in muted ink and takes its own colour (logos) or
 * full ink (wordmarks) on hover. Brands without a logo file render as a clean
 * text wordmark. Each tile links to the brand's collection/category/search.
 */
const Suppliers = async () => {
  const brands = await getStripBrands()

  return (
    <section aria-labelledby="brands-heading">
      <div className="rounded-card border border-hairline bg-white px-4 py-6 small:px-10 small:py-9">
        <h2
          id="brands-heading"
          className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a838c] small:mb-7"
        >
          Marcas com que trabalhamos
        </h2>
        <ul className="grid grid-cols-2 gap-2 small:grid-cols-5 small:gap-3">
          {brands.map((brand) => {
            const size = brand.logo
              ? fit(brand.logo.width, brand.logo.height)
              : null
            return (
              <li key={brand.name}>
                <LocalizedClientLink
                  href={brand.href}
                  className="group flex h-[64px] items-center justify-center rounded-[14px] px-3 transition-colors hover:bg-[#f5f8fa] small:h-[72px]"
                  aria-label={`${brand.name} — ver produtos`}
                >
                  {brand.logo && size ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={brand.logo.src}
                      alt={brand.name}
                      width={size.width}
                      height={size.height}
                      decoding="async"
                      className="block opacity-55 [filter:grayscale(1)_brightness(0.35)] transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:[filter:none]"
                      style={{ width: size.width, height: size.height }}
                    />
                  ) : (
                    <span className="whitespace-nowrap text-[19px] font-extrabold leading-none tracking-tight text-[#5d666f] opacity-80 transition-[color,opacity] duration-200 group-hover:text-brand-ink group-hover:opacity-100 small:text-[21px]">
                      {brand.wordmark ?? brand.name}
                    </span>
                  )}
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default Suppliers
