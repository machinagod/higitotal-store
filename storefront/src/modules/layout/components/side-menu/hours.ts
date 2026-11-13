/**
 * Compact opening hours for tight spots (mobile menu):
 * "Segunda a sexta, 9h00–12h30 e 14h00–18h30" → "Seg–Sex 9h00–12h30 · 14h00–18h30".
 * Unknown formats are returned unchanged.
 */
export function shortHours(hours: string): string {
  const days: Record<string, string> = {
    segunda: "Seg",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
    domingo: "Dom",
  }
  const key = (d: string) =>
    days[
      d
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/-feira$/, "")
    ]
  const m = /^\s*([\p{L}-]+)\s+a\s+([\p{L}-]+)\s*,\s*(.+)$/u.exec(hours ?? "")
  if (!m) return hours
  const from = key(m[1])
  const to = key(m[2])
  if (!from || !to) return hours
  const slots = m[3].split(/\s+e\s+/).map((s) => s.trim())
  return `${from}–${to} ${slots.join(" · ")}`
}
