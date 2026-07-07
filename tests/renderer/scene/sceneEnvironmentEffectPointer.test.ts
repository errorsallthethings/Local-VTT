import { describe, expect, it } from "vitest";
import { getEnvironmentEffectPointerMove, getEnvironmentEffectPointerMoveAction, getEnvironmentEffectPointerStart } from "../../../src/renderer/components/scene/input/sceneEnvironmentEffectPointer";
import type { EnvironmentEffectDrag } from "../../../src/renderer/canvas/effects";

describe("scene environment effect pointer helpers", () => {
  it("starts environment effect drags for active GM left-clicks with shape tools", () => {
    expect(
      getEnvironmentEffectPointerStart({
        button: 0,
        effect: "water",
        fallbackTuning: { waterTuning: { opacity: 0.8 } },
        feather: 0.25,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        tool: "rectangle"
      })
    ).toMatchObject({
      kind: "drag",
      drag: {
        pointerId: 6,
        kind: "rectangle",
        effect: "water",
        feather: 0.25,
        waterTuning: { opacity: 0.8 },
        start: { x: 10, y: 20 },
        current: { x: 10, y: 20 }
      }
    });
  });

  it("starts polygon drafts for active GM polygon tools", () => {
    expect(
      getEnvironmentEffectPointerStart({
        button: 0,
        effect: "fire",
        fallbackTuning: {},
        feather: 0.5,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        tool: "polygon"
      })
    ).toEqual({
      kind: "polygon",
      point: { x: 10, y: 20 }
    });
  });

  it("does not start environment effect interactions for inactive contexts", () => {
    const activeOptions = {
      button: 0,
      effect: "fire" as const,
      fallbackTuning: {},
      feather: 0.5,
      hasScene: true,
      mode: "gm" as const,
      onSceneChangeAvailable: true,
      point: { x: 10, y: 20 },
      pointerId: 6,
      tool: "circle" as const
    };

    expect(getEnvironmentEffectPointerStart({ ...activeOptions, button: 1 })).toBeNull();
    expect(getEnvironmentEffectPointerStart({ ...activeOptions, hasScene: false })).toBeNull();
    expect(getEnvironmentEffectPointerStart({ ...activeOptions, mode: "player" })).toBeNull();
    expect(getEnvironmentEffectPointerStart({ ...activeOptions, onSceneChangeAvailable: false })).toBeNull();
    expect(getEnvironmentEffectPointerStart({ ...activeOptions, tool: null })).toBeNull();
  });

  it("updates only matching active environment effect drags", () => {
    const drag: EnvironmentEffectDrag = {
      pointerId: 6,
      kind: "rectangle",
      effect: "fire",
      feather: 0.5,
      start: { x: 0, y: 0 },
      current: { x: 0, y: 0 }
    };

    expect(getEnvironmentEffectPointerMove(null, 6, { x: 20, y: 10 }, false)).toBeNull();
    expect(getEnvironmentEffectPointerMove(drag, 7, { x: 20, y: 10 }, false)).toBeNull();
    expect(getEnvironmentEffectPointerMove(drag, 6, { x: 20, y: 10 }, true)?.current).toEqual({ x: 20, y: 20 });
  });

  it("maps environment effect pointer move results to SceneCanvas actions", () => {
    const drag: EnvironmentEffectDrag = {
      pointerId: 6,
      kind: "rectangle",
      effect: "fire",
      feather: 0.5,
      start: { x: 0, y: 0 },
      current: { x: 0, y: 0 }
    };
    const nextDrag = getEnvironmentEffectPointerMove(drag, 6, { x: 20, y: 10 }, true);

    expect(getEnvironmentEffectPointerMoveAction(null)).toEqual({ kind: "none" });
    expect(getEnvironmentEffectPointerMoveAction(nextDrag)).toMatchObject({
      kind: "set-preview",
      drag: {
        current: { x: 20, y: 20 }
      }
    });
  });
});
