"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight, Pause, Play } from "lucide-react"
import { SLIDES } from "@modules/home/components/hero/featured-slides"

const SLIDE_MS = 5000

type FeaturedCarouselProps = {
  // Representative product image per slide, keyed by collection handle. Resolved
  // server-side; a slide with no image (e.g. an empty/draft collection) renders
  // text-only.
  images?: Record<string, string | undefined>
}

/**
 * Hero side card: an auto-rotating carousel over a few product ranges.
 *
 * Accessibility (APG carousel pattern):
 * - slides are stacked + cross-faded (fixed height, no layout shift); hidden
 *   slides are `inert`, so their links can't take focus;
 * - auto-advance pauses while hovered or while focus is inside, stops for
 *   good once the visitor touches it or uses the pause button, and never
 *   starts when `prefers-reduced-motion: reduce`;
 * - a visible pause/play button, and dot buttons with a ≥24×24 hit area;
 * - slide changes are announced (aria-live) only when not auto-rotating.
 */
const FeaturedCarousel = ({ images }: FeaturedCarouselProps) => {
  const [active, setActive] = useState(0)
  // Transient pauses (pointer over / focus inside).
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  // Stopped by the visitor (button, touch) or by reduced-motion preference.
  const [stopped, setStopped] = useState(false)
  // Restarts the progress animation in step with the restarted timer.
  const [cycle, setCycle] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const paused = stopped || hovered || focused
  const count = SLIDES.length

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) setStopped(true)
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setStopped(true)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // setTimeout keyed on [paused, active] so the timer restarts whenever the slide
  // changes (auto-advance or manual) or rotation resumes.
  useEffect(() => {
    if (paused) return
    setCycle((c) => c + 1)
    const t = setTimeout(() => setActive((i) => (i + 1) % count), SLIDE_MS)
    return () => clearTimeout(t)
  }, [paused, active, count])

  return (
    <section
      ref={rootRef}
      aria-roledescription="carrossel"
      aria-label="Gamas em destaque"
      className="relative flex flex-col overflow-hidden rounded-card border border-hairline bg-white p-5 small:p-7"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
          setFocused(false)
        }
      }}
      onTouchStart={() => setStopped(true)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(0,173,239,0.18),transparent_70%)]"
      />

      <div
        className="relative z-[2] min-h-[160px] small:min-h-[170px]"
        aria-live={paused ? "polite" : "off"}
      >
        {SLIDES.map((s, idx) => {
          const image = images?.[s.handle]
          const isActive = idx === active
          return (
            <div
              key={s.href}
              role="group"
              aria-roledescription="diapositivo"
              aria-label={`${idx + 1} de ${count}: ${s.title}`}
              aria-hidden={!isActive}
              inert={!isActive || undefined}
              className={`absolute inset-0 flex items-center gap-4 transition-opacity duration-500 motion-reduce:transition-none ${
                isActive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-cyan-ink">
                  <span className="ind" />
                  {s.eyebrow}
                </span>
                <h3 className="mt-2.5 max-w-[14ch] text-xl font-bold leading-tight tracking-tight text-brand-ink small:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-[26ch] text-[13px] font-medium leading-snug text-[#5a636c]">
                  {s.blurb}
                </p>
                <LocalizedClientLink
                  href={s.href}
                  className="mt-4 inline-flex items-center gap-2.5 rounded-pill text-xs font-bold uppercase tracking-[0.04em] text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
                >
                  Ver gama
                  <span className="sr-only">: {s.title}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-cyan text-white">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </LocalizedClientLink>
              </div>

              {image && (
                <Image
                  src={image}
                  alt=""
                  aria-hidden
                  width={112}
                  height={112}
                  sizes="112px"
                  className="h-24 w-24 shrink-0 self-center rounded-card object-contain small:h-28 small:w-28"
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="relative z-[2] mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setStopped((s) => !s)}
          aria-label={
            stopped ? "Retomar rotação automática" : "Pausar rotação automática"
          }
          className="-ml-2 flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#5a636c] transition-colors hover:bg-[#f1f4f7] hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
          data-testid="carousel-toggle"
        >
          {stopped ? (
            <Play className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Pause className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        {SLIDES.map((s, idx) => {
          const isActive = idx === active
          return (
            <button
              key={s.href}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Ver ${s.title} (${idx + 1} de ${count})`}
              aria-current={isActive ? "true" : undefined}
              // 24×24 hit area around the small visual dot.
              className="group flex h-6 min-w-6 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
            >
              <span
                aria-hidden
                className={`relative block h-1.5 overflow-hidden rounded-full transition-all motion-reduce:transition-none ${
                  isActive ? "w-7 bg-hairline" : "w-1.5 bg-[#c9d0d6] group-hover:bg-[#98a0a8]"
                }`}
              >
                {isActive && (
                  // Fills left→right over the auto-advance interval; frozen
                  // while paused, full when rotation is stopped.
                  <span
                    key={cycle}
                    className="absolute inset-0 origin-left rounded-full bg-brand-cyan"
                    style={
                      stopped
                        ? undefined
                        : {
                            animation: `carousel-progress ${SLIDE_MS}ms linear forwards`,
                            animationPlayState: paused ? "paused" : "running",
                          }
                    }
                  />
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default FeaturedCarousel
