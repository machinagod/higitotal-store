import { Award, Clock, Headset, Wrench, type LucideIcon } from "lucide-react"
import { COMPANY, yearsInBusiness } from "@lib/company"

type Item = {
  Icon: LucideIcon
  title: string
  subtitle: string
  /** Shorter copy for the compact mobile/tablet layouts (below `medium`). */
  mobileTitle?: string
  mobileSubtitle?: string
}

const TrustBar = () => {
  const items: Item[] = [
    {
      Icon: Headset,
      title: "Atendimento dedicado",
      subtitle: "Um comercial para a sua empresa",
      mobileTitle: "Comercial dedicado",
      mobileSubtitle: "Para a sua empresa",
    },
    {
      Icon: Clock,
      title: `${yearsInBusiness()} anos de experiência`,
      subtitle: `Desde ${COMPANY.since}, em Mirandela`,
      mobileTitle: `Desde ${COMPANY.since}`,
      mobileSubtitle: `${yearsInBusiness()} anos de experiência`,
    },
    {
      Icon: Award,
      title: "Marcas líderes",
      subtitle: "Fagor · Sammic · Nilfisk",
      mobileSubtitle: "Fagor, Nilfisk e mais",
    },
    {
      Icon: Wrench,
      title: "Assistência técnica própria",
      subtitle: "Técnicos especializados",
      mobileTitle: "Assistência própria",
      mobileSubtitle: "Técnicos especializados",
    },
  ]

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-large border border-hairline bg-white small:grid-cols-4">
      {items.map((item, i) => {
        // Mobile (2x2, text only below 512px so each item stays at two lines):
        // right border on left column only, bottom border on top row only.
        // Desktop (4-up): right border on all but the last.
        const mobileRight = i % 2 === 0 ? "border-r" : "border-r-0"
        const mobileBottom = i < 2 ? "border-b" : "border-b-0"
        const desktopRight =
          i < items.length - 1 ? "small:border-r" : "small:border-r-0"
        return (
          <div
            key={item.title}
            className={`flex items-center gap-2.5 border-[#eef1f4] px-3 py-3 small:gap-3 small:border-b-0 small:px-4 small:py-5 medium:gap-3.5 medium:px-6 ${mobileRight} ${mobileBottom} ${desktopRight}`}
          >
            <span className="hidden xsmall:flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand-cyan-50 text-brand-cyan small:h-[42px] small:w-[42px] small:rounded-[12px]">
              <item.Icon className="h-4 w-4 small:h-5 small:w-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <b className="block text-[12.5px] font-bold leading-tight text-brand-ink small:text-sm">
                <span className="medium:hidden">{item.mobileTitle ?? item.title}</span>
                <span className="hidden medium:inline">{item.title}</span>
              </b>
              <span className="mt-0.5 block text-[11px] leading-tight text-[#5a636c] small:text-xs">
                <span className="medium:hidden">
                  {item.mobileSubtitle ?? item.subtitle}
                </span>
                <span className="hidden medium:inline">{item.subtitle}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TrustBar
