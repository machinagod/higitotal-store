"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

import {
  searchWithoutEnquiryParam,
  wantsEnquiryOpen,
} from "@lib/util/contact-request"

/**
 * `/products/<handle>?pedido=1` opens the enquiry dialog.
 *
 * Reads the param with useSearchParams (so it works on statically generated
 * pages, inside its own Suspense boundary), opens exactly once per mount
 * after hydration, then drops the param with a native history.replaceState —
 * Next syncs that into the router without a server round-trip, so nothing
 * re-renders or remounts and a refresh doesn't reopen the dialog.
 */
export default function EnquiryDeepLink({ onOpen }: { onOpen: () => void }) {
  const params = useSearchParams()
  const wants = wantsEnquiryOpen(params)
  const handled = useRef(false)

  useEffect(() => {
    if (!wants || handled.current) return
    handled.current = true
    onOpen()
    const { pathname, search, hash } = window.location
    window.history.replaceState(
      null,
      "",
      `${pathname}${searchWithoutEnquiryParam(search)}${hash}`
    )
  }, [wants, onOpen])

  return null
}
