import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getNavCategoriesWithImages } from "@lib/data/categories"
import CategoryIcon from "@modules/common/icons/category-icon"
import { ArrowRight, LayoutGrid } from "lucide-react"

// The trailing "Ver catálogo completo" tile spans whatever is left of the last
// row, so the grid always ends on a full row (2 columns mobile, 3 tablet, 5
// desktop). Static class maps keep the spans visible to Tailwind's scanner.
const SPAN_MOBILE: Record<number, string> = { 1: "col-span-1", 2: "col-span-2" }
const SPAN_TABLET: Record<number, string> = {
  1: "xsmall:col-span-1",
  2: "xsmall:col-span-2",
  3: "xsmall:col-span-3",
}
const SPAN_DESKTOP: Record<number, string> = {
  1: "small:col-span-1",
  2: "small:col-span-2",
  3: "small:col-span-3",
  4: "small:col-span-4",
  5: "small:col-span-5",
}
const remaining = (count: number, cols: number) => cols - (count % cols) || cols

const CategoryCards = async ({ countryCode }: { countryCode: string }) => {
  const categories = await getNavCategoriesWithImages(countryCode)

  if (!categories.length) {
    return null
  }

  const n = categories.length
  const ctaSpan = [
    SPAN_MOBILE[remaining(n, 2)],
    SPAN_TABLET[remaining(n, 3)],
    SPAN_DESKTOP[remaining(n, 5)],
  ].join(" ")
  // A wide CTA tile lays out horizontally; a single-cell one stacks.
  const ctaWideDesktop = remaining(n, 5) > 1

  return (
    <section>
      <div className="mb-[18px] flex flex-col items-start gap-1 small:mb-7 small:flex-row small:items-end small:justify-between small:gap-5">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan-ink">
            <span className="ind" />
            Catálogo
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[34px]">
            Explorar por categoria
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.04em] text-brand-cyan-ink hover:text-brand-ink small:inline-flex"
        >
          Ver catálogo completo
          <span aria-hidden>→</span>
        </LocalizedClientLink>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xsmall:grid-cols-3 small:grid-cols-5 small:gap-4">
        {categories.map((cat) => {
          const image = cat.images[0]
          return (
            <LocalizedClientLink
              key={cat.href}
              href={cat.href}
              className="group flex flex-col overflow-hidden rounded-[16px] border border-hairline bg-white transition-all hover:-translate-y-1 hover:border-brand-cyan-100 hover:shadow-[0_18px_40px_rgba(16,24,40,0.10)] small:rounded-card"
            >
              {/* One visual per card: the product shot, or the icon if none. */}
              <span className="relative flex aspect-[4/3] items-center justify-center bg-[#f5f8fa]">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 512px) 30vw, 45vw"
                    className="object-contain p-4 mix-blend-multiply transition-transform duration-300 group-hover:scale-105 small:p-6"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-brand-cyan-50 text-brand-cyan small:h-16 small:w-16">
                    <CategoryIcon name={cat.icon} className="h-7 w-7 small:h-8 small:w-8" />
                  </span>
                )}
              </span>
              <span className="flex flex-1 items-center justify-between gap-2 px-3.5 py-3 small:px-5 small:py-4">
                <h3 className="min-w-0 text-[14px] font-bold leading-tight tracking-tight text-brand-ink [overflow-wrap:normal] [word-break:normal] small:text-[15px]">
                  {cat.label}
                </h3>
                {/* The whole card is the link; below 360px the arrow would push
                    single long words ("Detergentes") out of the card. */}
                <span aria-hidden className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-[1.5px] border-hairline text-brand-ink transition-colors max-[359px]:hidden group-hover:border-brand-cyan group-hover:bg-brand-cyan group-hover:text-white small:h-8 small:w-8">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </span>
            </LocalizedClientLink>
          )
        })}

        <LocalizedClientLink
          href="/store"
          className={`group flex min-h-[120px] gap-4 rounded-[16px] bg-brand-ink p-5 text-white transition-all hover:-translate-y-1 hover:bg-black small:rounded-card small:p-6 ${ctaSpan} ${
            ctaWideDesktop
              ? "flex-row items-center justify-between"
              : "flex-col justify-between"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-white/10 text-brand-cyan">
              <LayoutGrid className="h-5 w-5" />
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] font-bold leading-tight small:text-base">
                Ver catálogo completo
              </span>
              <span className="mt-0.5 text-xs text-white/60">
                Todas as categorias e marcas
              </span>
            </span>
          </span>
          <span className="flex h-9 w-9 flex-none items-center justify-center self-end rounded-full bg-brand-cyan text-white transition-transform group-hover:translate-x-0.5 small:self-auto">
            <ArrowRight className="h-4 w-4" />
          </span>
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default CategoryCards
