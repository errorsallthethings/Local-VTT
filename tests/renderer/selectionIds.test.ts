import { describe, expect, it } from "vitest";
import { getSelectedItemIds } from "../../src/renderer/lib/selectionIds";

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
});
