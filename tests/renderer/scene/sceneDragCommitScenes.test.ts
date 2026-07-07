import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../../src/shared/localvtt";
import {
  getSceneAfterDrawingDragCommit,
  getSceneAfterEnvironmentEffectDragCommit,
  getSceneAfterFogDragCommit,
  getSceneAfterWeatherMaskDragCommit
} from "../../../src/renderer/components/scene/state/sceneDragCommitScenes";
import type { DrawingPreview } from "../../../src/renderer/canvas/drawings";
import type { EnvironmentEffectDrag } from "../../../src/renderer/canvas/effects";
import type { FogDrag } from "../../../src/renderer/canvas/fog";
import type { WeatherMaskDrag } from "../../../src/renderer/canvas/weather";

describe("scene drag commit scene helpers", () => {
  it("returns null for drags that are too small to commit", () => {
    const scene = createDefaultScene("Small Drags");

    expect(getSceneAfterDrawingDragCommit(scene, drawingPreview({ current: { x: 1, y: 1 } }), "drawing-1")).toBeNull();
    expect(getSceneAfterWeatherMaskDragCommit(scene, weatherMaskDrag({ current: { x: 2, y: 2 } }), "weather-1")).toBeNull();
    expect(getSceneAfterEnvironmentEffectDragCommit(scene, environmentEffectDrag({ current: { x: 2, y: 2 } }), "effect-1")).toBeNull();
    expect(getSceneAfterFogDragCommit(scene, fogDrag({ current: { x: 2, y: 2 } }), "fog-1")).toBeNull();
  });

  it("commits drawing, weather, environment, and fog drags into scene state", () => {
    const scene = createDefaultScene("Drag Commits");
    scene.fog.gmOpacity = 0;
    scene.fog.playerOpacity = 0;

    expect(getSceneAfterDrawingDragCommit(scene, drawingPreview(), "drawing-1")?.drawings).toEqual([
      expect.objectContaining({ id: "drawing-1", kind: "line", points: [{ x: 0, y: 0 }, { x: 20, y: 20 }] })
    ]);

    expect(getSceneAfterWeatherMaskDragCommit(scene, weatherMaskDrag(), "weather-1")?.weather.masks).toEqual([
      expect.objectContaining({ id: "weather-1", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 20, y: 20 }] })
    ]);

    expect(getSceneAfterEnvironmentEffectDragCommit(scene, environmentEffectDrag({ effect: "fire" }), "effect-1")?.environment.effects).toEqual([
      expect.objectContaining({ id: "effect-1", kind: "rectangle", effect: "fire", points: [{ x: 0, y: 0 }, { x: 20, y: 20 }] })
    ]);

    const fogScene = getSceneAfterFogDragCommit(scene, fogDrag({ operation: "hide" }), "fog-1");
    expect(fogScene?.fog.shapes).toEqual([
      expect.objectContaining({ id: "fog-1", kind: "rectangle", operation: "hide", points: [{ x: 0, y: 0 }, { x: 20, y: 20 }] })
    ]);
    expect(fogScene?.fog).toMatchObject({ gmOpacity: 0.5, playerOpacity: 1, opacity: 1 });
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
