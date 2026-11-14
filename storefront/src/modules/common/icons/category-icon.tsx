import "server-only"

import dynamicIconImports from "lucide-react/dynamicIconImports"

type IconName = keyof typeof dynamicIconImports

/**
 * Render a Lucide icon chosen per category. The name comes from the category's
 * `metadata.icon` (set in the admin icon picker) or a keyword-derived default —
 * always a real Lucide kebab-case id. Any unknown name falls back to "package"
 * so a bad value never breaks the page.
 *
 * Server component on purpose: it loads just the one icon module on the server
 * and ships plain SVG. (The client `DynamicIcon` registered all ~1,700 Lucide
 * icons as lazy chunks — a 24 KiB map chunk plus ~22 KiB of chunk-name table in
 * the webpack runtime on every page — and drew nothing until after hydration.)
 * Client components (category strip, side menu) get the rendered icons as
 * props from their server parent.
 */
const CategoryIcon = async ({
  name,
  className = "h-5 w-5",
}: {
  name?: string | null
  className?: string
}) => {
  const safe: IconName =
    name && Object.prototype.hasOwnProperty.call(dynamicIconImports, name)
      ? (name as IconName)
      : "package"
  const { default: Icon } = await dynamicIconImports[safe]()
  return <Icon className={className} aria-hidden />
}

export default CategoryIcon
