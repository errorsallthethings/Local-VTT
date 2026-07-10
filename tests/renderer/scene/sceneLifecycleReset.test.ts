import { describe, expect, it } from "vitest";
import {
  getCanvasToolResetActions,
  getDrawingToolResetActions,
  getEnvironmentToolResetActions,
  getModeOrSceneResetActions,
  getSceneOrFogToolResetActions,
  getWeatherToolResetActions
} from "../../../src/renderer/components/scene/state/sceneLifecycleReset";

describe("scene lifecycle reset policy", () => {
  it("resets scene and fog-tool state broadly", () => {
    expect(getSceneOrFogToolResetActions()).toEqual([
      "clear-fog-polygon-draft",
      "clear-drawing-polygon-draft",
      "clear-weather-polygon-draft",
      "clear-environment-polygon-draft",
      "clear-fog-preview",
      "clear-drawing-preview",
      "clear-brush-hover",
      "clear-snap-point",
      "clear-scene-item-hover"
    ]);
  });

  it("resets focused tool families", () => {
    expect(getDrawingToolResetActions()).toEqual(["clear-drawing-preview", "clear-brush-hover", "clear-snap-point"]);
    expect(getWeatherToolResetActions()).toEqual(["clear-weather-preview", "clear-weather-polygon-draft"]);
    expect(getEnvironmentToolResetActions()).toEqual(["clear-environment-preview", "clear-environment-polygon-draft"]);
  });

  it("emits ruler clear only when a ruler drag was active", () => {
    expect(getCanvasToolResetActions(false)).toEqual(["clear-ruler-drag", "clear-released-ruler", "clear-arrow-drag", "clear-laser-drag"]);
    expect(getCanvasToolResetActions(true)).toEqual(["emit-ruler-clear", "clear-ruler-drag", "clear-released-ruler", "clear-arrow-drag", "clear-laser-drag"]);
  });

  it("resets mode and scene interaction state", () => {
    expect(getModeOrSceneResetActions()).toEqual([
      "clear-token-drag",
      "clear-pan-drag",
      "clear-weather-preview",
      "clear-environment-preview",
      "cancel-weather-move",
      "cancel-environment-move",
      "clear-selection-drag",
      "clear-snap-point",
      "clear-brush-hover"
    ]);
  });
});
