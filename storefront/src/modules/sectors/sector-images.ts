import type { StaticImageData } from "next/image"

import escolasEAutarquias from "./assets/escolas-e-autarquias.webp"
import escritoriosECondominios from "./assets/escritorios-e-condominios.webp"
import hotelaria from "./assets/hotelaria.webp"
import industriaAlimentar from "./assets/industria-alimentar.webp"
import laresESaude from "./assets/lares-e-saude.webp"
import escolasEAutarquiasOg from "./assets/og/escolas-e-autarquias.jpg"
import escritoriosECondominiosOg from "./assets/og/escritorios-e-condominios.jpg"
import hotelariaOg from "./assets/og/hotelaria.jpg"
import industriaAlimentarOg from "./assets/og/industria-alimentar.jpg"
import laresESaudeOg from "./assets/og/lares-e-saude.jpg"
import restauracaoOg from "./assets/og/restauracao.jpg"
import restauracao from "./assets/restauracao.webp"

/**
 * One stock photo per sector (Unsplash / Pexels, free licences — sources and
 * photographers in ./assets/CREDITS.md). Static imports: hashed, immutable,
 * sized and blur-placeholdered by next/image, no remote loader.
 *
 *  - `src`: 3:2, 1600 px wide (hero, cards).
 *  - `og`: 1200×630 crop for Open Graph / social previews.
 *  - `position`: CSS object-position that keeps the subject in frame when a
 *    layout crops the 3:2 photo to another ratio (16:9 hero, 4:3 tiles).
 *  - `alt`: pt-PT description (the sector hero; cards use it decoratively).
 */
export type SectorImage = {
  src: StaticImageData
  og: StaticImageData
  alt: string
  position: string
}

export const SECTOR_IMAGES: Record<string, SectorImage> = {
  restauracao: {
    src: restauracao,
    og: restauracaoOg,
    alt: "Cozinheiro a lavar loiça num lava-loiça de inox de uma cozinha profissional",
    position: "55% 50%",
  },
  hotelaria: {
    src: hotelaria,
    og: hotelariaOg,
    alt: "Funcionário de um hotel a arrumar as almofadas de uma cama com roupa branca",
    position: "50% 45%",
  },
  "lares-e-saude": {
    src: laresESaude,
    og: laresESaudeOg,
    alt: "Profissional de limpeza a lavar o pavimento de um espaço clínico com uma mopa plana",
    position: "65% 55%",
  },
  "escolas-e-autarquias": {
    src: escolasEAutarquias,
    og: escolasEAutarquiasOg,
    alt: "Sala de aula arrumada, com mesas e cadeiras alinhadas",
    position: "50% 50%",
  },
  "industria-alimentar": {
    src: industriaAlimentar,
    og: industriaAlimentarOg,
    alt: "Operário de touca, avental e luvas descartáveis numa unidade de produção de queijo",
    position: "35% 30%",
  },
  "escritorios-e-condominios": {
    src: escritoriosECondominios,
    og: escritoriosECondominiosOg,
    alt: "Corredor de escritórios com divisórias de vidro e pavimento limpo",
    position: "50% 50%",
  },
}

export function sectorImage(slug: string): SectorImage | undefined {
  return SECTOR_IMAGES[slug]
}

/** Open Graph entry for a sector page (absolute via the layout's metadataBase). */
export function sectorOgImage(slug: string) {
  const image = sectorImage(slug)
  if (!image) return undefined
  return {
    url: image.og.src,
    width: image.og.width,
    height: image.og.height,
    alt: image.alt,
  }
}
