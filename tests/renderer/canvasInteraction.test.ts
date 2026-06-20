import { describe, expect, it } from "vitest";
import { getCanvasInteractionClass, type CanvasInteractionState } from "../../src/renderer/canvas/canvasInteraction";

function state(overrides: Partial<CanvasInteractionState> = {}): CanvasInteractionState {
  return {
    canvasTool: null,
    mouseBehavior: "selector",
    drawingTool: null,
    fogTool: null,
    weatherMaskTool: null,
    environmentEffectTool: null,
    isPanning: false,
    tokenDragPreview: null,
    drawingTransformHover: null,
    sceneItemHover: false,
    ...overrides
  };
}

describe("canvas interaction class", () => {
  it("prioritizes active drag states over tool cursors", () => {
    expect(getCanvasInteractionClass(state({ isPanning: true, canvasTool: "ruler" }))).toBe("scene-canvas-panning");
    expect(getCanvasInteractionClass(state({ tokenDragPreview: {}, canvasTool: "laser" }))).toBe("scene-canvas-token-dragging");
  });

  it("maps transform hover handles before active tools", () => {
    expect(getCanvasInteractionClass(state({ drawingTransformHover: "rotate", drawingTool: "line" }))).toBe("scene-canvas-transform-rotate");
    expect(getCanvasInteractionClass(state({ drawingTransformHover: "n", drawingTool: "line" }))).toBe("scene-canvas-transform-resize-y");
    expect(getCanvasInteractionClass(state({ drawingTransformHover: "e", drawingTool: "line" }))).toBe("scene-canvas-transform-resize-x");
    expect(getCanvasInteractionClass(state({ drawingTransformHover: "nw", drawingTool: "line" }))).toBe("scene-canvas-transform-resize-nwse");
    expect(getCanvasInteractionClass(state({ drawingTransformHover: "ne", drawingTool: "line" }))).toBe("scene-canvas-transform-resize-nesw");
  });

  it("maps table and drawing tools to cursor classes", () => {
    expect(getCanvasInteractionClass(state({ canvasTool: "ruler" }))).toBe("scene-canvas-tool-ruler");
    expect(getCanvasInteractionClass(state({ canvasTool: "ping" }))).toBe("scene-canvas-tool-ping");
    expect(getCanvasInteractionClass(state({ canvasTool: "laser" }))).toBe("scene-canvas-tool-laser");
    expect(getCanvasInteractionClass(state({ drawingTool: "freehand" }))).toBe("scene-canvas-tool-brush");
    expect(getCanvasInteractionClass(state({ drawingTool: "template-line" }))).toBe("scene-canvas-tool-line");
    expect(getCanvasInteractionClass(state({ drawingTool: "template-circle" }))).toBe("scene-canvas-tool-circle");
    expect(getCanvasInteractionClass(state({ drawingTool: "template-rectangle" }))).toBe("scene-canvas-tool-rectangle");
    expect(getCanvasInteractionClass(state({ drawingTool: "template-cone" }))).toBe("scene-canvas-tool-polygon");
  });

  it("maps mask and effect tools before passive hover states", () => {
    expect(getCanvasInteractionClass(state({ weatherMaskTool: "polygon", sceneItemHover: true }))).toBe("scene-canvas-tool-polygon");
    expect(getCanvasInteractionClass(state({ environmentEffectTool: "rectangle", sceneItemHover: true }))).toBe("scene-canvas-tool-rectangle");
    expect(getCanvasInteractionClass(state({ fogTool: "brush-reveal", sceneItemHover: true }))).toBe("scene-canvas-tool-brush");
    expect(getCanvasInteractionClass(state({ fogTool: "circle-hide", sceneItemHover: true }))).toBe("scene-canvas-tool-circle");
    expect(getCanvasInteractionClass(state({ fogTool: "rectangle-reveal", sceneItemHover: true }))).toBe("scene-canvas-tool-rectangle");
  });

  it("falls back to item hover, grabber, then default cursor", () => {
    expect(getCanvasInteractionClass(state({ sceneItemHover: true, mouseBehavior: "grabber" }))).toBe("scene-canvas-item-hover");
    expect(getCanvasInteractionClass(state({ mouseBehavior: "grabber" }))).toBe("scene-canvas-grabber");
    expect(getCanvasInteractionClass(state())).toBe("");
  });
});
