import { describe, expect, it } from "vitest";
import {
  formatEnvironmentShapeLabel,
  formatLayerPanelMultiplier,
  formatLayerPanelNumber,
  formatLayerPanelPercent,
  getGridFootprint,
  getGridTypeLabel,
  getLayerItemCount,
  getReservedLayerGuidance,
  isEffectsLayerId
} from "../../src/renderer/components/layers/panel/layerPanelFormat";
import { createDefaultScene, type Layer } from "../../src/shared/localvtt";

describe("layer panel formatting", () => {
  it("formats percentages and multipliers for compact layer readouts", () => {
    expect(formatLayerPanelPercent(0.456)).toBe("46%");
    expect(formatLayerPanelPercent(1)).toBe("100%");
    expect(formatLayerPanelMultiplier(1.234)).toBe("1.23x");
  });

  it("formats numbers without unnecessary decimals", () => {
    expect(formatLayerPanelNumber(80)).toBe("80");
    expect(formatLayerPanelNumber(80.125)).toBe("80.13");
  });

  it("formats environment and weather shape labels", () => {
    expect(formatEnvironmentShapeLabel("rectangle")).toBe("Rectangle");
    expect(formatEnvironmentShapeLabel("polygon")).toBe("Polygon");
    expect(formatEnvironmentShapeLabel("circle")).toBe("Radius");
  });

  it("labels grid type and calculates grid footprint", () => {
    const scene = createDefaultScene("Grid");
    scene.grid.mapGridColumns = 12;
    scene.grid.mapGridRows = 8;
    scene.grid.sizePx = 50;

    expect(getGridTypeLabel("gridless")).toBe("Gridless");
    expect(getGridTypeLabel("square")).toBe("Square");
    expect(getGridTypeLabel("hex")).toBe("Hex");
    expect(getGridFootprint(scene.grid)).toEqual({ width: 600, height: 400 });
  });

  it("counts layer items shown in compact badges", () => {
    const scene = createDefaultScene("Counts");
    scene.fog.shapes = [{ id: "fog", kind: "rectangle", operation: "hide", points: [] }];
    scene.tokens = [{ id: "token", name: "Token", assetId: null, position: { x: 0, y: 0 }, size: { width: 50, height: 50 }, visibleInPlayer: true }];
    scene.weather.masks = [{ id: "weather", kind: "circle", points: [], visibleInPlayer: true }];
    scene.environment.effects = [{ id: "effect", kind: "circle", effect: "water", points: [], visibleInPlayer: true }];
    scene.drawings = [{ id: "drawing", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 4, visibleInPlayer: true }];

    expect(getLayerItemCount("fog", scene)).toBe(1);
    expect(getLayerItemCount("token", scene)).toBe(1);
    expect(getLayerItemCount("effects", scene)).toBe(2);
    expect(getLayerItemCount("drawing", scene)).toBe(1);
    expect(getLayerItemCount("map", scene)).toBeNull();
  });

  it("identifies effects layers and reserved layer guidance", () => {
    expect(isEffectsLayerId("effects")).toBe(true);
    expect(isEffectsLayerId("weather")).toBe(true);
    expect(isEffectsLayerId("fog")).toBe(false);
    expect(getReservedLayerGuidance(layer("lighting"))).toContain("line-of-sight");
    expect(getReservedLayerGuidance(layer("map"))).toBeNull();
  });
});

function layer(id: Layer["id"]): Layer {
  return { id, name: id, kind: id, order: 0, visibleInGm: true, visibleInPlayer: true };
}
