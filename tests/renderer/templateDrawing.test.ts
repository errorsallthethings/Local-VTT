import { describe, expect, it } from "vitest";
import { createDefaultScene, type DrawingTemplateEffect } from "../../src/shared/localvtt";
import type { DrawingPreview } from "../../src/renderer/canvas/drawings/drawingRenderer";
import {
  formatDefaultTemplateDrawingName,
  getDrawingElementFromPreview,
  getDrawingKindForTool,
  getDrawingPolygonElementFromDraft,
  getDrawingTemplateCurrentPoint,
  getTemplateDistancePixels,
  getTemplateEffectNamePart,
  getTemplatePreviewDrawing,
  isTemplateDrawingTool
} from "../../src/renderer/canvas/drawings/templateDrawing";

describe("template drawing helpers", () => {
  it("identifies template drawing tools", () => {
    expect(isTemplateDrawingTool("template-line")).toBe(true);
    expect(isTemplateDrawingTool("template-rectangle")).toBe(true);
    expect(isTemplateDrawingTool("template-circle")).toBe(true);
    expect(isTemplateDrawingTool("template-cone")).toBe(true);
    expect(isTemplateDrawingTool("line")).toBe(false);
    expect(isTemplateDrawingTool(null)).toBe(false);
  });

  it("maps drawing tools to persisted drawing kinds", () => {
    expect(getDrawingKindForTool("template-line")).toBe("line");
    expect(getDrawingKindForTool("template-rectangle")).toBe("rectangle");
    expect(getDrawingKindForTool("template-circle")).toBe("circle");
    expect(getDrawingKindForTool("template-cone")).toBe("cone");
    expect(getDrawingKindForTool("circle")).toBe("ellipse");
    expect(getDrawingKindForTool("polygon")).toBe("polygon");
  });

  it("formats default template names with optional effect labels", () => {
    expect(formatDefaultTemplateDrawingName("template-line", 0)).toBe("Template Line 1");
    expect(formatDefaultTemplateDrawingName("template-circle", 1, "fire")).toBe("Template Radius - Fire 2");
    expect(formatDefaultTemplateDrawingName("template-rectangle", 2, "lightning")).toBe("Template Cube - Electric 3");
    expect(formatDefaultTemplateDrawingName("template-cone", 3, "web")).toBe("Template Cone - Web 4");
  });

  it("formats template effect name parts", () => {
    expect(getTemplateEffectNamePart("plain")).toBe("");
    expect(getTemplateEffectNamePart("radiant")).toBe(" - Radiant");
    expect(getTemplateEffectNamePart("lightning" satisfies DrawingTemplateEffect)).toBe(" - Electric");
  });

  it("converts template feet to scene pixels when a measured grid is available", () => {
    const scene = createDefaultScene("Measured");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement.unitsPerGridCell = 5;

    expect(getTemplateDistancePixels(scene, 30)).toBe(600);
    expect(getTemplateDistancePixels(null, 30)).toBeNull();
  });

  it("locks preset template current points to the selected distance", () => {
    const scene = createDefaultScene("Measured");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement.unitsPerGridCell = 5;

    expect(getDrawingTemplateCurrentPoint({ x: 0, y: 0 }, { x: 30, y: 40 }, "template-line", scene, 10)).toEqual({ x: 120, y: 160 });
    expect(getDrawingTemplateCurrentPoint({ x: 10, y: 10 }, { x: 15, y: 30 }, "template-rectangle", scene, 5)).toEqual({ x: 110, y: 110 });
    expect(getDrawingTemplateCurrentPoint({ x: 10, y: 10 }, { x: 15, y: 30 }, "template-rectangle", scene, "custom")).toEqual({ x: 30, y: 30 });
  });

  it("creates player-visible dashed template preview drawings", () => {
    const preview: DrawingPreview = {
      pointerId: 1,
      kind: "template-circle",
      points: [{ x: 0, y: 0 }],
      current: { x: 20, y: 0 },
      color: "#93c5fd",
      opacity: 0.8,
      strokeWidth: 8,
      fillColor: "#93c5fd",
      measurementLabelVisible: true,
      templateWidth: 10
    };

    expect(getTemplatePreviewDrawing(preview)).toMatchObject({
      id: "template-preview",
      name: "Template Preview",
      kind: "circle",
      points: [{ x: 0, y: 0 }, { x: 20, y: 0 }],
      strokeStyle: "dashed",
      templateEffect: "plain",
      templateWidth: 10,
      templateFootprintVisible: true,
      visibleInGm: false,
      visibleInPlayer: true
    });
    expect(getTemplatePreviewDrawing({ ...preview, kind: "line" })).toBeNull();
    expect(getTemplatePreviewDrawing({ ...preview, measurementLabelVisible: false })).toBeNull();
  });

  it("creates persisted drawing elements from non-template previews", () => {
    const preview: DrawingPreview = {
      pointerId: 1,
      kind: "rectangle",
      points: [{ x: 0, y: 0 }],
      current: { x: 20, y: 30 },
      color: "#ff0000",
      opacity: 0.75,
      strokeWidth: 12,
      fillColor: "#00ff00",
      fillOpacity: 0.25,
      strokeStyle: "dotted",
      measurementLabelVisible: false
    };

    expect(getDrawingElementFromPreview(preview, "drawing-1", 2)).toMatchObject({
      id: "drawing-1",
      name: "Rectangle 3",
      kind: "rectangle",
      points: [{ x: 0, y: 0 }, { x: 20, y: 30 }],
      color: "#ff0000",
      opacity: 0.75,
      strokeColor: "#ff0000",
      strokeOpacity: 0.75,
      strokeWidth: 12,
      fill: "#00ff00",
      fillColor: "#00ff00",
      fillOpacity: 0.25,
      strokeStyle: "dotted",
      templateEffect: "plain",
      templateWidth: 5,
      measurementLabelVisible: false,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("creates persisted template elements from template previews", () => {
    const preview: DrawingPreview = {
      pointerId: 1,
      kind: "template-circle",
      points: [{ x: 0, y: 0 }],
      current: { x: 40, y: 0 },
      color: "#93c5fd",
      opacity: 0.9,
      strokeWidth: 8,
      fillColor: "#93c5fd",
      fillOpacity: 0.5,
      strokeStyle: "solid",
      templateEffect: "fire",
      templateWidth: 10,
      measurementLabelVisible: true
    };

    expect(getDrawingElementFromPreview(preview, "template-1", 0)).toMatchObject({
      id: "template-1",
      name: "Template Radius - Fire 1",
      kind: "circle",
      points: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
      fillOpacity: 0,
      strokeStyle: "dashed",
      templateEffect: "fire",
      templateWidth: 10,
      templateFootprintVisible: false,
      measurementLabelVisible: true,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("creates persisted polygon elements from draft points", () => {
    const points = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 10, y: 20 }];

    expect(
      getDrawingPolygonElementFromDraft(points, "polygon-1", 3, {
        color: "#ff0000",
        opacity: 0.8,
        fillColor: "#00ff00",
        fillOpacity: 0.25,
        strokeStyle: "dashed",
        strokeWidth: 16
      })
    ).toMatchObject({
      id: "polygon-1",
      name: "Polygon 4",
      kind: "polygon",
      points,
      color: "#ff0000",
      opacity: 0.8,
      strokeColor: "#ff0000",
      strokeOpacity: 0.8,
      fillColor: "#00ff00",
      fillOpacity: 0.25,
      strokeStyle: "dashed",
      strokeWidth: 16,
      measurementLabelVisible: false,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });
});
