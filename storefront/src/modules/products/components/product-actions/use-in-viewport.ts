import { RefObject, useEffect, useState } from "react"

/**
 * Whether `ref`'s element intersects the viewport (shrunk by `rootMargin`).
 * `null` until the first observation, so callers can avoid a flash on load.
 */
export function useInViewport(
  ref: RefObject<HTMLElement | null>,
  rootMargin = "0px"
): boolean | null {
  const [inView, setInView] = useState<boolean | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return inView
}
