import { describe, expect, it } from "vitest";
import {
  createTemplateAssetPlacements,
  createTemplatePlacementRandom,
  getTemplateEffectBounds,
  getTemplateEffectOverlayCacheKey,
  getTemplateEffectPlacementCount,
  TEMPLATE_EFFECT_RENDERABLE_WIDTH_PX,
  type TemplateEffectRenderable
} from "../../src/renderer/canvas/drawings";
import { getTemplateEffectTuning } from "../../src/renderer/canvas/drawings/templateEffectTuning";
import { createDefaultScene, type DrawingElement } from "../../src/shared/localvtt";

describe("template effect placement", () => {
  it("pads line template effect bounds for wide overlay assets", () => {
    const scene = createDefaultScene("Line bounds");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };

    expect(getTemplateEffectBounds(drawing({ templateWidth: 5 }), scene.grid)).toEqual({
      left: -118,
      top: -168,
      right: 218,
      bottom: 168
    });
  });

  it("keeps non-line template effect bounds unchanged", () => {
    expect(getTemplateEffectBounds(drawing({ kind: "circle", points: [{ x: 100, y: 100 }, { x: 150, y: 100 }], strokeWidth: 10 }))).toEqual({
      left: 45,
      top: 45,
      right: 155,
      bottom: 155
    });
  });

  it("builds stable cache keys from drawing geometry, tuning version, and renderable ids", () => {
    const bounds = { left: 0, top: 0, right: 100, bottom: 100 };
    const renderables = [renderable("spark"), renderable("flame")];

    expect(getTemplateEffectOverlayCacheKey(drawing({ id: "a" }), bounds, renderables, 0.75)).toBe(getTemplateEffectOverlayCacheKey(drawing({ id: "a" }), bounds, renderables, 0.75));
    expect(getTemplateEffectOverlayCacheKey(drawing({ id: "a" }), bounds, renderables, 0.75)).not.toBe(getTemplateEffectOverlayCacheKey(drawing({ id: "b" }), bounds, renderables, 0.75));
  });

  it("clamps placement counts to effect tuning limits", () => {
    const tuning = getTemplateEffectTuning("fire");

    expect(getTemplateEffectPlacementCount({ left: 0, top: 0, right: 10, bottom: 10 }, tuning)).toBe(tuning.minPlacements);
    expect(getTemplateEffectPlacementCount({ left: 0, top: 0, right: 10_000, bottom: 10_000 }, tuning)).toBe(tuning.maxPlacements);
  });

  it("creates deterministic placements inside the template region", () => {
    const template = drawing({ kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 200, y: 100 }] });
    const bounds = { left: 0, top: 0, right: 200, bottom: 100 };
    const tuning = getTemplateEffectTuning("fire");
    const first = createTemplateAssetPlacements(template, bounds, [renderable("flame")], 3, createTemplatePlacementRandom(template), undefined, tuning);
    const second = createTemplateAssetPlacements(template, bounds, [renderable("flame")], 3, createTemplatePlacementRandom(template), undefined, tuning);

    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first[0].width).toBeGreaterThan(TEMPLATE_EFFECT_RENDERABLE_WIDTH_PX * 0.5);
    for (const placement of first) {
      expect(placement.x).toBeGreaterThanOrEqual(0);
      expect(placement.x).toBeLessThanOrEqual(200);
      expect(placement.y).toBeGreaterThanOrEqual(0);
      expect(placement.y).toBeLessThanOrEqual(100);
    }
  });
});

function renderable(id: string): TemplateEffectRenderable {
  return {
    id,
    image: {} as CanvasImageSource,
    naturalHeight: 100,
    naturalWidth: 200
  };
}

function drawing(patch: Partial<DrawingElement>): DrawingElement {
  return {
    id: "template",
    kind: "line",
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    color: "#7dd3fc",
    opacity: 1,
    strokeWidth: 8,
    templateEffect: "fire",
    templateWidth: 5,
    measurementLabelVisible: true,
    visibleInPlayer: true,
    ...patch
  };
}
