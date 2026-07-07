import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../../src/shared/localvtt";
import {
  getSceneAfterDrawingTransformPointerComplete,
  getSceneAfterMaskEffectPointerComplete,
  getSceneAfterTokenPointerComplete
} from "../../../src/renderer/components/scene/input/scenePointerCompleteScenes";
import type { DrawingTransformPointerCompleteAction } from "../../../src/renderer/components/scene/input/sceneDrawingTransformPointer";
import type { MaskEffectPointerCompleteAction } from "../../../src/renderer/components/scene/input/sceneMaskEffectPointer";

describe("scene pointer complete scene helpers", () => {
  it("returns null when completed pointer actions have no scene mutation", () => {
    const scene = createSceneWithPointerTargets();

    expect(getSceneAfterDrawingTransformPointerComplete(scene, { kind: "none" })).toBeNull();
    expect(getSceneAfterDrawingTransformPointerComplete(scene, { kind: "commit-move", preview: null, clearSnapPoint: true })).toBeNull();
    expect(getSceneAfterMaskEffectPointerComplete(scene, { kind: "none" })).toBeNull();
    expect(getSceneAfterMaskEffectPointerComplete(scene, { kind: "commit-weather", preview: null })).toBeNull();
    expect(getSceneAfterMaskEffectPointerComplete(scene, { kind: "commit-environment-effect", preview: null })).toBeNull();
  });

  it("commits drawing transform previews into scene drawings", () => {
    const scene = createSceneWithPointerTargets();
    const action: DrawingTransformPointerCompleteAction = {
      kind: "commit-resize",
      preview: new Map([["drawing-1", [{ x: 10, y: 20 }, { x: 110, y: 120 }]]]),
      clearSnapPoint: false
    };

    const nextScene = getSceneAfterDrawingTransformPointerComplete(scene, action);

    expect(nextScene?.drawings[0].points).toEqual([{ x: 10, y: 20 }, { x: 110, y: 120 }]);
    expect(nextScene?.weather.masks[0].points).toEqual(scene.weather.masks[0].points);
    expect(nextScene?.environment.effects[0].points).toEqual(scene.environment.effects[0].points);
  });

  it("commits weather mask and environment effect move previews into scene masks", () => {
    const scene = createSceneWithPointerTargets();
    const weatherAction: MaskEffectPointerCompleteAction = {
      kind: "commit-weather",
      preview: new Map([["weather-1", [{ x: 20, y: 30 }, { x: 120, y: 130 }]]])
    };
    const effectAction: MaskEffectPointerCompleteAction = {
      kind: "commit-environment-effect",
      preview: new Map([["effect-1", [{ x: 30, y: 40 }, { x: 130, y: 140 }]]])
    };

    const weatherScene = getSceneAfterMaskEffectPointerComplete(scene, weatherAction);
    const effectScene = getSceneAfterMaskEffectPointerComplete(scene, effectAction);

    expect(weatherScene?.weather.masks[0].points).toEqual([{ x: 20, y: 30 }, { x: 120, y: 130 }]);
    expect(weatherScene?.environment.effects[0].points).toEqual(scene.environment.effects[0].points);
    expect(effectScene?.environment.effects[0].points).toEqual([{ x: 30, y: 40 }, { x: 130, y: 140 }]);
    expect(effectScene?.weather.masks[0].points).toEqual(scene.weather.masks[0].points);
  });

  it("commits token drag completion and returns the Player View sync scene", () => {
    const scene = createSceneWithPointerTargets();

    const result = getSceneAfterTokenPointerComplete(
      scene,
      {
        pointerId: 1,
        tokenId: "token-1",
        offset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 },
        waypoints: [{ x: 50, y: 0 }],
        groupStartPositions: new Map([["token-1", { x: 0, y: 0 }]])
      },
      {
        tokenId: "token-1",
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 100, y: 100 },
        snappedPosition: { x: 100, y: 100 },
        waypoints: [{ x: 50, y: 0 }],
        tokenPositions: new Map([["token-1", { x: 100, y: 100 }]])
      }
    );

    expect(result?.scene.tokens[0].position).toEqual({ x: 100, y: 100 });
    expect(result?.syncScene.tokenMovementPath).toEqual({
      tokenId: "token-1",
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 100 }
      ]
    });
  });

  it("returns null when token drag completion references a missing token", () => {
    const scene = createSceneWithPointerTargets();

    expect(
      getSceneAfterTokenPointerComplete(
        scene,
        {
          pointerId: 1,
          tokenId: "missing-token",
          offset: { x: 0, y: 0 },
          startPosition: { x: 0, y: 0 },
          waypoints: [],
          groupStartPositions: new Map()
        },
        null
      )
    ).toBeNull();
  });
});

function createSceneWithPointerTargets() {
  const scene = createDefaultScene("Pointer Complete");
  scene.drawings = [
    {
      id: "drawing-1",
      kind: "line",
      points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      color: "#ffffff",
      opacity: 1,
      strokeWidth: 4,
      visibleInPlayer: true
    }
  ];
  scene.weather.masks = [
    {
      id: "weather-1",
      kind: "rectangle",
      points: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
    }
  ];
  scene.environment.effects = [
    {
      id: "effect-1",
      kind: "rectangle",
      effect: "fire",
      points: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
    }
  ];
  scene.tokens = [
    {
      id: "token-1",
      name: "Token",
      assetId: "asset-1",
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
      hidden: false,
      visibleInGm: true,
      visibleInPlayer: true
    }
  ];
  return scene;
}
