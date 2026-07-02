import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import {
  getDrawingDragCommit,
  getEnvironmentEffectDragCommit,
  getFogDragCommit,
  getWeatherMaskDragCommit
} from "../../src/renderer/canvas/scene";
import type { DrawingPreview } from "../../src/renderer/canvas/drawings";
import type { EnvironmentEffectDrag } from "../../src/renderer/canvas/effects";
import type { FogDrag } from "../../src/renderer/canvas/fog";
import type { WeatherMaskDrag } from "../../src/renderer/canvas/weather";

describe("scene drag commits", () => {
  it("returns null for drags that are too small to commit", () => {
    const scene = createDefaultScene("Drags");

    expect(getDrawingDragCommit(scene, drawingPreview({ current: { x: 1, y: 1 } }), "drawing-1")).toBeNull();
    expect(getWeatherMaskDragCommit(scene, weatherMaskDrag({ current: { x: 2, y: 2 } }), "weather-1")).toBeNull();
    expect(getEnvironmentEffectDragCommit(scene, environmentEffectDrag({ current: { x: 2, y: 2 } }), "effect-1")).toBeNull();
    expect(getFogDragCommit(scene, fogDrag({ current: { x: 2, y: 2 } }), "fog-1")).toBeNull();
  });

  it("builds drawing commits with scene-based default names", () => {
    const scene = createDefaultScene("Drags");
    scene.drawings = [
      {
        id: "existing-drawing",
        kind: "line",
        points: [],
        color: "#ffffff",
        opacity: 1,
        strokeWidth: 2,
        visibleInPlayer: true
      }
    ];

    expect(getDrawingDragCommit(scene, drawingPreview(), "drawing-2")).toMatchObject({
      id: "drawing-2",
      name: "Line 2",
      kind: "line",
      color: "#112233",
      opacity: 0.75,
      strokeWidth: 5,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("builds weather and environment commits with scene-based default names", () => {
    const scene = createDefaultScene("Drags");
    scene.weather.masks = [{ id: "existing-weather", kind: "rectangle", points: [] }];
    scene.environment.effects = [{ id: "existing-effect", kind: "rectangle", effect: "water", points: [] }];

    expect(getWeatherMaskDragCommit(scene, weatherMaskDrag({ kind: "circle", start: { x: 0, y: 0 }, current: { x: 3, y: 4 } }), "weather-2")).toEqual({
      id: "weather-2",
      name: "Weather Effect Mask 2",
      kind: "circle",
      points: [{ x: 0, y: 0 }],
      radius: 5,
      visible: true
    });

    expect(getEnvironmentEffectDragCommit(scene, environmentEffectDrag({ effect: "fire" }), "effect-2")).toMatchObject({
      id: "effect-2",
      name: "Fire Effect 2",
      kind: "rectangle",
      effect: "fire",
      points: [{ x: 0, y: 0 }, { x: 20, y: 20 }],
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("builds fog commits with visibility defaults and opacity patches", () => {
    const scene = createDefaultScene("Drags");
    scene.fog.newShapesVisibleInPlayer = false;
    scene.fog.gmOpacity = 0;
    scene.fog.playerOpacity = 0;

    expect(getFogDragCommit(scene, fogDrag({ operation: "hide" }), "fog-1")).toEqual({
      shape: {
        id: "fog-1",
        name: "Hide Rectangle 1",
        operation: "hide",
        kind: "rectangle",
        points: [{ x: 0, y: 0 }, { x: 20, y: 20 }],
        radius: undefined,
        visibleInGm: true,
        visibleInPlayer: false,
        visible: true
      },
      fogPatch: {
        gmOpacity: 0.5,
        playerOpacity: 1,
        opacity: 1
      }
    });
  });
});

function drawingPreview(overrides: Partial<DrawingPreview> = {}): DrawingPreview {
  return {
    pointerId: 1,
    kind: "line",
    points: [{ x: 0, y: 0 }],
    current: { x: 20, y: 20 },
    color: "#112233",
    opacity: 0.75,
    strokeWidth: 5,
    ...overrides
  };
}

function weatherMaskDrag(overrides: Partial<WeatherMaskDrag> = {}): WeatherMaskDrag {
  return {
    pointerId: 1,
    kind: "rectangle",
    start: { x: 0, y: 0 },
    current: { x: 20, y: 20 },
    ...overrides
  };
}

function environmentEffectDrag(overrides: Partial<EnvironmentEffectDrag> = {}): EnvironmentEffectDrag {
  return {
    pointerId: 1,
    kind: "rectangle",
    effect: "water",
    feather: 0,
    start: { x: 0, y: 0 },
    current: { x: 20, y: 20 },
    ...overrides
  };
}

function fogDrag(overrides: Partial<FogDrag> = {}): FogDrag {
  return {
    pointerId: 1,
    kind: "rectangle",
    operation: "reveal",
    start: { x: 0, y: 0 },
    current: { x: 20, y: 20 },
    points: [{ x: 0, y: 0 }],
    ...overrides
  };
}
