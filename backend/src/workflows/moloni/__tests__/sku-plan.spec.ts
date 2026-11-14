import {
  planProductSkuSync,
  planRenames,
  tempSku,
  type VariantState,
} from "../sku-plan"

/** Apply a RenamePlan to a sku map, asserting uniqueness after every write. */
function applyPlan(
  state: Map<string, string | null>,
  plan: { temp: { id: string; sku: string }[]; final: { id: string; sku: string }[] }
) {
  const write = (id: string, sku: string) => {
    for (const [other, s] of state) {
      if (other !== id && s === sku) throw new Error(`collision on ${sku}`)
    }
    state.set(id, sku)
  }
  for (const t of plan.temp) write(t.id, t.sku)
  // phase 2 in reverse order too, to prove order independence
  for (const f of [...plan.final].reverse()) write(f.id, f.sku)
  return state
}

describe("planRenames", () => {
  it("renames into a free sku directly (no temp)", () => {
    const plan = planRenames([{ id: "a", current: "X", target: "Y" }])
    expect(plan.temp).toEqual([])
    expect(plan.final).toEqual([{ id: "a", sku: "Y" }])
    expect(plan.blocked.size).toBe(0)
  })

  it("ignores unchanged and empty targets", () => {
    const plan = planRenames([
      { id: "a", current: "X", target: "X" },
      { id: "b", current: "Y", target: null },
      { id: "c", current: null, target: "" },
    ])
    expect(plan).toEqual({ temp: [], final: [], blocked: new Map() })
  })

  it("routes a swap (A X→Y, B Y→X) through temp skus", () => {
    const plan = planRenames([
      { id: "a", current: "X", target: "Y" },
      { id: "b", current: "Y", target: "X" },
    ])
    expect(plan.temp).toEqual([
      { id: "a", sku: tempSku("X", "a") },
      { id: "b", sku: tempSku("Y", "b") },
    ])
    const state = applyPlan(
      new Map([
        ["a", "X"],
        ["b", "Y"],
      ]),
      plan
    )
    expect(Object.fromEntries(state)).toEqual({ a: "Y", b: "X" })
  })

  it("handles a 3-way rotation", () => {
    const plan = planRenames([
      { id: "a", current: "X", target: "Y" },
      { id: "b", current: "Y", target: "Z" },
      { id: "c", current: "Z", target: "X" },
    ])
    expect(plan.blocked.size).toBe(0)
    expect(plan.temp).toHaveLength(3)
    const state = applyPlan(
      new Map([
        ["a", "X"],
        ["b", "Y"],
        ["c", "Z"],
      ]),
      plan
    )
    expect(Object.fromEntries(state)).toEqual({ a: "Y", b: "Z", c: "X" })
  })

  it("only temp-moves the blocker in a chain (A X→Y, B Y→Z)", () => {
    const plan = planRenames([
      { id: "a", current: "X", target: "Y" },
      { id: "b", current: "Y", target: "Z" },
    ])
    expect(plan.temp).toEqual([{ id: "b", sku: tempSku("Y", "b") }])
    expect(plan.final).toHaveLength(2)
  })

  it("frees a sku for a claim (new record) by moving its holder", () => {
    const plan = planRenames(
      [{ id: "a", current: "X", target: "Y" }],
      [{ id: "new", sku: "X" }]
    )
    expect(plan.temp).toEqual([{ id: "a", sku: tempSku("X", "a") }])
    expect(plan.blocked.size).toBe(0)
  })

  it("blocks a target held by an entity that is not moving", () => {
    const plan = planRenames([
      { id: "a", current: "X", target: "X" },
      { id: "b", current: "B", target: "X" },
    ])
    expect(plan.blocked.get("b")).toEqual({ sku: "X", by: ["a"] })
    expect(plan.final).toEqual([])
  })

  it("blocks every competitor for the same target (no arbitrary winner)", () => {
    const plan = planRenames(
      [{ id: "a", current: "A", target: "X" }],
      [{ id: "new", sku: "X" }]
    )
    expect(plan.blocked.get("a")).toEqual({ sku: "X", by: ["new"] })
    expect(plan.blocked.get("new")).toEqual({ sku: "X", by: ["a"] })
  })

  it("cascades: a blocked entity stays put and blocks whoever wanted its sku", () => {
    const plan = planRenames([
      { id: "c", current: "Y", target: "Y" }, // pins Y
      { id: "a", current: "X", target: "Y" }, // blocked by c → keeps X
      { id: "b", current: "B", target: "X" }, // blocked by a
    ])
    expect(plan.blocked.get("a")?.by).toEqual(["c"])
    expect(plan.blocked.get("b")?.by).toEqual(["a"])
    expect(plan.final).toEqual([])
    expect(plan.temp).toEqual([])
  })
})

const variant = (
  variantId: string,
  moloniId: number | null,
  sku: string | null,
  items: { id: string; sku: string | null }[] = []
): VariantState => ({ variantId, moloniId, sku, items })

describe("planProductSkuSync", () => {
  it("incident, same run: A RS0010→RS0030 while B takes RS0010", () => {
    const plan = planProductSkuSync({
      variants: [
        variant("vA", 234226552, "RS0010", [{ id: "iA", sku: "RS0010" }]),
        variant("vB", 234226942, "OLD-B"),
      ],
      planned: [
        { moloniId: 234226552, variantId: "vA", sku: "RS0030", manageInventory: true },
        { moloniId: 234226942, variantId: "vB", sku: "RS0010", manageInventory: true },
      ],
    })
    expect(plan.skipped.size).toBe(0)
    // A's variant must release RS0010 before B's update takes it
    expect(plan.variantTemp).toEqual([{ id: "vA", sku: tempSku("RS0010", "vA") }])
    // A's item: RS0010 → temp → RS0030, so B's implicit item can be created
    expect(plan.itemTemp).toEqual([{ id: "iA", sku: tempSku("RS0010", "iA") }])
    expect(plan.itemFinal).toEqual([
      { id: "iA", sku: "RS0030", variantId: "vA", moloniId: 234226552, from: "RS0010" },
    ])
  })

  it("incident, after the variant was already renamed: reconcile the stale item", () => {
    const plan = planProductSkuSync({
      variants: [
        // not in this run; variant already RS0030 but item still RS0010
        variant("vA", 234226552, "RS0030", [{ id: "iA", sku: "RS0010" }]),
        variant("vB", 234226942, "RS0010"),
      ],
      planned: [
        { moloniId: 234226942, variantId: "vB", sku: "RS0010", manageInventory: true },
      ],
    })
    expect(plan.skipped.size).toBe(0)
    expect(plan.variantTemp).toEqual([])
    expect(plan.itemTemp).toEqual([{ id: "iA", sku: tempSku("RS0010", "iA") }])
    expect(plan.itemFinal.map((f) => [f.id, f.sku])).toEqual([["iA", "RS0030"]])
  })

  it("reconciles drift with no collision directly (no temp)", () => {
    const plan = planProductSkuSync({
      variants: [variant("v1", 1, "NEW", [{ id: "i1", sku: "OLD" }])],
      planned: [],
    })
    expect(plan.itemTemp).toEqual([])
    expect(plan.itemFinal).toEqual([
      { id: "i1", sku: "NEW", variantId: "v1", moloniId: 1, from: "OLD" },
    ])
  })

  it("3-way rotation of Moloni references across products and their items", () => {
    const plan = planProductSkuSync({
      variants: [
        variant("v1", 1, "X", [{ id: "i1", sku: "X" }]),
        variant("v2", 2, "Y", [{ id: "i2", sku: "Y" }]),
        variant("v3", 3, "Z", [{ id: "i3", sku: "Z" }]),
      ],
      planned: [
        { moloniId: 1, variantId: "v1", sku: "Y", manageInventory: true },
        { moloniId: 2, variantId: "v2", sku: "Z", manageInventory: true },
        { moloniId: 3, variantId: "v3", sku: "X", manageInventory: true },
      ],
    })
    expect(plan.skipped.size).toBe(0)
    expect(plan.variantTemp.map((t) => t.id).sort()).toEqual(["v1", "v2", "v3"])
    const items = applyPlan(
      new Map<string, string | null>([
        ["i1", "X"],
        ["i2", "Y"],
        ["i3", "Z"],
      ]),
      { temp: plan.itemTemp, final: plan.itemFinal }
    )
    expect(Object.fromEntries(items)).toEqual({ i1: "Y", i2: "Z", i3: "X" })
  })

  it("true duplicate reference: skips the product, naming both Moloni ids + sku", () => {
    const plan = planProductSkuSync({
      variants: [
        variant("vA", 111, "DUP", [{ id: "iA", sku: "DUP" }]), // not in run
        variant("vB", 222, "B-OLD"),
      ],
      planned: [{ moloniId: 222, variantId: "vB", sku: "DUP", manageInventory: true }],
    })
    const s = plan.skipped.get(222)!
    expect(s.sku).toBe("DUP")
    expect(s.otherMoloniIds).toEqual([111])
    expect(s.reason).toContain("Moloni product 111")
    expect(s.reason).toContain("DUP")
    // nothing is moved for a skipped product
    expect(plan.variantTemp).toEqual([])
    expect(plan.itemTemp).toEqual([])
    expect(plan.itemFinal).toEqual([])
  })

  it("duplicate reference inside one run (two new products): both skipped", () => {
    const plan = planProductSkuSync({
      variants: [],
      planned: [
        { moloniId: 5, sku: "SAME", manageInventory: true },
        { moloniId: 6, sku: "SAME", manageInventory: false },
      ],
    })
    expect([...plan.skipped.keys()].sort()).toEqual([5, 6])
    expect(plan.skipped.get(5)!.otherMoloniIds).toEqual([6])
    expect(plan.skipped.get(5)!.reason).toContain("new Moloni product 6")
  })

  it("a non-Moloni variant holding the sku blocks the product", () => {
    const plan = planProductSkuSync({
      variants: [variant("vm", null, "MANUAL"), variant("v1", 1, "A")],
      planned: [{ moloniId: 1, variantId: "v1", sku: "MANUAL", manageInventory: false }],
    })
    expect(plan.skipped.get(1)!.reason).toContain("non-Moloni variant vm")
    expect(plan.skipped.get(1)!.otherMoloniIds).toEqual([])
  })

  it("an orphan inventory item holding the sku skips the product that would create one", () => {
    const plan = planProductSkuSync({
      variants: [variant("v1", 1, "OLD")],
      planned: [{ moloniId: 1, variantId: "v1", sku: "X", manageInventory: true }],
      orphanItems: [{ id: "iorphan", sku: "X" }],
    })
    expect(plan.skipped.get(1)!.reason).toContain("unlinked inventory item iorphan")
    expect(plan.variantTemp).toEqual([])
  })

  it("does not skip when the variant manages no inventory (no implicit item)", () => {
    const plan = planProductSkuSync({
      variants: [variant("v1", 1, "OLD")],
      planned: [{ moloniId: 1, variantId: "v1", sku: "X", manageInventory: false }],
      orphanItems: [{ id: "iorphan", sku: "X" }],
    })
    expect(plan.skipped.size).toBe(0)
  })

  it("a new product reclaims a sku from a stale item of another variant", () => {
    const plan = planProductSkuSync({
      variants: [variant("vA", 1, "NEWA", [{ id: "iA", sku: "R1" }])],
      planned: [{ moloniId: 9, sku: "R1", manageInventory: true }],
    })
    expect(plan.skipped.size).toBe(0)
    expect(plan.itemTemp).toEqual([{ id: "iA", sku: tempSku("R1", "iA") }])
    expect(plan.itemFinal.map((f) => [f.id, f.sku])).toEqual([["iA", "NEWA"]])
  })

  it("a new product whose implicit item collides with a pinned item is skipped", () => {
    const plan = planProductSkuSync({
      // item shared by two variants → left alone, so it pins R1
      variants: [
        variant("v1", 1, "A", [{ id: "ishared", sku: "R1" }]),
        variant("v2", 2, "B", [{ id: "ishared", sku: "R1" }]),
      ],
      planned: [{ moloniId: 9, sku: "R1", manageInventory: true }],
    })
    const s = plan.skipped.get(9)!
    expect(s.reason).toContain("inventory item ishared")
    expect(s.otherMoloniIds.sort()).toEqual([1, 2])
  })

  it("cascades skips: a skipped product pins its sku for whoever wanted it", () => {
    const plan = planProductSkuSync({
      variants: [
        variant("vX", 100, "Y", [{ id: "iX", sku: "Y" }]), // not in run, pins Y
        variant("vA", 1, "X", [{ id: "iA", sku: "X" }]),
        variant("vB", 2, "B"),
      ],
      planned: [
        { moloniId: 1, variantId: "vA", sku: "Y", manageInventory: true }, // dup of 100
        { moloniId: 2, variantId: "vB", sku: "X", manageInventory: true }, // wants A's sku
      ],
    })
    expect(plan.skipped.get(1)!.otherMoloniIds).toEqual([100])
    expect(plan.skipped.get(2)!.otherMoloniIds).toEqual([1])
    expect(plan.variantTemp).toEqual([])
    expect(plan.itemFinal).toEqual([])
  })

  it("re-plans after an implicit-item conflict skip", () => {
    // B's implicit item is blocked by an orphan → B skipped → B's variant
    // stays on BOLD, which C wanted → C skipped too (not a crash mid-update).
    const plan = planProductSkuSync({
      variants: [variant("vB", 2, "BOLD"), variant("vC", 3, "C")],
      planned: [
        { moloniId: 2, variantId: "vB", sku: "X", manageInventory: true },
        { moloniId: 3, variantId: "vC", sku: "BOLD", manageInventory: false },
      ],
      orphanItems: [{ id: "io", sku: "X" }],
    })
    expect([...plan.skipped.keys()].sort()).toEqual([2, 3])
    expect(plan.skipped.get(3)!.otherMoloniIds).toEqual([2])
  })

  it("warns (does not skip) when an item cannot follow its variant", () => {
    const plan = planProductSkuSync({
      variants: [variant("v1", 1, "NEW", [{ id: "i1", sku: "OLD" }])],
      planned: [],
      orphanItems: [{ id: "io", sku: "NEW" }],
    })
    expect(plan.skipped.size).toBe(0)
    expect(plan.itemFinal).toEqual([])
    expect(plan.itemBlocked).toHaveLength(1)
    expect(plan.itemBlocked[0].reason).toContain("unlinked inventory item io")
  })

  it("leaves multi-item variants (kits) alone", () => {
    const plan = planProductSkuSync({
      variants: [
        variant("v1", 1, "KIT", [
          { id: "i1", sku: "P1" },
          { id: "i2", sku: "P2" },
        ]),
      ],
      planned: [],
    })
    expect(plan.itemFinal).toEqual([])
    expect(plan.itemTemp).toEqual([])
  })

  it("ignores orphan entries that are actually linked items", () => {
    const plan = planProductSkuSync({
      variants: [variant("v1", 1, "NEW", [{ id: "i1", sku: "OLD" }])],
      planned: [],
      orphanItems: [{ id: "i1", sku: "OLD" }],
    })
    expect(plan.itemFinal.map((f) => f.sku)).toEqual(["NEW"])
  })
})
