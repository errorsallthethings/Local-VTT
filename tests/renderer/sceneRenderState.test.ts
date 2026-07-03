import { describe, expect, it } from "vitest";
import type { EnvironmentEffectMask, Point, WeatherMask } from "../../src/shared/localvtt";
import { createDefaultScene } from "../../src/shared/localvtt";
import { getSceneEffectRenderState } from "../../src/renderer/canvas/scene";

function effect(id: string, visibleInGm = true, visibleInPlayer = true): EnvironmentEffectMask {
  return {
    id,
    kind: "rectangle",
    effect: "fire",
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    visibleInGm,
    visibleInPlayer
  };
}

function mask(id: string, visible = true): WeatherMask {
  return {
    id,
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    visible
  };
}

describe("getSceneEffectRenderState", () => {
  it("returns stable empty state without a scene", () => {
    const first = getSceneEffectRenderState({
      scene: null,
      mode: "gm",
      environmentEffectPoints: null,
      weatherMaskPoints: null
    });
    const second = getSceneEffectRenderState({
      scene: undefined,
      mode: "player",
      environmentEffectPoints: null,
      weatherMaskPoints: null
    });

    expect(first).toBe(second);
    expect(first.environmentEffects).toEqual([]);
    expect(first.weatherMasks).toEqual([]);
  });

  it("applies move preview point overrides once for the render pass", () => {
    const scene = createDefaultScene("Effects");
    scene.environment.effects = [effect("fire-1")];
    scene.weather.masks = [mask("rain-hole")];
    const environmentEffectPoints = new Map<string, Point[]>([["fire-1", [{ x: 20, y: 20 }, { x: 40, y: 40 }]]]);
    const weatherMaskPoints = new Map<string, Point[]>([["rain-hole", [{ x: 4, y: 4 }, { x: 8, y: 8 }]]]);

    const state = getSceneEffectRenderState({
      scene,
      mode: "gm",
      environmentEffectPoints,
      weatherMaskPoints
    });

    expect(state.environmentEffects[0].points).toEqual([{ x: 20, y: 20 }, { x: 40, y: 40 }]);
    expect(state.weatherMasks[0].points).toEqual([{ x: 4, y: 4 }, { x: 8, y: 8 }]);
    expect(scene.environment.effects[0].points).toEqual([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
    expect(scene.weather.masks[0].points).toEqual([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
  });

  it("resolves selected items using the current render mode visibility", () => {
    const scene = createDefaultScene("Selection");
    scene.environment.effects = [effect("gm-only", true, false), effect("player-only", false, true)];
    scene.weather.masks = [mask("visible"), mask("hidden", false)];

    const gmState = getSceneEffectRenderState({
      scene,
      mode: "gm",
      environmentEffectPoints: null,
      weatherMaskPoints: null,
      selectedEnvironmentEffectId: "gm-only",
      selectedWeatherMaskIds: ["visible", "hidden"]
    });
    const playerState = getSceneEffectRenderState({
      scene,
      mode: "player",
      environmentEffectPoints: null,
      weatherMaskPoints: null,
      selectedEnvironmentEffectId: "gm-only",
      selectedWeatherMaskIds: ["visible"]
    });

    expect(gmState.selectedEnvironmentEffect?.id).toBe("gm-only");
    expect(gmState.selectedWeatherMasks.map((selectedMask) => selectedMask.id)).toEqual(["visible"]);
    expect(playerState.selectedEnvironmentEffect).toBeNull();
    expect(playerState.selectedWeatherMasks).toEqual([]);
  });
});
