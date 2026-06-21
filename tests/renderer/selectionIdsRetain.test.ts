import { describe, expect, it } from "vitest";
import { applySelectionMode, getSelectedItemIdList, getSelectedItemIds, retainExistingSelectionIds } from "../../src/renderer/lib/selectionIds";

describe("selection id helpers", () => {
  it("returns multi-selection ids when present", () => {
    expect(getSelectedItemIdList("single", ["a", "b"])).toEqual(["a", "b"]);
    expect(getSelectedItemIds("single", ["a", "b"])).toEqual(new Set(["a", "b"]));
  });

  it("applies add, subtract, and replace selection modes", () => {
    expect(applySelectionMode(["a"], ["b"], "add")).toEqual(["a", "b"]);
    expect(applySelectionMode(["a", "b"], ["a"], "subtract")).toEqual(["b"]);
    expect(applySelectionMode(["a"], ["b"], "replace")).toEqual(["b"]);
  });

  it("retains selected ids that still exist", () => {
    expect(retainExistingSelectionIds(["a", "b", "c"], ["b", "c", "d"])).toEqual(["b", "c"]);
  });
});
