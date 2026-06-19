import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Trash, Plus } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

type Spec = { label: string; value: string; unit: string }
type ApiResponse = {
  highlights: { value: string }[]
  specs: { label: string | null; value: string; unit: string | null }[]
}

const ProductAttributesWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const productId = data.id
  const [highlights, setHighlights] = useState("") // one bullet per line
  const [specs, setSpecs] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    sdk.client
      .fetch<ApiResponse>(`/admin/products/${productId}/attributes`)
      .then((d) => {
        if (!active) return
        setHighlights((d.highlights ?? []).map((h) => h.value).join("\n"))
        setSpecs(
          (d.specs ?? []).map((s) => ({
            label: s.label ?? "",
            value: s.value ?? "",
            unit: s.unit ?? "",
          }))
        )
      })
      .catch(() => toast.error("Could not load product characteristics"))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [productId])

  const addSpec = () => setSpecs((s) => [...s, { label: "", value: "", unit: "" }])
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i))
  const updateSpec = (i: number, key: keyof Spec, val: string) =>
    setSpecs((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        highlights: highlights
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        specs: specs.filter((s) => s.value.trim()),
      }
      await sdk.client.fetch(`/admin/products/${productId}/attributes`, {
        method: "POST",
        body: payload,
      })
      toast.success("Product characteristics saved")
    } catch (e) {
      toast.error("Failed to save product characteristics")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Characteristics (Amazon-style)</Heading>
        <Button size="small" onClick={save} isLoading={saving} disabled={loading}>
          Save
        </Button>
      </div>

      <div className="px-6 py-4">
        <Label size="small" weight="plus">
          About this item — one bullet per line
        </Label>
        <Textarea
          className="mt-2"
          rows={5}
          placeholder={"Ex.: Aço inoxidável AISI 304\nCapacidade 10 L\nIdeal para uso profissional"}
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="px-6 py-4">
        <div className="mb-2 flex items-center justify-between">
          <Label size="small" weight="plus">
            Specifications (label / value / unit)
          </Label>
          <Button variant="secondary" size="small" onClick={addSpec} disabled={loading}>
            <Plus /> Add row
          </Button>
        </div>
        {specs.length === 0 && (
          <Text size="small" className="text-ui-fg-subtle">
            No specifications yet.
          </Text>
        )}
        <div className="flex flex-col gap-2">
          {specs.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Label (ex.: Peso)"
                value={s.label}
                onChange={(e) => updateSpec(i, "label", e.target.value)}
              />
              <Input
                placeholder="Value (ex.: 5,4)"
                value={s.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
              />
              <Input
                placeholder="Unit (ex.: kg)"
                value={s.unit}
                onChange={(e) => updateSpec(i, "unit", e.target.value)}
              />
              <Button
                variant="transparent"
                size="small"
                onClick={() => removeSpec(i)}
                aria-label="Remove row"
              >
                <Trash />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductAttributesWidget
