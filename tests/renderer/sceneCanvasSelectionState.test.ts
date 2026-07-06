import { describe, expect, it } from "vitest";
import { getSceneCanvasSelectionState } from "../../src/renderer/components/scene/useSceneCanvasSelectionState";

describe("scene canvas selection state", () => {
  it("prefers multi-selection ids over single selected ids", () => {
    expect(getSceneCanvasSelectionState({
      mode: "gm",
      selectedDrawingId: "drawing-single",
      selectedDrawingIds: ["drawing-a", "drawing-b"],
      selectedFogShapeId: "fog-single",
      selectedFogShapeIds: ["fog-a"],
      selectedTokenId: "token-single",
      selectedTokenIds: ["token-a"],
      selectedWeatherMaskId: "weather-single",
      selectedWeatherMaskIds: ["weather-a"]
    })).toMatchObject({
      effectiveSelectedDrawingIds: ["drawing-a", "drawing-b"],
      effectiveSelectedFogShapeIds: ["fog-a"],
      effectiveSelectedTokenIds: ["token-a"],
      effectiveSelectedWeatherMaskIds: ["weather-a"]
    });
  });

  it("falls back to single selected ids and only animates GM selections", () => {
    const gmState = getSceneCanvasSelectionState({
      mode: "gm",
      selectedTokenId: "token-single"
    });
    const playerState = getSceneCanvasSelectionState({
      mode: "player",
      selectedTokenId: "token-single"
    });

    expect(gmState.effectiveSelectedTokenIds).toEqual(["token-single"]);
    expect(gmState.sceneSelectionAnimating).toBe(true);
    expect(playerState.effectiveSelectedTokenIds).toEqual(["token-single"]);
    expect(playerState.sceneSelectionAnimating).toBe(false);
  });

  it("does not animate when there is no effective selection", () => {
    expect(getSceneCanvasSelectionState({ mode: "gm" })).toEqual({
      effectiveSelectedDrawingIds: [],
      effectiveSelectedFogShapeIds: [],
      effectiveSelectedTokenIds: [],
      effectiveSelectedWeatherMaskIds: [],
      sceneSelectionAnimating: false
    });
  });
});
