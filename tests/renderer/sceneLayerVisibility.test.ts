import { describe, expect, it } from "vitest";
import type { Layer } from "../../src/shared/localvtt";
import { getSceneLayerVisibility } from "../../src/renderer/canvas/scene";

function layer(id: string, visibleInGm: boolean, visibleInPlayer: boolean): Layer {
  return {
    id,
    name: id,
    kind: id === "effects" || id === "weather" ? "effects" : "custom",
    order: 0,
    visibleInGm,
    visibleInPlayer,
    locked: false,
    opacity: 1
  };
}

describe("getSceneLayerVisibility", () => {
  it("uses GM visibility flags in GM mode", () => {
    const visibility = getSceneLayerVisibility(
      [
        layer("map", true, false),
        layer("grid", false, true),
        layer("fog", true, false),
        layer("drawing", false, true),
        layer("effects", true, false),
        layer("token", false, true)
      ],
      "gm"
    );

    expect(visibility.canShowMap).toBe(true);
    expect(visibility.canShowGrid).toBe(false);
    expect(visibility.canShowFog).toBe(true);
    expect(visibility.canShowDrawings).toBe(false);
    expect(visibility.canShowWeather).toBe(true);
    expect(visibility.canShowTokens).toBe(false);
  });

  it("uses Player visibility flags in Player mode", () => {
    const visibility = getSceneLayerVisibility(
      [
        layer("map", true, false),
        layer("grid", false, true),
        layer("fog", true, false),
        layer("drawing", false, true),
        layer("effects", true, false),
        layer("token", false, true)
      ],
      "player"
    );

    expect(visibility.canShowMap).toBe(false);
    expect(visibility.canShowGrid).toBe(true);
    expect(visibility.canShowFog).toBe(false);
    expect(visibility.canShowDrawings).toBe(true);
    expect(visibility.canShowWeather).toBe(false);
    expect(visibility.canShowTokens).toBe(true);
  });

  it("prefers effects over the legacy weather layer id", () => {
    const effects = layer("effects", false, true);
    const weather = layer("weather", true, false);

    const visibility = getSceneLayerVisibility([weather, effects], "gm");

    expect(visibility.effectsLayer).toBe(effects);
    expect(visibility.canShowWeather).toBe(false);
  });

  it("falls back to the legacy weather layer id", () => {
    const weather = layer("weather", true, false);

    const visibility = getSceneLayerVisibility([weather], "gm");

    expect(visibility.effectsLayer).toBe(weather);
    expect(visibility.canShowWeather).toBe(true);
  });
});
