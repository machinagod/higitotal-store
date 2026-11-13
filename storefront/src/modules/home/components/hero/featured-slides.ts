// Shared (server-safe) slide data for the hero product-range carousel. Kept out of
// the "use client" component so server components (the home page) can import it to
// resolve a representative product image per collection.
export type Slide = {
  /** Short eyebrow naming the kind of range (not a repeated "Em destaque"). */
  eyebrow: string
  title: string
  blurb: string
  href: string
  handle: string
}

export const SLIDES: Slide[] = [
  {
    eyebrow: "Cozinha profissional",
    title: "Fornos profissionais",
    blurb: "Fornos combinados Fagor para cozinha profissional.",
    href: "/collections/fornos-profissionais",
    handle: "fornos-profissionais",
  },
  {
    eyebrow: "Limpeza mecânica",
    title: "Máquinas de limpeza",
    blurb: "Lavadoras-secadoras e aspiradores Nilfisk e Viper.",
    href: "/collections/maquinas-de-limpeza",
    handle: "maquinas-de-limpeza",
  },
  {
    eyebrow: "Química profissional",
    title: "Diversey",
    blurb: "Suma, Taski, Clax e outras marcas profissionais Diversey.",
    href: "/collections/diversey",
    handle: "diversey",
  },
  {
    eyebrow: "Química profissional",
    title: "Unilever",
    blurb: "Cif, Sun, Comfort e outras marcas profissionais Unilever.",
    href: "/collections/unilever",
    handle: "unilever",
  },
  {
    eyebrow: "Sistemas de limpeza",
    title: "Vileda",
    blurb: "Mopas, panos de microfibra, carros e sistemas de limpeza Vileda.",
    href: "/collections/vileda",
    handle: "vileda",
  },
]
