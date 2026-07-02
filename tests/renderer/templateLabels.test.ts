import { describe, expect, it } from "vitest";
import { getLineTemplateEffectWidthPixels } from "../../src/renderer/canvas/drawings";
import { createDefaultScene, type DrawingElement } from "../../src/shared/localvtt";

describe("template label helpers", () => {
  it("converts line template width from measured units to grid pixels", () => {
    const scene = createDefaultScene("Template");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement.unitsPerGridCell = 5;

    expect(getLineTemplateEffectWidthPixels(lineTemplate({ templateWidth: 10 }), scene.grid)).toBe(200);
  });

  it("uses a pixel fallback for gridless maps", () => {
    const scene = createDefaultScene("Template");
    scene.grid.type = "gridless";

    expect(getLineTemplateEffectWidthPixels(lineTemplate({ templateWidth: 10, strokeWidth: 8 }), scene.grid)).toBe(100);
  });

  it("uses stroke width fallback for zero-width line templates", () => {
    expect(getLineTemplateEffectWidthPixels(lineTemplate({ templateWidth: 0, strokeWidth: 8 }))).toBe(20);
    expect(getLineTemplateEffectWidthPixels(lineTemplate({ templateWidth: 0, strokeWidth: 2 }))).toBe(12);
  });
});

function lineTemplate(patch: Partial<DrawingElement>): DrawingElement {
  return {
    id: "line-template",
    kind: "line",
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    color: "#7dd3fc",
    opacity: 1,
    strokeWidth: 8,
    templateWidth: 5,
    measurementLabelVisible: true,
    visibleInPlayer: true,
    ...patch
  };
}
