import { describe, expect, it } from "vitest";
import { getTemplateEffectStyle } from "../../src/renderer/canvas/drawings";

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
});
