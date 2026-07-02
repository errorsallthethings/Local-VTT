import { describe, expect, it } from "vitest";
import { getSceneItemDragGroup } from "../../src/renderer/canvas/scene";

describe("scene drag groups", () => {
  it("drags a selected group in grabber mode when the hit item is already selected", () => {
    expect(getSceneItemDragGroup("b", ["a", "b", "c"], "grabber")).toEqual({
      itemIds: ["a", "b", "c"],
      draggingSelectedGroup: true,
      shouldSelectHitItem: false
    });
  });

  it("falls back to the hit item when not in grabber mode", () => {
    expect(getSceneItemDragGroup("b", ["a", "b", "c"], "selector")).toEqual({
      itemIds: ["b"],
      draggingSelectedGroup: false,
      shouldSelectHitItem: true
    });
  });

  it("falls back to the hit item when the hit item is not part of the selection", () => {
    expect(getSceneItemDragGroup("d", ["a", "b", "c"], "grabber")).toEqual({
      itemIds: ["d"],
      draggingSelectedGroup: false,
      shouldSelectHitItem: true
    });
  });

  it("falls back to the hit item for single-item selections", () => {
    expect(getSceneItemDragGroup("b", ["b"], "grabber")).toEqual({
      itemIds: ["b"],
      draggingSelectedGroup: false,
      shouldSelectHitItem: true
    });
  });
});
