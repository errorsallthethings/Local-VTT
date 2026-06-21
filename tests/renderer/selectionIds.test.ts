import { describe, expect, it } from "vitest";
import { applySelectionMode, getSelectedItemIdList, getSelectedItemIds } from "../../src/renderer/lib/scene";

describe("selection id helpers", () => {
  it("uses multi-selected ids when present", () => {
    expect([...getSelectedItemIds("single", ["a", "b"])]).toEqual(["a", "b"]);
  });

  it("falls back to the single selected id", () => {
    expect([...getSelectedItemIds("single", [])]).toEqual(["single"]);
  });

  it("returns an empty set when there is no selection", () => {
    expect([...getSelectedItemIds(null, [])]).toEqual([]);
    expect([...getSelectedItemIds(undefined)]).toEqual([]);
  });

  it("returns the effective selected id list", () => {
    expect(getSelectedItemIdList("single", ["a", "b"])).toEqual(["a", "b"]);
    expect(getSelectedItemIdList("single", [])).toEqual(["single"]);
    expect(getSelectedItemIdList(null, [])).toEqual([]);
  });

  it("replaces, adds, and subtracts selected ids", () => {
    expect(applySelectionMode(["a", "b"], ["c"], "replace")).toEqual(["c"]);
    expect(applySelectionMode(["a", "b"], ["b", "c"], "add")).toEqual(["a", "b", "c"]);
    expect(applySelectionMode(["a", "b", "c"], ["b"], "subtract")).toEqual(["a", "c"]);
  });
});
