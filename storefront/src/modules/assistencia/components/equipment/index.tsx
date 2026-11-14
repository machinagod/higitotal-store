import { BRANDS as ALL_BRANDS } from "@lib/brands"
import BrandLogoImg from "@modules/common/components/brand-logo"

// Equipment brands we service (machines/appliances) — distinct from the
// homepage "brands we represent" list. Follows our repair records (Moloni
// assistance invoices, 2024–2026): Fagor, Sammic, Nilfisk and Viper. Shown in
// their own colours on light chips (the dark section would otherwise turn the
// logos into silhouettes — Sammic's badge and Viper's oval don't survive that).
const SERVICED = ["Fagor", "Sammic", "Nilfisk", "Viper"]
const BRANDS = SERVICED.map((name) => ({
  name,
  logo: ALL_BRANDS.find((b) => b.name === name)?.logo,
}))

/**
 * Equipment covered — brand chips plus the general hygiene/catering equipment
 * note.
 */
const Equipment = () => {
  return (
    <section className="content-container pb-16 sm:pb-[74px]">
      <div className="mx-auto mb-12 max-w-[640px] text-center">
        <span className="inline-flex items-center justify-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-svc-signal">
          <span className="ind amber" />
          Equipamento a que damos assistência
        </span>
        <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-[-0.025em] text-white sm:text-[38px]">
          As marcas com que trabalha, assistidas por quem as conhece
        </h2>
        <p className="mt-3.5 text-base leading-relaxed text-svc-fg-muted">
          Damos assistência a equipamento Fagor, Sammic, Nilfisk e Viper —
          cozinha, lavandaria e máquinas de limpeza — e reparamos também
          equipamento de refrigeração, de confeção a gás e de lavandaria de
          outras marcas.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3.5">
        {BRANDS.map((b) => (
          <span
            key={b.name}
            className="flex h-[58px] min-w-[150px] items-center justify-center rounded-pill bg-white px-7"
          >
            {b.logo ? (
              <BrandLogoImg
                logo={b.logo}
                boxW={104}
                boxH={26}
                variant="color"
                alt={b.name}
              />
            ) : (
              <span className="text-base font-extrabold text-brand-ink">
                {b.name}
              </span>
            )}
          </span>
        ))}
        <span className="rounded-pill border border-dashed border-svc-line bg-svc-ground-2 px-[26px] py-[13px] text-base font-semibold tracking-[-0.01em] text-svc-fg-muted">
          + refrigeração, confeção a gás e lavandaria de outras marcas
        </span>
      </div>
    </section>
  )
}

export default Equipment
