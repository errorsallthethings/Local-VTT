import { describe, expect, it } from "vitest";
import { createDefaultScene, type DrawingElement } from "../../src/shared/localvtt";
import type { DrawingDragState, DrawingResizeState, DrawingRotateState } from "../../src/renderer/canvas/scene";
import {
  getDrawingTransformPointerComplete,
  getDrawingTransformPointerMove,
  getDrawingTransformPointerMoveAction,
  getDrawingTransformPointerStart
} from "../../src/renderer/components/scene/sceneDrawingTransformPointer";

function drawing(overrides: Partial<DrawingElement> = {}): DrawingElement {
  return {
    id: "drawing-1",
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    color: "#fff",
    opacity: 1,
    strokeWidth: 4,
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

describe("scene drawing transform pointer helpers", () => {
  it("returns selector hits without starting drawing drags", () => {
    const scene = createDefaultScene("Selector Drawing");
    scene.drawings = [drawing()];

    const start = getDrawingTransformPointerStart({
      authoringToolActive: false,
      camera: { x: 0, y: 0, zoom: 1 },
      canShowDrawings: true,
      mouseBehavior: "selector",
      point: { x: 50, y: 50 },
      pointerId: 3,
      scene,
      selectedDrawingIds: []
    });

    expect(start).toEqual({
      kind: "hit",
      dragGroup: { itemIds: ["drawing-1"], draggingSelectedGroup: false, shouldSelectHitItem: true },
      dragStart: null,
      drawingId: "drawing-1",
      preview: null
    });
  });

  it("starts grabber drags for drawing hits and preserves selected drawing groups", () => {
    const scene = createDefaultScene("Grabber Drawing");
    scene.drawings = [
      drawing({ id: "drawing-1", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }),
      drawing({ id: "drawing-2", points: [{ x: 200, y: 0 }, { x: 300, y: 100 }] })
    ];

    const start = getDrawingTransformPointerStart({
      authoringToolActive: false,
      camera: { x: 0, y: 0, zoom: 1 },
      canShowDrawings: true,
      mouseBehavior: "grabber",
      point: { x: 50, y: 50 },
      pointerId: 4,
      scene,
      selectedDrawingIds: ["drawing-1", "drawing-2"]
    });

    expect(start?.kind).toBe("hit");
    if (start?.kind !== "hit") {
      return;
    }
    expect(start.dragGroup).toEqual({ itemIds: ["drawing-1", "drawing-2"], draggingSelectedGroup: true, shouldSelectHitItem: false });
    expect(start.dragStart).toMatchObject({
      pointerId: 4,
      drawingId: "drawing-1",
      start: { x: 50, y: 50 },
      snapAnchor: { x: 150, y: 50 }
    });
    expect([...start.dragStart?.groupStartPoints.keys() ?? []]).toEqual(["drawing-1", "drawing-2"]);
    expect(start.preview).toBe(start.dragStart?.groupStartPoints);
  });

  it("starts selected drawing transforms before regular drawing hits", () => {
    const scene = createDefaultScene("Transform Drawing");
    scene.drawings = [drawing()];

    const start = getDrawingTransformPointerStart({
      authoringToolActive: false,
      camera: { x: 0, y: 0, zoom: 1 },
      canShowDrawings: true,
      mouseBehavior: "grabber",
      point: { x: 100, y: 100 },
      pointerId: 5,
      scene,
      selectedDrawingIds: ["drawing-1"]
    });

    expect(start?.kind).toBe("transform");
    if (start?.kind !== "transform") {
      return;
    }
    expect(start.transformKind).toBe("resize");
    expect(start.state).toMatchObject({
      pointerId: 5,
      handle: "se"
    });
    expect(start.preview.get("drawing-1")).toEqual([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
  });

  it("ignores drawing starts when drawings are hidden, tools are authoring, or no drawing is hit", () => {
    const scene = createDefaultScene("Ignored Drawing");
    scene.drawings = [drawing()];

    expect(
      getDrawingTransformPointerStart({
        authoringToolActive: true,
        camera: { x: 0, y: 0, zoom: 1 },
        canShowDrawings: true,
        mouseBehavior: "grabber",
        point: { x: 50, y: 50 },
        pointerId: 1,
        scene,
        selectedDrawingIds: []
      })
    ).toBeNull();
    expect(
      getDrawingTransformPointerStart({
        authoringToolActive: false,
        camera: { x: 0, y: 0, zoom: 1 },
        canShowDrawings: false,
        mouseBehavior: "grabber",
        point: { x: 50, y: 50 },
        pointerId: 1,
        scene,
        selectedDrawingIds: []
      })
    ).toBeNull();
    expect(
      getDrawingTransformPointerStart({
        authoringToolActive: false,
        camera: { x: 0, y: 0, zoom: 1 },
        canShowDrawings: true,
        mouseBehavior: "grabber",
        point: { x: 500, y: 500 },
        pointerId: 1,
        scene,
        selectedDrawingIds: []
      })
    ).toBeNull();
  });

  it("updates drawing move previews for matching pointer drags", () => {
    const scene = createDefaultScene("Move Drawing");
    scene.drawings = [drawing()];
    const dragState: DrawingDragState = {
      pointerId: 6,
      drawingId: "drawing-1",
      start: { x: 50, y: 50 },
      snapAnchor: { x: 50, y: 50 },
      groupStartPoints: new Map([["drawing-1", [{ x: 0, y: 0 }, { x: 100, y: 100 }]]])
    };

    expect(
      getDrawingTransformPointerMove({
        dragState,
        point: { x: 75, y: 80 },
        pointerId: 7,
        resizeState: null,
        rotateState: null,
        scene,
        snapEnabled: false,
        squareConstrained: false
      })
    ).toBeNull();
    expect(
      getDrawingTransformPointerMove({
        dragState,
        point: { x: 75, y: 80 },
        pointerId: 6,
        resizeState: null,
        rotateState: null,
        scene,
        snapEnabled: false,
        squareConstrained: false
      })
    ).toEqual({
      kind: "move",
      preview: new Map([["drawing-1", [{ x: 25, y: 30 }, { x: 125, y: 130 }]]]),
      snapPoint: null
    });
  });

  it("updates drawing resize and rotation previews before move previews", () => {
    const scene = createDefaultScene("Transform Move Drawing");
    scene.drawings = [drawing()];
    const groupStartPoints = new Map([["drawing-1", [{ x: 0, y: 0 }, { x: 100, y: 100 }]]]);
    const dragState: DrawingDragState = {
      pointerId: 8,
      drawingId: "drawing-1",
      start: { x: 50, y: 50 },
      snapAnchor: { x: 50, y: 50 },
      groupStartPoints
    };
    const resizeState: DrawingResizeState = {
      pointerId: 8,
      handle: "e",
      bounds: { left: 0, top: 0, right: 100, bottom: 100 },
      groupStartPoints
    };
    const rotateState: DrawingRotateState = {
      pointerId: 9,
      center: { x: 0, y: 0 },
      startAngle: 0,
      groupStartPoints: new Map([["drawing-1", [{ x: 10, y: 0 }]]])
    };

    const resize = getDrawingTransformPointerMove({
      dragState,
      point: { x: 150, y: 100 },
      pointerId: 8,
      resizeState,
      rotateState: null,
      scene,
      snapEnabled: false,
      squareConstrained: false
    });
    expect(resize).toEqual({
      kind: "resize",
      preview: new Map([["drawing-1", [{ x: 0, y: 0 }, { x: 150, y: 100 }]]])
    });

    const rotate = getDrawingTransformPointerMove({
      dragState: null,
      point: { x: 0, y: 10 },
      pointerId: 9,
      resizeState: null,
      rotateState,
      scene,
      snapEnabled: false,
      squareConstrained: false
    });
    expect(rotate?.kind).toBe("rotate");
    expect(rotate?.preview.get("drawing-1")?.[0].x).toBeCloseTo(0);
    expect(rotate?.preview.get("drawing-1")?.[0].y).toBeCloseTo(10);
  });

  it("maps drawing transform pointer moves to SceneCanvas actions", () => {
    const scene = createDefaultScene("Move Drawing Action");
    scene.drawings = [drawing()];
    const dragState: DrawingDragState = {
      pointerId: 6,
      drawingId: "drawing-1",
      start: { x: 50, y: 50 },
      snapAnchor: { x: 50, y: 50 },
      groupStartPoints: new Map([["drawing-1", [{ x: 0, y: 0 }, { x: 100, y: 100 }]]])
    };
    const move = getDrawingTransformPointerMove({
      dragState,
      point: { x: 75, y: 80 },
      pointerId: 6,
      resizeState: null,
      rotateState: null,
      scene,
      snapEnabled: false,
      squareConstrained: false
    });

    expect(getDrawingTransformPointerMoveAction(null)).toEqual({ kind: "none" });
    expect(getDrawingTransformPointerMoveAction(move)).toEqual({
      kind: "set-preview",
      preview: new Map([["drawing-1", [{ x: 25, y: 30 }, { x: 125, y: 130 }]]]),
      snapPoint: null
    });
  });

  it("completes matching drawing transform pointers with the active preview", () => {
    const preview = new Map([["drawing-1", [{ x: 10, y: 20 }, { x: 30, y: 40 }]]]);
    const dragState: DrawingDragState = {
      pointerId: 10,
      drawingId: "drawing-1",
      start: { x: 0, y: 0 },
      snapAnchor: { x: 0, y: 0 },
      groupStartPoints: new Map()
    };
    const resizeState: DrawingResizeState = {
      pointerId: 11,
      handle: "se",
      bounds: { left: 0, top: 0, right: 100, bottom: 100 },
      groupStartPoints: new Map()
    };
    const rotateState: DrawingRotateState = {
      pointerId: 12,
      center: { x: 0, y: 0 },
      startAngle: 0,
      groupStartPoints: new Map()
    };

    expect(
      getDrawingTransformPointerComplete({
        dragState,
        pointerId: 10,
        preview,
        resizeState,
        rotateState
      })
    ).toEqual({ kind: "move", preview, clearSnapPoint: true });
    expect(
      getDrawingTransformPointerComplete({
        dragState,
        pointerId: 11,
        preview,
        resizeState,
        rotateState
      })
    ).toEqual({ kind: "resize", preview, clearSnapPoint: false });
    expect(
      getDrawingTransformPointerComplete({
        dragState,
        pointerId: 12,
        preview,
        resizeState,
        rotateState
      })
    ).toEqual({ kind: "rotate", preview, clearSnapPoint: false });
    expect(
      getDrawingTransformPointerComplete({
        dragState,
        pointerId: 99,
        preview,
        resizeState,
        rotateState
      })
    ).toBeNull();
  });
});
