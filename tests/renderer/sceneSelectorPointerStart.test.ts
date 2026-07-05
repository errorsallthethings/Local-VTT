import { describe, expect, it } from "vitest";
import { createDefaultScene, type DrawingElement, type EnvironmentEffectMask, type FogShape, type Scene, type Token, type WeatherMask } from "../../src/shared/localvtt";
import { getSceneSelectorPointerStart } from "../../src/renderer/components/scene/sceneSelectorPointerStart";

describe("scene selector pointer start", () => {
  it("prioritizes token hits over drawings and masks", () => {
    const scene = sceneWithSelectableItems();

    const start = getSceneSelectorPointerStart(options(scene, { point: { x: 25, y: 25 } }));

    expect(start.kind).toBe("token");
    if (start.kind === "token") {
      expect(start.start.token.id).toBe("token-1");
    }
  });

  it("returns drawing transforms before regular scene item hits", () => {
    const scene = sceneWithSelectableItems();
    scene.tokens = [];

    const start = getSceneSelectorPointerStart(
      options(scene, {
        point: { x: 100, y: 100 },
        selectedDrawingIds: ["drawing-1"]
      })
    );

    expect(start.kind).toBe("drawing-transform");
    if (start.kind === "drawing-transform") {
      expect(start.start.transformKind).toBe("resize");
    }
  });

  it("returns drawing hits before environment effects and masks", () => {
    const scene = sceneWithSelectableItems();
    scene.tokens = [];

    const start = getSceneSelectorPointerStart(options(scene, { point: { x: 50, y: 50 } }));

    expect(start.kind).toBe("drawing-hit");
    if (start.kind === "drawing-hit") {
      expect(start.start.drawingId).toBe("drawing-1");
    }
  });

  it("returns environment effects before weather masks and fog shapes", () => {
    const scene = sceneWithSelectableItems();
    scene.tokens = [];
    scene.drawings = [];

    const start = getSceneSelectorPointerStart(options(scene, { point: { x: 50, y: 50 } }));

    expect(start.kind).toBe("environment-effect");
    if (start.kind === "environment-effect") {
      expect(start.start.effectId).toBe("effect-1");
    }
  });

  it("returns weather masks before fog shapes", () => {
    const scene = sceneWithSelectableItems();
    scene.tokens = [];
    scene.drawings = [];
    scene.environment.effects = [];

    const start = getSceneSelectorPointerStart(options(scene, { point: { x: 50, y: 50 } }));

    expect(start.kind).toBe("weather-mask");
    if (start.kind === "weather-mask") {
      expect(start.start.maskId).toBe("weather-1");
    }
  });

  it("returns fog shapes and empty-space outcomes", () => {
    const scene = sceneWithSelectableItems();
    scene.tokens = [];
    scene.drawings = [];
    scene.environment.effects = [];
    scene.weather.masks = [];

    expect(getSceneSelectorPointerStart(options(scene, { point: { x: 50, y: 50 } }))).toEqual({
      kind: "fog-shape",
      start: {
        kind: "fog",
        shapeId: "fog-1"
      }
    });
    expect(getSceneSelectorPointerStart(options(scene, { point: { x: 500, y: 500 } }))).toEqual({
      kind: "empty",
      clearSceneSelections: true
    });
    expect(getSceneSelectorPointerStart(options(scene, { authoringToolActive: true, point: { x: 500, y: 500 } }))).toEqual({
      kind: "empty",
      clearSceneSelections: false
    });
  });
});

function options(scene: Scene, overrides: Partial<Parameters<typeof getSceneSelectorPointerStart>[0]> = {}): Parameters<typeof getSceneSelectorPointerStart>[0] {
  return {
    authoringToolActive: false,
    camera: { x: 0, y: 0, zoom: 1 },
    canShowDrawings: true,
    canShowTokens: true,
    mouseBehavior: "grabber",
    point: { x: 50, y: 50 },
    pointerId: 1,
    scene,
    selectedDrawingIds: [],
    selectedTokenIds: [],
    selectedWeatherMaskIds: [],
    ...overrides
  };
}

function sceneWithSelectableItems(): Scene {
  const scene = createDefaultScene("Selector");
  scene.tokens = [token()];
  scene.drawings = [drawing()];
  scene.environment.effects = [environmentEffect()];
  scene.weather.masks = [weatherMask()];
  scene.fog.shapes = [fogShape()];
  return scene;
}

function token(overrides: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    assetId: "asset-1",
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    hidden: false,
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

function drawing(overrides: Partial<DrawingElement> = {}): DrawingElement {
  return {
    id: "drawing-1",
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    color: "#ffffff",
    opacity: 1,
    strokeWidth: 4,
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

function environmentEffect(overrides: Partial<EnvironmentEffectMask> = {}): EnvironmentEffectMask {
  return {
    id: "effect-1",
    kind: "rectangle",
    effect: "water",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

function weatherMask(overrides: Partial<WeatherMask> = {}): WeatherMask {
  return {
    id: "weather-1",
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    ...overrides
  };
}

function fogShape(overrides: Partial<FogShape> = {}): FogShape {
  return {
    id: "fog-1",
    operation: "hide",
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}
