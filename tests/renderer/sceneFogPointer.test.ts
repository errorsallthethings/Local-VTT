import { describe, expect, it } from "vitest";
import { getFogPointerMove, getFogPointerStart } from "../../src/renderer/components/scene/sceneFogPointer";
import type { FogDrag } from "../../src/renderer/canvas/fog";

describe("scene fog pointer helpers", () => {
  it("starts fog drags for active GM left-clicks with non-polygon tools", () => {
    expect(
      getFogPointerStart({
        brushSize: 30,
        button: 0,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        tool: "reveal-brush"
      })
    ).toEqual({
      kind: "drag",
      drag: {
        pointerId: 6,
        kind: "brush",
        start: { x: 10, y: 20 },
        current: { x: 10, y: 20 },
        points: [{ x: 10, y: 20 }],
        radius: 15,
        operation: "reveal"
      }
    });
  });

  it("starts polygon drafts for active GM polygon tools", () => {
    expect(
      getFogPointerStart({
        brushSize: 30,
        button: 0,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        tool: "hide-polygon"
      })
    ).toEqual({
      kind: "polygon",
      point: { x: 10, y: 20 },
      tool: "hide-polygon"
    });
  });

  it("does not start fog interactions for inactive contexts", () => {
    const activeOptions = {
      brushSize: 30,
      button: 0,
      hasScene: true,
      mode: "gm" as const,
      onSceneChangeAvailable: true,
      point: { x: 10, y: 20 },
      pointerId: 6,
      tool: "hide-rectangle" as const
    };

    expect(getFogPointerStart({ ...activeOptions, button: 1 })).toBeNull();
    expect(getFogPointerStart({ ...activeOptions, hasScene: false })).toBeNull();
    expect(getFogPointerStart({ ...activeOptions, mode: "player" })).toBeNull();
    expect(getFogPointerStart({ ...activeOptions, onSceneChangeAvailable: false })).toBeNull();
    expect(getFogPointerStart({ ...activeOptions, tool: null })).toBeNull();
  });

  it("updates only matching active fog drags", () => {
    const drag: FogDrag = {
      pointerId: 6,
      kind: "rectangle",
      start: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      points: [{ x: 0, y: 0 }],
      operation: "hide"
    };

    expect(getFogPointerMove(null, 6, { x: 20, y: 10 }, false)).toBeNull();
    expect(getFogPointerMove(drag, 7, { x: 20, y: 10 }, false)).toBeNull();
    expect(getFogPointerMove(drag, 6, { x: 20, y: 10 }, true)?.current).toEqual({ x: 20, y: 20 });
  });
});
