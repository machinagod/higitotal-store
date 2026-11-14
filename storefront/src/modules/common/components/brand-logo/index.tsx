import type { CSSProperties } from "react"

import { logoOpticalStyle, logoRestStyle, type BrandLogo } from "@lib/brands"

/**
 * One brand logo, sized into a `boxW × boxH` box with the logo's own tweaks:
 * `scale` (compact marks may grow taller), `opticalY` (visual-weight centring)
 * and, for the muted look, `restFilter`.
 *
 * - `muted`: grey at rest, own colours on hover/focus of the enclosing `.group`
 *   (home strip, Marcas menu, Sobre nós).
 * - `color`: always in the brand's colours (e.g. on light chips).
 */
export function fitLogo(logo: BrandLogo, boxW: number, boxH: number) {
  const s = Math.min(boxW / logo.width, (boxH * (logo.scale ?? 1)) / logo.height)
  return {
    width: Math.round(logo.width * s),
    height: Math.round(logo.height * s),
  }
}

export default function BrandLogoImg({
  logo,
  boxW,
  boxH,
  variant = "muted",
  alt = "",
  className = "",
}: {
  logo: BrandLogo
  boxW: number
  boxH: number
  variant?: "muted" | "color"
  alt?: string
  className?: string
}) {
  const { width, height } = fitLogo(logo, boxW, boxH)
  const style: CSSProperties = {
    width,
    height,
    ...logoOpticalStyle(logo, height),
    ...(variant === "muted" ? logoRestStyle(logo) : {}),
  }
  const look =
    variant === "muted"
      ? "opacity-70 [filter:var(--logo-rest,grayscale(1)_brightness(0.35))] transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:[filter:none] group-focus-visible:opacity-100 group-focus-visible:[filter:none]"
      : ""
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={`block object-contain ${look} ${className}`}
      style={style}
    />
  )
}
