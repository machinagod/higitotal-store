"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const INTERVAL_MS = 5000

/**
 * The big hero's product shot, cross-fading through a few cut-out product
 * photos (decorative: aria-hidden). The first image is priority-loaded (LCP);
 * the rest load lazily. Holds still with prefers-reduced-motion and while the
 * tab is hidden.
 */
export default function HeroRotator({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (reduce?.matches) return
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setIndex((i) => (i + 1) % images.length)
      }
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [images.length])

  return (
    <div className="relative h-[320px] w-full max-w-[360px]" aria-hidden>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          loading={i === 0 ? undefined : "lazy"}
          sizes="360px"
          className={`object-contain drop-shadow-2xl transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  )
}
