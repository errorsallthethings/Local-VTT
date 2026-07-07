import { describe, expect, it } from "vitest";
import { createDefaultScene, type Token } from "../../../src/shared/localvtt";
import {
  getDrawingTransformHoverUpdate,
  getSceneItemHoverUpdate,
  getSceneSnapPointUpdate
} from "../../../src/renderer/components/scene/input/sceneHoverUpdates";

function token(overrides: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    assetId: "asset-1",
    position: { x: 100, y: 100 },
    size: { width: 50, height: 50 },
    hidden: false,
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

describe("scene hover update helpers", () => {
  it("returns null drawing transform hover when drawings are unavailable", () => {
    const scene = createDefaultScene("Drawing Hover");

    expect(
      getDrawingTransformHoverUpdate({
        camera: { x: 0, y: 0, zoom: 1 },
        canShowDrawings: false,
        hasActiveInteraction: false,
        mode: "gm",
        point: { x: 0, y: 0 },
        scene,
        selectedDrawingIds: []
      })
    ).toBeNull();
  });

  it("detects scene item hover only when layers can be shown", () => {
    const scene = createDefaultScene("Item Hover");
    scene.tokens = [token()];

    expect(
      getSceneItemHoverUpdate({
        camera: { x: 0, y: 0, zoom: 1 },
        canShowDrawings: false,
        canShowFog: false,
        canShowTokens: true,
        canShowWeather: false,
        hasActiveInteraction: false,
        mode: "gm",
        point: { x: 125, y: 125 },
        scene
      })
    ).toBe(true);
    expect(
      getSceneItemHoverUpdate({
        camera: { x: 0, y: 0, zoom: 1 },
        canShowDrawings: false,
        canShowFog: false,
        canShowTokens: false,
        canShowWeather: false,
        hasActiveInteraction: false,
        mode: "gm",
        point: { x: 125, y: 125 },
        scene
      })
    ).toBe(false);
  });

  it("returns snapped points only when snap preview should be shown", () => {
    const scene = createDefaultScene("Snap Hover");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;

    expect(
      getSceneSnapPointUpdate({
        canSnapDrawing: false,
        canSnapEnvironment: false,
        canSnapFog: false,
        canSnapWeather: false,
        point: { x: 130, y: 130 },
        scene,
        snapModifierActive: false
      })
    ).toBeNull();
    expect(
      getSceneSnapPointUpdate({
        canSnapDrawing: true,
        canSnapEnvironment: false,
        canSnapFog: false,
        canSnapWeather: false,
        point: { x: 130, y: 130 },
        scene,
        snapModifierActive: true
      })
    ).toEqual({ x: 150, y: 150 });
  });
});
