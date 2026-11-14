"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const INTERVAL_MS = 5000

/**
 * Rendered width of the hero shot at each breakpoint — the cut-outs are
 * square and `object-contain`, so it is min(box width, box height). Measured
 * (Playwright, `/pt`):
 *  - < 1024px: the mobile background layer, a fixed 230px box.
 *  - 1024–1279px: the desktop panel, capped by its 320px height.
 *  - ≥ 1280px: the panel shares a row with the side column, so it is narrower
 *    than its height: 229px @1280, 244px @1350, 262px from 1440 (the content
 *    container's max width). `calc(20.6vw - 33px)` tracks that within ~2px,
 *    rounded up.
 * One string for both layers — the media conditions describe whichever layer
 * is visible — so they resolve to the same candidate (see above). Keep it in
 * step with the hero layout (`hero/index.tsx`).
 */
const HERO_SIZES =
  "(min-width: 1440px) 262px, (min-width: 1280px) calc(20.6vw - 33px), (min-width: 1024px) 320px, 230px"

/**
 * The big hero's product shot, cross-fading through a few cut-out product
 * photos (decorative: aria-hidden). Holds still with prefers-reduced-motion
 * and while the tab is hidden.
 *
 * LCP: only the FIRST image is in the initial HTML, eager and
 * fetchpriority=high. With `priority` (the desktop panel) next/image also
 * preloads it; the mobile layer passes `priority={false}`. Both layers use the
 * same `HERO_SIZES`, so at any viewport they pick the same srcset candidate
 * and share that one preload/download (one request per viewport, even though
 * the hidden layer's <img> is in the DOM too). The other images are mounted
 * only after `window` `load`, and the first cross-fade happens a full
 * interval after that — so they never compete with the critical path, and no
 * later image becomes the LCP element during page load.
 */
export default function HeroRotator({
  images,
  sizes = HERO_SIZES,
  className = "relative h-[320px] w-full max-w-[360px]",
  imgClassName = "object-contain drop-shadow-2xl",
  priority = true,
}: {
  images: string[]
  /** Keep identical across instances so they share one download. */
  sizes?: string
  /** The positioned box the images fill. */
  className?: string
  imgClassName?: string
  /**
   * Preload the first image (the desktop panel is the LCP candidate). When
   * false, the first image is still eager + fetchpriority=high.
   */
  priority?: boolean
}) {
  const [index, setIndex] = useState(0)
  // True once `window` has loaded: mounts the rest of the rotation.
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (images.length < 2) return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (reduce?.matches) return

    let id: number | undefined
    const start = () => {
      setArmed(true)
      id = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          setIndex((i) => (i + 1) % images.length)
        }
      }, INTERVAL_MS)
    }
    if (document.readyState === "complete") {
      start()
    } else {
      window.addEventListener("load", start, { once: true })
    }
    return () => {
      window.removeEventListener("load", start)
      if (id !== undefined) window.clearInterval(id)
    }
  }, [images.length])

  const shown = armed ? images : images.slice(0, 1)

  return (
    <div className={className} aria-hidden>
      {shown.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={priority && i === 0}
          // On BOTH layers: React 19 also auto-preloads eager <img>s during
          // SSR and dedupes by srcset, so whichever layer renders first owns
          // the preload — both must ask for high priority (one URL, one
          // download). next/image 15 doesn't set it for `priority` itself.
          fetchPriority={i === 0 ? "high" : undefined}
          loading={i === 0 ? (priority ? undefined : "eager") : "lazy"}
          sizes={sizes}
          className={`${imgClassName} transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  )
}
