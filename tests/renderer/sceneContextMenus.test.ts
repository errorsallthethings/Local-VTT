import { describe, expect, it } from "vitest";
import type { DrawingElement, EnvironmentEffectMask, FogShape, Token, WeatherMask } from "../../src/shared/localvtt";
import {
  getDrawingContextMenu,
  getEnvironmentEffectContextMenu,
  getFogContextMenu,
  getTokenContextMenu,
  getWeatherMaskContextMenu
} from "../../src/renderer/canvas/scene";

const menuPosition = { x: 120, y: 80 };

function token(overrides: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    position: { x: 10, y: 20 },
    size: { width: 40, height: 40 },
    hidden: false,
    visibleInPlayer: true,
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
    ...overrides
  };
}

function fogShape(overrides: Partial<FogShape> = {}): FogShape {
  return {
    id: "fog-1",
    operation: "hide",
    kind: "rectangle",
    points: [],
    ...overrides
  };
}

function environmentEffect(overrides: Partial<EnvironmentEffectMask> = {}): EnvironmentEffectMask {
  return {
    id: "effect-1",
    kind: "rectangle",
    effect: "water",
    points: [],
    ...overrides
  };
}

describe("scene context menus", () => {
  it("builds token menus with name and GM visibility fallbacks", () => {
    expect(getTokenContextMenu(token({ name: "", hidden: true, visibleInPlayer: false }), menuPosition)).toEqual({
      tokenId: "token-1",
      tokenName: "Token",
      visibleInGm: false,
      visibleInPlayer: false,
      x: 120,
      y: 80
    });

    expect(getTokenContextMenu(token({ hidden: true, visibleInGm: true }), menuPosition).visibleInGm).toBe(true);
  });

  it("builds drawing menus with label and template state", () => {
    expect(
      getDrawingContextMenu(
        drawing({
          name: "  Area Burst  ",
          measurementLabelVisible: true,
          templateFootprintVisible: true,
          visibleInGm: false,
          visibleInPlayer: false
        }),
        2,
        menuPosition
      )
    ).toEqual({
      drawingId: "drawing-1",
      label: "Area Burst",
      isTemplate: true,
      templateFootprintVisible: true,
      visibleInGm: false,
      visibleInPlayer: false,
      x: 120,
      y: 80
    });

    expect(getDrawingContextMenu(drawing({ kind: "ellipse" }), 1, menuPosition).label).toBe("Ellipse 2");
  });

  it("builds weather mask menus with visible defaults", () => {
    expect(getWeatherMaskContextMenu(weatherMask({ name: " Rain Gap " }), menuPosition)).toEqual({
      kind: "effects",
      maskId: "weather-1",
      label: "Rain Gap",
      visible: true,
      visibleInPlayer: true,
      x: 120,
      y: 80
    });

    expect(getWeatherMaskContextMenu(weatherMask({ visible: false, visibleInPlayer: false }), menuPosition)).toMatchObject({
      visible: false,
      visibleInPlayer: false
    });
  });

  it("builds fog menus from legacy and split visibility fields", () => {
    expect(getFogContextMenu(fogShape({ visible: false }), 3, menuPosition)).toEqual({
      kind: "fog",
      shapeId: "fog-1",
      label: "Hide Rectangle 4",
      visibleInGm: false,
      visibleInPlayer: false,
      x: 120,
      y: 80
    });

    expect(getFogContextMenu(fogShape({ visible: false, visibleInGm: true, visibleInPlayer: false }), 0, menuPosition)).toMatchObject({
      visibleInGm: true,
      visibleInPlayer: false
    });
  });

  it("builds environment effect menus with visibility defaults", () => {
    expect(getEnvironmentEffectContextMenu(environmentEffect({ effect: "electric" }), 1, menuPosition)).toEqual({
      effectId: "effect-1",
      label: "Electric Effect 2",
      visibleInGm: true,
      visibleInPlayer: true,
      x: 120,
      y: 80
    });

    expect(getEnvironmentEffectContextMenu(environmentEffect({ visibleInGm: false, visibleInPlayer: false }), 0, menuPosition)).toMatchObject({
      visibleInGm: false,
      visibleInPlayer: false
    });
  });
});
