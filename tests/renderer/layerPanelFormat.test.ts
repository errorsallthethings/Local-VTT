import { describe, expect, it } from "vitest";
import {
  formatEnvironmentShapeLabel,
  formatLayerPanelMultiplier,
  formatLayerPanelNumber,
  formatLayerPanelPercent
} from "../../src/renderer/components/layers/panel/layerPanelFormat";

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
});
