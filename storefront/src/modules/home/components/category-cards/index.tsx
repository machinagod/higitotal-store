import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CATEGORIES = [
  {
    n: "01",
    title: "Detergentes",
    desc: "Ultraconcentrados, pavimentos, cozinha e WC.",
  },
  {
    n: "02",
    title: "Utensílios de Limpeza",
    desc: "Mopas, esfregões, panos e luvas profissionais.",
  },
  {
    n: "03",
    title: "Máquinas de Limpeza",
    desc: "Lavadoras-secadoras e aspiradores Nilfisk.",
  },
  {
    n: "04",
    title: "Equipamento Hoteleiro",
    desc: "Cozinha profissional Fagor e preparação Sammic.",
  },
]

const CategoryCards = () => {
  return (
    <section>
      <div className="mb-[18px] flex flex-col items-start gap-1 small:mb-7 small:flex-row small:items-end small:justify-between small:gap-5">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan">
            <span className="ind" />
            Catálogo
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-ink small:text-[34px]">
            Explorar por categoria
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-cyan small:text-xs"
        >
          Todas as categorias
          <span aria-hidden>→</span>
        </LocalizedClientLink>
      </div>

      <div className="grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-5">
        {CATEGORIES.map((cat) => (
          <LocalizedClientLink
            key={cat.n}
            href="/store"
            className="group relative overflow-hidden rounded-[16px] border border-hairline bg-white p-4 transition-all hover:-translate-y-1 hover:border-white hover:shadow-[0_18px_40px_rgba(16,24,40,0.10)] small:rounded-card small:p-7"
          >
            <span className="absolute right-4 top-4 text-[13px] font-bold text-[#c4ccd4] small:right-7 small:top-7">
              {cat.n}
            </span>
            <span className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[16px] bg-[#eaf7fe] text-xl font-extrabold text-brand-cyan small:mb-10 small:h-14 small:w-14 small:text-2xl">
              {cat.title.charAt(0)}
            </span>
            <h3 className="text-[15px] font-bold leading-tight tracking-tight text-brand-ink small:text-lg">
              {cat.title}
            </h3>
            <p className="mt-1.5 hidden text-[13px] font-medium leading-snug text-[#5a636c] small:block">
              {cat.desc}
            </p>
            <span className="mt-3 flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-hairline text-brand-ink transition-colors group-hover:border-brand-cyan group-hover:bg-brand-cyan group-hover:text-white small:mt-4 small:h-9 small:w-9">
              →
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}

export default CategoryCards
