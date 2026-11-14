import { categoryChanges } from "../category-update"

describe("categoryChanges", () => {
  const row = {
    id: "pcat_1",
    name: "Sacos",
    parent_category_id: null,
    is_active: true,
    is_internal: false,
    metadata: { moloni_category_id: 7584780 },
  }

  it("is empty when name and parent are unchanged (null ≡ undefined)", () => {
    expect(categoryChanges(row, { name: "Sacos", parent_category_id: null })).toEqual([])
    expect(
      categoryChanges({ ...row, parent_category_id: undefined }, { name: "Sacos", parent_category_id: null })
    ).toEqual([])
  })

  it("reports renamed / re-parented categories", () => {
    expect(categoryChanges(row, { name: "Sacos Lixo", parent_category_id: null })).toEqual(["name"])
    expect(categoryChanges(row, { name: "Sacos", parent_category_id: "pcat_0" })).toEqual([
      "parent_category_id",
    ])
  })

  it("hides a grouping category only once", () => {
    expect(categoryChanges(row, { is_active: false, is_internal: true })).toEqual([
      "is_active",
      "is_internal",
    ])
    expect(
      categoryChanges({ ...row, is_active: false, is_internal: true }, { is_active: false, is_internal: true })
    ).toEqual([])
  })

  it("treats an unknown row as fully changed", () => {
    expect(categoryChanges(undefined, { name: "x", parent_category_id: null })).toEqual([
      "name",
      "parent_category_id",
    ])
  })
})
