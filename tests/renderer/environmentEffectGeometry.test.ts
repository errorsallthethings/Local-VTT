import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import {
  environmentDragToMask,
  getClampedEnvironmentEffectFeather,
  getEnvironmentEffectDragFromPoint,
  getEnvironmentEffectFromDrag,
  getEnvironmentEffectFromPolygonDraft,
  getEnvironmentEffectPathCommands,
  getUpdatedEnvironmentEffectDrag,
  isEnvironmentEffectVisibleForMode,
  isMeaningfulEnvironmentEffectDrag,
  shouldAnimateEnvironmentEffects,
  type EnvironmentEffectDrag
} from "../../src/renderer/canvas/effects";

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

  it("creates finished rectangle effects from drag state", () => {
    expect(getEnvironmentEffectFromDrag(drag(), "effect-1", "Water 1")).toMatchObject({
      id: "effect-1",
      name: "Water 1",
      kind: "rectangle",
      effect: "water",
      feather: 0,
      points: [{ x: 10, y: 20 }, { x: 40, y: 70 }],
      radius: undefined,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("creates finished circle effects from drag state", () => {
    expect(
      getEnvironmentEffectFromDrag(drag({ kind: "circle", start: { x: 0, y: 0 }, current: { x: 3, y: 4 }, feather: 0.25 }), "effect-2", "Water 2")
    ).toMatchObject({
      id: "effect-2",
      name: "Water 2",
      kind: "circle",
      effect: "water",
      feather: 0.25,
      points: [{ x: 0, y: 0 }],
      radius: 5,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("creates finished polygon effects from draft points", () => {
    const points = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }];

    expect(getEnvironmentEffectFromPolygonDraft({ points }, "effect-3", "Fire 1", "fire", 0.5)).toMatchObject({
      id: "effect-3",
      name: "Fire 1",
      kind: "polygon",
      effect: "fire",
      feather: 0.5,
      points,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("creates environment effect drags from a point and effect tuning", () => {
    expect(getEnvironmentEffectDragFromPoint(3, "rectangle", { x: 10, y: 20 }, "water", 0.25, { waterTuning: { opacity: 0.8 } })).toMatchObject({
      pointerId: 3,
      kind: "rectangle",
      effect: "water",
      feather: 0.25,
      waterTuning: { opacity: 0.8 },
      start: { x: 10, y: 20 },
      current: { x: 10, y: 20 }
    });
  });

  it("requires meaningful radius or two-axis rectangle movement", () => {
    expect(isMeaningfulEnvironmentEffectDrag(drag({ kind: "circle", start: { x: 0, y: 0 }, current: { x: 8, y: 0 } }))).toBe(false);
    expect(isMeaningfulEnvironmentEffectDrag(drag({ kind: "circle", start: { x: 0, y: 0 }, current: { x: 9, y: 0 } }))).toBe(true);
    expect(isMeaningfulEnvironmentEffectDrag(drag({ start: { x: 0, y: 0 }, current: { x: 9, y: 8 } }))).toBe(false);
    expect(isMeaningfulEnvironmentEffectDrag(drag({ start: { x: 0, y: 0 }, current: { x: 9, y: 9 } }))).toBe(true);
  });

  it("updates environment effect drags and constrains rectangles when requested", () => {
    expect(getUpdatedEnvironmentEffectDrag(drag({ start: { x: 10, y: 20 } }), { x: 40, y: 30 }, true).current).toEqual({ x: 40, y: 50 });
    expect(getUpdatedEnvironmentEffectDrag(drag({ kind: "circle" }), { x: 40, y: 30 }, true).current).toEqual({ x: 40, y: 30 });
  });

  it("checks environment effect visibility for each view", () => {
    const effect = environmentDragToMask(drag());

    expect(isEnvironmentEffectVisibleForMode(effect, "gm")).toBe(true);
    expect(isEnvironmentEffectVisibleForMode(effect, "player")).toBe(true);
    expect(isEnvironmentEffectVisibleForMode({ ...effect, visibleInGm: false }, "gm")).toBe(false);
    expect(isEnvironmentEffectVisibleForMode({ ...effect, visibleInPlayer: false }, "player")).toBe(false);
  });

  it("clamps environment effect feather values", () => {
    const effect = environmentDragToMask(drag());

    expect(getClampedEnvironmentEffectFeather(effect)).toBe(0);
    expect(getClampedEnvironmentEffectFeather({ ...effect, feather: -1 })).toBe(0);
    expect(getClampedEnvironmentEffectFeather({ ...effect, feather: 0.45 })).toBe(0.45);
    expect(getClampedEnvironmentEffectFeather({ ...effect, feather: 2 })).toBe(1);
  });

  it("builds screen-space path commands for rectangle effects", () => {
    expect(
      getEnvironmentEffectPathCommands(
        {
          id: "effect-1",
          kind: "rectangle",
          effect: "water",
          points: [{ x: 20, y: 30 }, { x: 5, y: 10 }]
        },
        { x: 100, y: 50, zoom: 2 }
      )
    ).toEqual([{ kind: "rect", x: 110, y: 70, width: 30, height: 40 }]);
  });

  it("builds screen-space path commands for circle effects", () => {
    expect(
      getEnvironmentEffectPathCommands(
        {
          id: "effect-1",
          kind: "circle",
          effect: "water",
          points: [{ x: 10, y: 20 }],
          radius: 15
        },
        { x: 100, y: 50, zoom: 2 }
      )
    ).toEqual([{ kind: "arc", x: 120, y: 90, radius: 30 }]);
  });

  it("builds screen-space path commands for polygon effects", () => {
    expect(
      getEnvironmentEffectPathCommands(
        {
          id: "effect-1",
          kind: "polygon",
          effect: "water",
          points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]
        },
        { x: 100, y: 50, zoom: 2 }
      )
    ).toEqual([
      {
        kind: "polygon",
        points: [{ x: 100, y: 50 }, { x: 120, y: 50 }, { x: 120, y: 70 }]
      }
    ]);
  });

  it("returns no path commands for incomplete effect geometry", () => {
    expect(getEnvironmentEffectPathCommands({ id: "effect-1", kind: "rectangle", effect: "water", points: [] }, { x: 0, y: 0, zoom: 1 })).toEqual([]);
    expect(getEnvironmentEffectPathCommands({ id: "effect-1", kind: "circle", effect: "water", points: [{ x: 0, y: 0 }] }, { x: 0, y: 0, zoom: 1 })).toEqual([]);
    expect(
      getEnvironmentEffectPathCommands(
        {
          id: "effect-1",
          kind: "polygon",
          effect: "water",
          points: [{ x: 0, y: 0 }, { x: 10, y: 0 }]
        },
        { x: 0, y: 0, zoom: 1 }
      )
    ).toEqual([]);
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
