import { unstable_noStore as noStore } from "next/cache"
import { catalogModeFromEnv } from "./catalog-mode-flag"

/**
 * Server-side catalog-mode check (see ./catalog-mode-flag for what it does).
 *
 * Opts the calling render out of static prerendering so the flag is always
 * evaluated at request time — otherwise a page prerendered at build time
 * (where the env var is unset) would keep showing prices after the flag is
 * switched on.
 */
export function isCatalogMode(): boolean {
  noStore()
  return catalogModeFromEnv()
}
