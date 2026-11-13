import { logoRestStyle } from "@lib/brands"
import { getStripBrands } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Every mark — logo or typeset wordmark — sits in the same fixed box; wide
// marks (Nilfisk) are capped by width, compact ones (Fagor) by height, so they
// read at a similar weight. Round/square/stacked marks (Sammic, Taski,
// Unilever) carry a `logo.scale` that lifts their height cap a little — a
// 30px circle reads far lighter than a 112px-wide wordmark. The tile is 64px+
// tall, so the taller mark still has room.
const BOX_W = 112
const BOX_H = 30

function fit(width: number, height: number, optical = 1) {
  const scale = Math.min(BOX_W / width, (BOX_H * optical) / height)
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
  "SC Johnson (Deb)": "font-bold tracking-[-0.03em] text-[19px]",
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
              ? fit(brand.logo.width, brand.logo.height, brand.logo.scale)
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
                    style={{
                      width: BOX_W,
                      height: Math.max(BOX_H, size?.height ?? 0),
                    }}
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
                        className="block object-contain opacity-70 [filter:var(--logo-rest,grayscale(1)_brightness(0.35))] transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:[filter:none] group-focus-visible:opacity-100 group-focus-visible:[filter:none]"
                        style={{
                          width: size.width,
                          height: size.height,
                          ...logoRestStyle(brand.logo),
                        }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        className={`block max-w-full whitespace-nowrap px-0.5 leading-none text-brand-ink opacity-70 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 ${
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
