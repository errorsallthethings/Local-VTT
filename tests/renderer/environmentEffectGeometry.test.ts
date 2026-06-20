import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import { environmentDragToMask, isMeaningfulEnvironmentEffectDrag, shouldAnimateEnvironmentEffects, type EnvironmentEffectDrag } from "../../src/renderer/canvas/environmentEffectGeometry";

function drag(overrides: Partial<EnvironmentEffectDrag> = {}): EnvironmentEffectDrag {
  return {
    pointerId: 1,
    kind: "rectangle",
    effect: "water",
    feather: 0,
    start: { x: 10, y: 20 },
    current: { x: 40, y: 70 },
    ...overrides
  };
}

describe("environment effect geometry", () => {
  it("converts rectangle and polygon drags into preview masks with start/current points", () => {
    expect(environmentDragToMask(drag())).toMatchObject({
      id: "preview",
      kind: "rectangle",
      effect: "water",
      feather: 0,
      points: [{ x: 10, y: 20 }, { x: 40, y: 70 }],
      radius: undefined,
      visibleInGm: true,
      visibleInPlayer: true
    });

    expect(environmentDragToMask(drag({ kind: "polygon", effect: "fire" }))).toMatchObject({
      kind: "polygon",
      effect: "fire",
      points: [{ x: 10, y: 20 }, { x: 40, y: 70 }]
    });
  });

  it("converts circle drags into center/radius preview masks", () => {
    expect(environmentDragToMask(drag({ kind: "circle", start: { x: 0, y: 0 }, current: { x: 3, y: 4 }, feather: 0.5 }))).toMatchObject({
      kind: "circle",
      feather: 0.5,
      points: [{ x: 0, y: 0 }],
      radius: 5
    });
  });

  it("requires meaningful radius or two-axis rectangle movement", () => {
    expect(isMeaningfulEnvironmentEffectDrag(drag({ kind: "circle", start: { x: 0, y: 0 }, current: { x: 8, y: 0 } }))).toBe(false);
    expect(isMeaningfulEnvironmentEffectDrag(drag({ kind: "circle", start: { x: 0, y: 0 }, current: { x: 9, y: 0 } }))).toBe(true);
    expect(isMeaningfulEnvironmentEffectDrag(drag({ start: { x: 0, y: 0 }, current: { x: 9, y: 8 } }))).toBe(false);
    expect(isMeaningfulEnvironmentEffectDrag(drag({ start: { x: 0, y: 0 }, current: { x: 9, y: 9 } }))).toBe(true);
  });

  it("does not animate effects without a scene, visible layer, or visible effects", () => {
    const scene = createDefaultScene("Effects");
    scene.environment.effects = [
      {
        id: "effect-1",
        kind: "rectangle",
        effect: "water",
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        visibleInGm: false,
        visibleInPlayer: false
      }
    ];

    expect(shouldAnimateEnvironmentEffects(null, "gm", true)).toBe(false);
    expect(shouldAnimateEnvironmentEffects(scene, "gm", false)).toBe(false);
    expect(shouldAnimateEnvironmentEffects(scene, "gm", true)).toBe(false);
    expect(shouldAnimateEnvironmentEffects(scene, "player", true)).toBe(false);
  });

  it("animates when any effect is visible for the requested view", () => {
    const scene = createDefaultScene("Effects");
    scene.environment.effects = [
      {
        id: "effect-1",
        kind: "rectangle",
        effect: "water",
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        visibleInGm: true,
        visibleInPlayer: false
      },
      {
        id: "effect-2",
        kind: "circle",
        effect: "fire",
        points: [{ x: 50, y: 50 }],
        radius: 25,
        visibleInGm: false,
        visibleInPlayer: true
      }
    ];

    expect(shouldAnimateEnvironmentEffects(scene, "gm", true)).toBe(true);
    expect(shouldAnimateEnvironmentEffects(scene, "player", true)).toBe(true);
  });

  it("treats missing per-view visibility as visible", () => {
    const scene = createDefaultScene("Effects");
    scene.environment.effects = [
      {
        id: "effect-1",
        kind: "rectangle",
        effect: "water",
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
      }
    ];

    expect(shouldAnimateEnvironmentEffects(scene, "gm", true)).toBe(true);
    expect(shouldAnimateEnvironmentEffects(scene, "player", true)).toBe(true);
  });
});
