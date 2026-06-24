import { describe, expect, it } from "vitest";
import { reorderByDropTarget } from "../../src/renderer/lib/ui";

describe("reorderByDropTarget", () => {
  const items = [{ id: "one" }, { id: "two" }, { id: "three" }, { id: "four" }];

  it("moves an item before a target", () => {
    const reordered = reorderByDropTarget(items, (item) => item.id, "four", "two", "before");

    expect(reordered.map((item) => item.id)).toEqual(["one", "four", "two", "three"]);
  });

  it("moves an item after a target", () => {
    const reordered = reorderByDropTarget(items, (item) => item.id, "one", "three", "after");

    expect(reordered.map((item) => item.id)).toEqual(["two", "three", "one", "four"]);
  });

  it("returns the original order when source or target is invalid", () => {
    expect(reorderByDropTarget(items, (item) => item.id, "missing", "two", "before")).toEqual(items);
    expect(reorderByDropTarget(items, (item) => item.id, "one", "missing", "before")).toEqual(items);
  });
});
