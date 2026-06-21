import { describe, expect, it } from "vitest";
import { DEFAULT_FIRE_EFFECT_TUNING_SETTINGS, DEFAULT_WATER_EFFECT_TUNING_SETTINGS, createDefaultScene, type Scene } from "../../src/shared/localvtt";
import { removeSelectedSceneItems, setSceneEnvironmentEffectType, setSelectedSceneItemsPlayerVisibility } from "../../src/renderer/lib/sceneEditing";

function createSceneWithSelectableItems(): Scene {
  return {
    ...createDefaultScene("Scene"),
    tokens: [
      {
        id: "token-1",
        assetId: "asset-1",
        name: "Token 1",
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
        hidden: false,
        visibleInPlayer: false
      },
      {
        id: "token-2",
        assetId: "asset-2",
        name: "Token 2",
        position: { x: 1, y: 1 },
        size: { width: 1, height: 1 },
        hidden: false,
        visibleInPlayer: false
      }
    ],
    drawings: [
      {
        id: "drawing-1",
        kind: "line",
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        color: "#ffffff",
        opacity: 1,
        strokeWidth: 1,
        visibleInPlayer: false
      },
      {
        id: "drawing-2",
        kind: "line",
        points: [{ x: 2, y: 2 }, { x: 3, y: 3 }],
        color: "#ffffff",
        opacity: 1,
        strokeWidth: 1,
        visibleInPlayer: false
      }
    ],
    fog: {
      ...createDefaultScene("Scene").fog,
      shapes: [
        {
          id: "fog-1",
          operation: "hide",
          kind: "rectangle",
          points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
          visibleInGm: true,
          visibleInPlayer: false,
          visible: false
        },
        {
          id: "fog-2",
          operation: "hide",
          kind: "rectangle",
          points: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
          visibleInGm: true,
          visibleInPlayer: false,
          visible: false
        }
      ]
    },
    weather: {
      ...createDefaultScene("Scene").weather,
      masks: [
        { id: "weather-1", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], visible: true, visibleInPlayer: false },
        { id: "weather-2", kind: "rectangle", points: [{ x: 1, y: 1 }, { x: 2, y: 2 }], visible: true, visibleInPlayer: false }
      ]
    },
    environment: {
      effects: [
        { id: "effect-1", kind: "rectangle", effect: "water", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], visibleInPlayer: false },
        { id: "effect-2", kind: "rectangle", effect: "fire", points: [{ x: 1, y: 1 }, { x: 2, y: 2 }], visibleInPlayer: false }
      ]
    }
  };
}

describe("scene editing selected item actions", () => {
  it("sets selected scene items visible in player view", () => {
    const scene = setSelectedSceneItemsPlayerVisibility(
      createSceneWithSelectableItems(),
      {
        tokenIds: ["token-1"],
        drawingIds: ["drawing-1"],
        fogShapeIds: ["fog-1"],
        weatherMaskIds: ["weather-1"],
        environmentEffectId: "effect-1"
      },
      true,
      "now"
    );

    expect(scene.tokens.map((token) => token.visibleInPlayer)).toEqual([true, false]);
    expect(scene.drawings.map((drawing) => drawing.visibleInPlayer)).toEqual([true, false]);
    expect(scene.fog.shapes.map((shape) => shape.visibleInPlayer)).toEqual([true, false]);
    expect(scene.fog.shapes.map((shape) => shape.visible)).toEqual([true, false]);
    expect(scene.weather.masks.map((mask) => mask.visibleInPlayer)).toEqual([true, false]);
    expect(scene.environment.effects.map((effect) => effect.visibleInPlayer)).toEqual([true, false]);
  });

  it("removes selected scene items", () => {
    const scene = removeSelectedSceneItems(
      createSceneWithSelectableItems(),
      {
        tokenIds: ["token-1"],
        drawingIds: ["drawing-1"],
        fogShapeIds: ["fog-1"],
        weatherMaskIds: ["weather-1"],
        environmentEffectId: "effect-1"
      },
      "now"
    );

    expect(scene.tokens.map((token) => token.id)).toEqual(["token-2"]);
    expect(scene.drawings.map((drawing) => drawing.id)).toEqual(["drawing-2"]);
    expect(scene.fog.shapes.map((shape) => shape.id)).toEqual(["fog-2"]);
    expect(scene.weather.masks.map((mask) => mask.id)).toEqual(["weather-2"]);
    expect(scene.environment.effects.map((effect) => effect.id)).toEqual(["effect-2"]);
  });

  it("switches environment effect type while preserving matching tuning", () => {
    const source = {
      ...createDefaultScene("Scene"),
      environment: {
        effects: [
          {
            id: "effect-1",
            kind: "rectangle" as const,
            effect: "water" as const,
            points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            waterTuning: { ...DEFAULT_WATER_EFFECT_TUNING_SETTINGS, speed: 0.42 },
            fireTuning: { ...DEFAULT_FIRE_EFFECT_TUNING_SETTINGS, speed: 0.84 }
          }
        ]
      }
    };

    const scene = setSceneEnvironmentEffectType(source, "effect-1", "fire", "now");

    expect(scene.environment.effects[0]).toMatchObject({
      effect: "fire",
      fireTuning: { speed: 0.84 },
      waterTuning: undefined
    });
  });

  it("adds default tuning when switching to a new environment effect type", () => {
    const source = {
      ...createDefaultScene("Scene"),
      environment: {
        effects: [
          {
            id: "effect-1",
            kind: "rectangle" as const,
            effect: "water" as const,
            points: [{ x: 0, y: 0 }, { x: 1, y: 1 }]
          }
        ]
      }
    };

    const scene = setSceneEnvironmentEffectType(source, "effect-1", "fire", "now");

    expect(scene.environment.effects[0].fireTuning).toEqual(DEFAULT_FIRE_EFFECT_TUNING_SETTINGS);
  });
});
