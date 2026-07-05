import { describe, expect, it, vi } from "vitest";
import { createDefaultScene, type DrawingElement } from "../../src/shared/localvtt";
import {
  applyTemplateEffectStroke,
  drawTemplateLabel,
  fillCurrentTemplatePath,
  traceClosedPath,
  traceTemplateEffectPath
} from "../../src/renderer/canvas/drawings";

describe("template drawing presentation helpers", () => {
  it("traces closed paths in point order", () => {
    const ctx = contextSpy();

    traceClosedPath(ctx as unknown as CanvasRenderingContext2D, [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 }
    ]);

    expect(ctx.moveTo).toHaveBeenCalledWith(1, 2);
    expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 3, 4);
    expect(ctx.lineTo).toHaveBeenNthCalledWith(2, 5, 6);
    expect(ctx.closePath).toHaveBeenCalledTimes(1);
  });

  it("traces template effect shapes for circles and rectangles", () => {
    const circleCtx = contextSpy();
    traceTemplateEffectPath(circleCtx as unknown as CanvasRenderingContext2D, drawing({ kind: "circle" }), 0.5);
    expect(circleCtx.arc).toHaveBeenCalledWith(0, 0, 50, 0, Math.PI * 2);

    const rectangleCtx = contextSpy();
    traceTemplateEffectPath(rectangleCtx as unknown as CanvasRenderingContext2D, drawing({ kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }), 1);
    expect(rectangleCtx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(rectangleCtx.lineTo).toHaveBeenCalledWith(100, 0);
    expect(rectangleCtx.lineTo).toHaveBeenCalledWith(0, 100);
    expect(rectangleCtx.closePath).toHaveBeenCalled();
  });

  it("applies template stroke and non-template fill presentation", () => {
    const strokeCtx = contextSpy();
    applyTemplateEffectStroke(strokeCtx as unknown as CanvasRenderingContext2D, drawing({ templateEffect: "fire", strokeWidth: 80 }));
    expect(strokeCtx.strokeStyle).not.toBe("#ffffff");
    expect(strokeCtx.setLineDash).toHaveBeenCalled();

    const fillCtx = contextSpy();
    fillCurrentTemplatePath(fillCtx as unknown as CanvasRenderingContext2D, drawing({ measurementLabelVisible: false, fillOpacity: 0.5 }), 0.5);
    expect(fillCtx.save).toHaveBeenCalled();
    expect(fillCtx.globalAlpha).toBe(0.25);
    expect(fillCtx.fill).toHaveBeenCalled();
    expect(fillCtx.restore).toHaveBeenCalled();
  });

  it("draws template labels only for supported measurable templates", () => {
    const scene = createDefaultScene("Templates");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };
    const ctx = contextSpy();

    drawTemplateLabel(ctx as unknown as CanvasRenderingContext2D, drawing({ kind: "circle" }), scene);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
    expect(ctx.strokeText).toHaveBeenCalled();

    const unsupportedCtx = contextSpy();
    drawTemplateLabel(unsupportedCtx as unknown as CanvasRenderingContext2D, drawing({ kind: "polygon" }), scene);
    expect(unsupportedCtx.fillText).not.toHaveBeenCalled();
  });
});

function drawing(patch: Partial<DrawingElement>): DrawingElement {
  return {
    id: "template",
    kind: "circle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    color: "#ffffff",
    opacity: 1,
    strokeWidth: 40,
    templateEffect: "fire",
    measurementLabelVisible: true,
    visibleInPlayer: true,
    ...patch
  };
}

function contextSpy() {
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    setLineDash: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    strokeText: vi.fn(),
    translate: vi.fn(),
    fillStyle: "#ffffff",
    font: "",
    globalAlpha: 1,
    lineWidth: 1,
    shadowBlur: 0,
    shadowColor: "",
    strokeStyle: "#ffffff",
    textAlign: "left",
    textBaseline: "alphabetic"
  };
}
