import { describe, expect, it } from "vitest";
import { DEFAULT_TABLE_TOOLS } from "../../../src/shared/localvtt";
import { getLaserPointerMove, getLaserPointerMoveAction, getLaserPointerStart, shouldEndLaserPointer } from "../../../src/renderer/components/scene/input/sceneLaserPointer";

describe("scene laser pointer helpers", () => {
  it("starts laser drags only for active GM left-clicks with the laser tool", () => {
    const activeOptions = {
      button: 0,
      canvasTool: "laser" as const,
      eventId: "laser-1",
      hasScene: true,
      mode: "gm" as const,
      point: { x: 10, y: 20 },
      pointerId: 4,
      settings: { ...DEFAULT_TABLE_TOOLS, laserColor: "#123456", laserThickness: 11 },
      visibleInPlayer: true,
      now: 500
    };

    expect(getLaserPointerStart(activeOptions)).toEqual({
      drag: {
        pointerId: 4,
        eventId: "laser-1",
        points: [{ point: { x: 10, y: 20 }, createdAt: 500 }]
      },
      event: expect.objectContaining({
        id: "laser-1",
        type: "laser",
        color: "#123456",
        thickness: 11,
        visibleInPlayer: true
      })
    });
    expect(getLaserPointerStart({ ...activeOptions, button: 1 })).toBeNull();
    expect(getLaserPointerStart({ ...activeOptions, canvasTool: "ping" })).toBeNull();
    expect(getLaserPointerStart({ ...activeOptions, hasScene: false })).toBeNull();
    expect(getLaserPointerStart({ ...activeOptions, mode: "player" })).toBeNull();
  });

  it("updates only matching active laser drags after meaningful movement", () => {
    const activeDrag = {
      pointerId: 4,
      eventId: "laser-1",
      points: [{ point: { x: 0, y: 0 }, createdAt: 100 }]
    };

    expect(getLaserPointerMove(null, 4, { x: 20, y: 0 }, 200)).toBeNull();
    expect(getLaserPointerMove(activeDrag, 9, { x: 20, y: 0 }, 200)).toBeNull();
    expect(getLaserPointerMove(activeDrag, 4, { x: 4, y: 0 }, 200)).toBeNull();
    expect(getLaserPointerMove(activeDrag, 4, { x: 20, y: 0 }, 200)?.points).toEqual([
      { point: { x: 0, y: 0 }, createdAt: 100 },
      { point: { x: 20, y: 0 }, createdAt: 200 }
    ]);
  });

  it("maps laser pointer move results to SceneCanvas actions", () => {
    const activeDrag = {
      pointerId: 4,
      eventId: "laser-1",
      points: [{ point: { x: 0, y: 0 }, createdAt: 100 }]
    };
    const nextDrag = getLaserPointerMove(activeDrag, 4, { x: 20, y: 0 }, 200);

    expect(getLaserPointerMoveAction(null)).toEqual({ kind: "none" });
    expect(getLaserPointerMoveAction(nextDrag)).toEqual({
      kind: "emit",
      drag: {
        pointerId: 4,
        eventId: "laser-1",
        points: [
          { point: { x: 0, y: 0 }, createdAt: 100 },
          { point: { x: 20, y: 0 }, createdAt: 200 }
        ]
      }
    });
  });

  it("ends only the matching active laser drag", () => {
    const activeDrag = {
      pointerId: 4,
      eventId: "laser-1",
      points: [{ point: { x: 0, y: 0 }, createdAt: 100 }]
    };

    expect(shouldEndLaserPointer(null, 4)).toBe(false);
    expect(shouldEndLaserPointer(activeDrag, 9)).toBe(false);
    expect(shouldEndLaserPointer(activeDrag, 4)).toBe(true);
  });
});
