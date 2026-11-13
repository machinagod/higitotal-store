import { getStripBrands } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Every mark — SVG logo or typeset wordmark — sits in the same fixed box; wide
// marks (Nilfisk) are capped by width, compact ones (Fagor) by height, so they
// read at a similar weight.
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
 * Typographic treatment for brands without a logo file — a nod to each
 * brand's own lettering (case, weight, slant, spacing), never an imitation of
 * the trademark artwork. Unknown brands get the neutral default.
 */
const WORDMARK_STYLE: Record<string, string> = {
  Sammic: "lowercase font-extrabold tracking-[-0.04em] text-[25px]",
  Viper: "uppercase italic font-black tracking-[0.02em] text-[22px]",
  Diversey: "font-bold tracking-[-0.02em] text-[23px]",
  Taski: "uppercase font-extrabold tracking-[0.14em] text-[20px]",
  Unilever: "font-semibold tracking-[-0.01em] text-[23px]",
  "SC Johnson (Deb)": "font-bold tracking-[-0.03em] text-[22px]",
  Celea: "lowercase font-bold tracking-[0.01em] text-[25px]",
}
const WORDMARK_DEFAULT = "font-extrabold tracking-tight text-[21px]"

/**
 * "Marcas com que trabalhamos" strip. One uniform treatment: every brand sits
 * in the same 112×30 box, in the same muted ink at rest (logos are
 * grey-scaled, wordmarks are set in the brand ink at the same opacity), and
 * takes its own colour (logos) or full ink (wordmarks) on hover/focus. Each
 * tile links to the brand's landing page (category with sub-ranges,
 * collection, or a catalogue search — see `brandHref`).
 */
const Suppliers = async () => {
  const brands = await getStripBrands()

  return (
    <section aria-labelledby="brands-heading">
      <div className="rounded-card border border-hairline bg-white px-4 py-6 small:px-10 small:py-9">
        <h2
          id="brands-heading"
          className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7580] small:mb-7"
        >
          Marcas com que trabalhamos
        </h2>
        <ul className="grid grid-cols-2 gap-2 xsmall:grid-cols-3 small:grid-cols-5 small:gap-3">
          {brands.map((brand) => {
            const size = brand.logo
              ? fit(brand.logo.width, brand.logo.height)
              : null
            return (
              <li key={brand.name}>
                <LocalizedClientLink
                  href={brand.href}
                  className="group flex h-[64px] items-center justify-center rounded-[14px] px-3 transition-colors hover:bg-[#f5f8fa] focus:outline-none focus-visible:bg-[#f5f8fa] focus-visible:ring-2 focus-visible:ring-brand-cyan small:h-[72px]"
                  aria-label={`${brand.name} — ver produtos`}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{ width: BOX_W, height: BOX_H }}
                  >
                    {brand.logo && size ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={brand.logo.src}
                        alt=""
                        width={size.width}
                        height={size.height}
                        decoding="async"
                        loading="lazy"
                        className="block opacity-70 [filter:grayscale(1)_brightness(0.35)] transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:[filter:none] group-focus-visible:opacity-100 group-focus-visible:[filter:none]"
                        style={{ width: size.width, height: size.height }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        className={`block max-w-full overflow-hidden whitespace-nowrap leading-none text-brand-ink opacity-70 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 ${
                          WORDMARK_STYLE[brand.name] ?? WORDMARK_DEFAULT
                        }`}
                      >
                        {brand.wordmark ?? brand.name}
                      </span>
                    )}
                  </span>
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
