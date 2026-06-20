import { describe, expect, it } from "vitest";
import {
  getCanvasInteractionClass,
  getDrawingTransformHoverAtPoint,
  hasAuthoringToolActive,
  hasSceneItemHoverAtPoint,
  type CanvasInteractionState
} from "../../src/renderer/canvas/canvasInteraction";
import { createDefaultScene, type Token } from "../../src/shared/localvtt";

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
  it("detects whether an authoring tool is active", () => {
    expect(
      hasAuthoringToolActive({
        canvasTool: null,
        drawingTool: null,
        fogTool: null,
        weatherMaskTool: null,
        environmentEffectTool: null
      })
    ).toBe(false);
    expect(
      hasAuthoringToolActive({
        canvasTool: null,
        drawingTool: "line",
        fogTool: null,
        weatherMaskTool: null,
        environmentEffectTool: null
      })
    ).toBe(true);
    expect(
      hasAuthoringToolActive({
        canvasTool: null,
        drawingTool: null,
        fogTool: null,
        weatherMaskTool: null,
        environmentEffectTool: "polygon"
      })
    ).toBe(true);
  });

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

describe("canvas interaction hover", () => {
  const camera = { x: 0, y: 0, zoom: 1 };

  function token(patch: Partial<Token> = {}): Token {
    return {
      id: "token-1",
      name: "Token",
      position: { x: 10, y: 10 },
      size: { width: 20, height: 20 },
      hidden: false,
      visibleInPlayer: true,
      ...patch
    };
  }

  it("detects token hover when token layer is visible", () => {
    const scene = createDefaultScene("Hover");
    scene.tokens = [token()];

    expect(
      hasSceneItemHoverAtPoint({
        mode: "gm",
        scene,
        point: { x: 15, y: 15 },
        camera,
        canShowTokens: true
      })
    ).toBe(true);
  });

  it("suppresses scene item hover during active interactions", () => {
    const scene = createDefaultScene("Hover");
    scene.tokens = [token()];

    expect(
      hasSceneItemHoverAtPoint({
        mode: "gm",
        scene,
        point: { x: 15, y: 15 },
        camera,
        canShowTokens: true,
        hasActiveInteraction: true
      })
    ).toBe(false);
  });

  it("respects mask layer visibility for hover", () => {
    const scene = createDefaultScene("Masks");
    scene.fog.shapes = [
      {
        id: "fog-1",
        operation: "hide",
        kind: "rectangle",
        points: [
          { x: 0, y: 0 },
          { x: 40, y: 40 }
        ],
        visibleInGm: true
      }
    ];

    expect(
      hasSceneItemHoverAtPoint({
        mode: "gm",
        scene,
        point: { x: 20, y: 20 },
        camera,
        canShowFog: true
      })
    ).toBe(true);
    expect(
      hasSceneItemHoverAtPoint({
        mode: "gm",
        scene,
        point: { x: 20, y: 20 },
        camera,
        canShowFog: false
      })
    ).toBe(false);
  });

  it("returns no drawing transform hover without selected drawings", () => {
    const scene = createDefaultScene("Drawings");

    expect(
      getDrawingTransformHoverAtPoint({
        mode: "gm",
        scene,
        point: { x: 0, y: 0 },
        camera,
        selectedDrawingIds: [],
        canShowDrawings: true
      })
    ).toBeNull();
  });
});
