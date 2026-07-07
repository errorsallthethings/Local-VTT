import { describe, expect, it } from "vitest";
import { createDefaultScene, type DrawingElement, type EnvironmentEffectMask, type FogShape, type Token, type WeatherMask } from "../../../src/shared/localvtt";
import { getSceneContextMenuTarget } from "../../../src/renderer/components/scene/context-menu/sceneContextMenuTarget";

const camera = { x: 0, y: 0, zoom: 1 };
const point = { x: 50, y: 50 };

function token(overrides: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    assetId: "asset-1",
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
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
    color: "#fff",
    opacity: 1,
    strokeWidth: 4,
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

function baseOptions(scene = createDefaultScene("Context Target")) {
  return {
    authoringToolActive: false,
    camera,
    canOpenTokenMenu: true,
    canShowDrawings: true,
    canShowTokens: true,
    point,
    scene
  };
}

describe("scene context menu target resolution", () => {
  it("returns token targets first when the token menu can be opened", () => {
    const scene = createDefaultScene("Token Target");
    scene.tokens = [token()];
    scene.drawings = [drawing()];

    const target = getSceneContextMenuTarget(baseOptions(scene));

    expect(target?.kind).toBe("token");
    expect(target?.kind === "token" ? target.token.id : null).toBe("token-1");
  });

  it("skips token targets when token menus are unavailable", () => {
    const scene = createDefaultScene("No Token Menu");
    scene.tokens = [token()];
    scene.drawings = [drawing()];

    const target = getSceneContextMenuTarget({ ...baseOptions(scene), canOpenTokenMenu: false });

    expect(target?.kind).toBe("drawing");
  });

  it("returns drawing targets with their scene index", () => {
    const scene = createDefaultScene("Drawing Target");
    scene.drawings = [
      drawing({ id: "drawing-1", points: [{ x: 200, y: 200 }, { x: 300, y: 300 }] }),
      drawing({ id: "drawing-2" })
    ];

    const target = getSceneContextMenuTarget(baseOptions(scene));

    expect(target).toMatchObject({
      kind: "drawing",
      drawing: { id: "drawing-2" },
      drawingIndex: 1
    });
  });

  it("returns weather mask and fog targets after drawings", () => {
    const scene = createDefaultScene("Mask Target");
    scene.weather.masks = [weatherMask()];
    scene.fog.shapes = [fogShape()];

    expect(getSceneContextMenuTarget(baseOptions(scene))).toMatchObject({
      kind: "weather-mask",
      mask: { id: "weather-1" }
    });

    scene.weather.masks = [];
    expect(getSceneContextMenuTarget(baseOptions(scene))).toMatchObject({
      kind: "fog",
      shape: { id: "fog-1" },
      shapeIndex: 0
    });
  });

  it("returns environment effects after masks", () => {
    const scene = createDefaultScene("Environment Target");
    scene.environment.effects = [environmentEffect()];

    expect(getSceneContextMenuTarget(baseOptions(scene))).toMatchObject({
      kind: "environment-effect",
      effect: { id: "effect-1" },
      effectIndex: 0
    });
  });

  it("ignores non-token targets while authoring tools are active", () => {
    const scene = createDefaultScene("Authoring Target");
    scene.drawings = [drawing()];
    scene.weather.masks = [weatherMask()];
    scene.environment.effects = [environmentEffect()];

    expect(getSceneContextMenuTarget({ ...baseOptions(scene), authoringToolActive: true })).toBeNull();
  });

  it("returns null when no visible target is hit", () => {
    const scene = createDefaultScene("Empty Target");

    expect(getSceneContextMenuTarget({ ...baseOptions(scene), point: { x: 500, y: 500 } })).toBeNull();
  });
});
