import { describe, expect, it } from "vitest";
import type { DrawingElement, EnvironmentEffectMask, FogShape, Token, WeatherMask } from "../../../src/shared/localvtt";
import { getSceneContextMenuOpening } from "../../../src/renderer/components/scene/context-menu/sceneContextMenuOpening";

const position = { x: 12, y: 24 };

function token(overrides: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Goblin",
    position: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    hidden: false,
    visibleInGm: true,
    visibleInPlayer: false,
    ...overrides
  };
}

function drawing(overrides: Partial<DrawingElement> = {}): DrawingElement {
  return {
    id: "drawing-1",
    kind: "rectangle",
    points: [],
    color: "#ffffff",
    opacity: 1,
    strokeWidth: 2,
    visibleInPlayer: true,
    ...overrides
  };
}

function weatherMask(overrides: Partial<WeatherMask> = {}): WeatherMask {
  return {
    id: "weather-1",
    kind: "rectangle",
    points: [],
    visible: true,
    visibleInPlayer: false,
    ...overrides
  };
}

function fogShape(overrides: Partial<FogShape> = {}): FogShape {
  return {
    id: "fog-1",
    operation: "hide",
    kind: "rectangle",
    points: [],
    visibleInGm: true,
    visibleInPlayer: false,
    ...overrides
  };
}

function environmentEffect(overrides: Partial<EnvironmentEffectMask> = {}): EnvironmentEffectMask {
  return {
    id: "effect-1",
    kind: "rectangle",
    effect: "fire",
    points: [],
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

describe("scene context menu opening", () => {
  it("opens token menus and clears other non-environment selections", () => {
    const opening = getSceneContextMenuOpening({ kind: "token", token: token() }, position);

    expect(opening.selection).toEqual({
      tokenId: "token-1",
      fogShapeId: null,
      weatherMaskId: null,
      drawingId: null
    });
    expect(opening.tokenContextMenu).toMatchObject({ tokenId: "token-1", x: 12, y: 24 });
    expect(opening.maskContextMenu).toBeNull();
    expect(opening.drawingContextMenu).toBeNull();
    expect(opening.environmentEffectContextMenu).toBeNull();
  });

  it("opens drawing menus and selects the drawing", () => {
    const opening = getSceneContextMenuOpening({ kind: "drawing", drawing: drawing({ name: "Rune" }), drawingIndex: 2 }, position);

    expect(opening.selection).toEqual({
      tokenId: null,
      fogShapeId: null,
      weatherMaskId: null,
      drawingId: "drawing-1"
    });
    expect(opening.drawingContextMenu).toMatchObject({ drawingId: "drawing-1", label: "Rune", x: 12, y: 24 });
    expect(opening.tokenContextMenu).toBeNull();
  });

  it("opens weather mask menus and clears fog selection", () => {
    const opening = getSceneContextMenuOpening({ kind: "weather-mask", mask: weatherMask() }, position);

    expect(opening.selection).toEqual({
      tokenId: null,
      drawingId: null,
      weatherMaskId: "weather-1",
      fogShapeId: null
    });
    expect(opening.maskContextMenu).toMatchObject({ kind: "effects", maskId: "weather-1", x: 12, y: 24 });
  });

  it("opens fog menus and clears weather mask selection", () => {
    const opening = getSceneContextMenuOpening({ kind: "fog", shape: fogShape(), shapeIndex: 1 }, position);

    expect(opening.selection).toEqual({
      tokenId: null,
      drawingId: null,
      fogShapeId: "fog-1",
      weatherMaskId: null
    });
    expect(opening.maskContextMenu).toMatchObject({ kind: "fog", shapeId: "fog-1", x: 12, y: 24 });
  });

  it("opens environment effect menus and selects the effect", () => {
    const opening = getSceneContextMenuOpening({ kind: "environment-effect", effect: environmentEffect(), effectIndex: 0 }, position);

    expect(opening.selection).toEqual({
      tokenId: null,
      drawingId: null,
      fogShapeId: null,
      weatherMaskId: null,
      environmentEffectId: "effect-1"
    });
    expect(opening.environmentEffectContextMenu).toMatchObject({ effectId: "effect-1", label: "Fire Effect 1", x: 12, y: 24 });
    expect(opening.tokenContextMenu).toBeNull();
    expect(opening.maskContextMenu).toBeNull();
    expect(opening.drawingContextMenu).toBeNull();
  });
});
