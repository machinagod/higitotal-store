import React from "react"

/**
 * Renders one or more schema.org objects as a JSON-LD `<script>`. Server
 * component — safe to drop into any layout or page. The payload is
 * developer-controlled structured data (not user input), serialized with `<`
 * escaped so a stray closing tag in a field can't break out of the script.
 */
export default function JsonLd({
  data,
}: {
  data: Record<string, any> | Record<string, any>[]
}) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
