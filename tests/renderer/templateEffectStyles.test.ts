import { describe, expect, it } from "vitest";
import { getTemplateEffectStyle, getTemplateInnerGlowStyle } from "../../src/renderer/canvas/drawings";

describe("template effect styles", () => {
  it("returns the default plain template style", () => {
    expect(getTemplateEffectStyle("plain")).toEqual({
      stroke: "#7dd3fc",
      fill: "#7dd3fc",
      fillOpacity: 0.08,
      highlightFill: "rgb(122 162 247 / 0.18)",
      highlightStroke: "rgb(255 255 255 / 0.34)"
    });
  });

  it("returns effect-specific style and dash settings", () => {
    expect(getTemplateEffectStyle("fire")).toMatchObject({
      stroke: "#f97316",
      fill: "#f97316",
      fillOpacity: 0,
      dash: [18, 7, 5, 7]
    });
    expect(getTemplateEffectStyle("web")).toMatchObject({
      stroke: "#f8fafc",
      fill: "#cbd5e1",
      dash: [4, 6, 14, 6]
    });
  });

  it("returns template inner glow style from effect colors and stroke width", () => {
    expect(getTemplateInnerGlowStyle("fire", 12, 0.5)).toMatchObject({
      alpha: 0.275,
      strokeStyle: "#fb923c",
      shadowColor: "#f97316",
      shadowBlur: 18,
      lineWidth: 31.200000000000003,
      highlightAlpha: 0.21450000000000002,
      highlightLineWidth: 13.200000000000001,
      highlightStrokeStyle: "#fed7aa"
    });
    expect(getTemplateInnerGlowStyle("acid", 12, 0.5)).toMatchObject({
      strokeStyle: "#bef264",
      shadowBlur: 26,
      lineWidth: 39,
      highlightAlpha: 0.264,
      highlightLineWidth: 17.4,
      highlightStrokeStyle: "#f7fee7"
    });
  });

  it("omits template inner glow when layer opacity is zero", () => {
    expect(getTemplateInnerGlowStyle("fire", 12, 0)).toBeNull();
  });
});
