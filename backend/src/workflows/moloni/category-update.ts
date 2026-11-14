/**
 * Category change detection (pure — unit-tested).
 *
 * Categories have no "modified since" endpoint, so every run walks the whole
 * Moloni tree; without this, each 5-minute run re-sent every category update
 * (one `product-category.updated` event per category, ~69 per run).
 */

/** Fields fetched for existing Medusa categories. */
export const CATEGORY_STATE_FIELDS = [
  "id",
  "name",
  "parent_category_id",
  "is_active",
  "is_internal",
  "metadata",
]

/**
 * Keys of `update` whose value differs from the existing category row
 * (null ≡ undefined); empty → the update can be skipped. A missing row
 * (unknown state) counts as changed.
 */
export function categoryChanges(
  existing: Record<string, unknown> | undefined,
  update: Record<string, unknown>
): string[] {
  if (!existing) return Object.keys(update)
  return Object.entries(update)
    .filter(([k, v]) => (existing[k] ?? null) !== (v ?? null))
    .map(([k]) => k)
}
