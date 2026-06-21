const BRANDS = ["Fagor", "Vileda", "Sammic", "Nilfisk", "Vileda Origo", "CELEA"]

const Suppliers = () => {
  return (
    <section>
      <div className="rounded-card border border-hairline bg-white px-[18px] py-[22px] small:px-10 small:py-[34px]">
        <div className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#98a0a8] small:mb-[22px]">
          Marcas que representamos
        </div>
        <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-4 small:justify-between small:gap-[30px]">
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="cursor-default text-[17px] font-extrabold tracking-tight text-[#b9c1c9] transition-colors hover:text-brand-ink small:text-2xl"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Suppliers
