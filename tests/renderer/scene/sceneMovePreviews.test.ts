import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../../src/shared/localvtt";
import { getSnapAwarePointSnapshotMovePreview } from "../../../src/renderer/canvas/scene";
import type { PointSnapshotMove } from "../../../src/renderer/canvas/drawings";

describe("scene move previews", () => {
  it("moves point snapshots by pointer delta when snapping is disabled", () => {
    const scene = createDefaultScene("Move");
    const preview = getSnapAwarePointSnapshotMovePreview(scene, move(), { x: 20, y: 25 }, false);

    expect(preview.snapPoint).toBeNull();
    expect(preview.points.get("item-1")).toEqual([{ x: 20, y: 25 }, { x: 30, y: 25 }]);
  });

  it("snaps movement by projecting the snap anchor", () => {
    const scene = createDefaultScene("Move");
    scene.grid.type = "square";
    scene.grid.sizePx = 10;

    const preview = getSnapAwarePointSnapshotMovePreview(scene, move(), { x: 23, y: 26 }, true);

    expect(preview.snapPoint).toEqual({ x: 30, y: 30 });
    expect(preview.points.get("item-1")).toEqual([{ x: 25, y: 25 }, { x: 35, y: 25 }]);
  });

  it("does not snap moves without a snap anchor", () => {
    const scene = createDefaultScene("Move");
    scene.grid.type = "square";
    scene.grid.sizePx = 10;

    const preview = getSnapAwarePointSnapshotMovePreview(
      scene,
      {
        start: { x: 10, y: 10 },
        groupStartPoints: new Map([["item-1", [{ x: 10, y: 10 }]]])
      },
      { x: 23, y: 26 },
      true
    );

    expect(preview.snapPoint).toBeNull();
    expect(preview.points.get("item-1")).toEqual([{ x: 23, y: 26 }]);
  });
});

function move(): PointSnapshotMove {
  return {
    start: { x: 10, y: 10 },
    snapAnchor: { x: 15, y: 15 },
    groupStartPoints: new Map([
      [
        "item-1",
        [
          { x: 10, y: 10 },
          { x: 20, y: 10 }
        ]
      ]
    ])
  };
}
