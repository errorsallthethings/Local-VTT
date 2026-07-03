import { describe, expect, it } from "vitest";
import { getRulerPointerStart, getUpdatedRulerPointerDrag } from "../../src/renderer/components/scene/sceneRulerPointer";

describe("scene ruler pointer helpers", () => {
  it("starts a ruler drag for a GM left-click with the ruler tool", () => {
    expect(
      getRulerPointerStart({
        button: 0,
        canvasTool: "ruler",
        hasScene: true,
        mode: "gm",
        point: { x: 10, y: 20 },
        pointerId: 7
      })
    ).toEqual({
      pointerId: 7,
      start: { x: 10, y: 20 },
      current: { x: 10, y: 20 },
      waypoints: []
    });
  });

  it("does not start ruler drags for inactive contexts", () => {
    const activeOptions = {
      button: 0,
      canvasTool: "ruler" as const,
      hasScene: true,
      mode: "gm" as const,
      point: { x: 10, y: 20 },
      pointerId: 7
    };

    expect(getRulerPointerStart({ ...activeOptions, button: 1 })).toBeNull();
    expect(getRulerPointerStart({ ...activeOptions, canvasTool: "ping" })).toBeNull();
    expect(getRulerPointerStart({ ...activeOptions, hasScene: false })).toBeNull();
    expect(getRulerPointerStart({ ...activeOptions, mode: "player" })).toBeNull();
  });

  it("updates only the matching active ruler pointer drag", () => {
    const activeDrag = {
      pointerId: 7,
      start: { x: 10, y: 20 },
      current: { x: 10, y: 20 },
      waypoints: [{ x: 15, y: 25 }]
    };

    expect(getUpdatedRulerPointerDrag(activeDrag, 8, { x: 40, y: 50 })).toBeNull();
    expect(getUpdatedRulerPointerDrag(null, 7, { x: 40, y: 50 })).toBeNull();
    expect(getUpdatedRulerPointerDrag(activeDrag, 7, { x: 40, y: 50 })).toEqual({
      ...activeDrag,
      current: { x: 40, y: 50 }
    });
  });
});
