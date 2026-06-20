import { describe, expect, it } from "vitest";
import { environmentDragToMask, isMeaningfulEnvironmentEffectDrag, type EnvironmentEffectDrag } from "../../src/renderer/canvas/environmentEffectGeometry";

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
});
