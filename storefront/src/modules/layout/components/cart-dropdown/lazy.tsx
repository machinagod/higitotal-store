"use client"

import dynamic from "next/dynamic"

/**
 * The cart dropdown in its own chunk. The header only renders it when selling
 * (never in catalog mode), yet as a static import its Popover, @medusajs/ui
 * pieces and line-item components rode along in the layout bundle of every
 * page. Still server-rendered; the chunk loads only where it is rendered.
 */
const CartDropdown = dynamic(() => import("./index"))

export default CartDropdown
