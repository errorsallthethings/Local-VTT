import { describe, expect, it } from "vitest";
import type { DrawingElement } from "../../src/shared/localvtt";
import {
  getDrawingGroupBounds,
  getDrawingGroupSnapAnchor,
  getDrawingPointSnapshot,
  getDrawingResizeHandleAtPoint,
  getDrawingResizeHandles,
  getDrawingRotationHandle,
  getDrawingRotationHandleAtPoint,
  getEllipseAxisPoints,
  getRectangleDrawingPoints,
  getSelectedResizableDrawingBounds,
  getTriangleDrawingPoints,
  resizeDrawingPoints,
  rotateDrawingPoints,
  rotatePoints
} from "../../src/renderer/canvas/drawingTransform";

function drawing(overrides: Partial<DrawingElement>): DrawingElement {
  return {
    id: "drawing",
    kind: "line",
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    color: "#fff",
    opacity: 1,
    strokeWidth: 4,
    visibleInPlayer: true,
    ...overrides
  };
}

describe("drawing transform geometry", () => {
  it("combines selected resizable drawing bounds and skips template measurements", () => {
    const drawings = [
      drawing({ id: "a", kind: "rectangle", points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] }),
      drawing({ id: "b", kind: "rectangle", points: [{ x: -10, y: 5 }, { x: 5, y: 60 }] }),
      drawing({ id: "template", kind: "line", measurementLabelVisible: true, points: [{ x: -100, y: -100 }, { x: 100, y: 100 }] })
    ];

    expect(getSelectedResizableDrawingBounds(drawings, ["a", "b", "template"])).toEqual({
      left: -10,
      top: 5,
      right: 30,
      bottom: 60
    });
  });

  it("combines drawing group bounds", () => {
    expect(
      getDrawingGroupBounds([
        drawing({ kind: "rectangle", points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] }),
        drawing({ kind: "line", points: [{ x: -5, y: 0 }, { x: 5, y: 80 }] })
      ])
    ).toEqual({ left: -5, top: 0, right: 30, bottom: 80 });
  });

  it("captures cloned drawing points and skips templates by default", () => {
    const drawings = [
      drawing({ id: "a", kind: "line", points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] }),
      drawing({ id: "template", kind: "line", measurementLabelVisible: true, points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] })
    ];
    const snapshot = getDrawingPointSnapshot(drawings, ["a", "template"]);

    expect([...snapshot.keys()]).toEqual(["a"]);
    expect(snapshot.get("a")).toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
    expect(snapshot.get("a")).not.toBe(drawings[0].points);
  });

  it("can include template points for drawing movement snapshots", () => {
    const drawings = [drawing({ id: "template", kind: "line", measurementLabelVisible: true })];

    expect([...getDrawingPointSnapshot(drawings, ["template"], { includeTemplates: true }).keys()]).toEqual(["template"]);
  });

  it("uses drawing group center as snap anchor with a fallback", () => {
    const drawings = [
      drawing({ id: "a", kind: "rectangle", points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] }),
      drawing({ id: "b", kind: "rectangle", points: [{ x: -10, y: 0 }, { x: 10, y: 20 }] })
    ];

    expect(getDrawingGroupSnapAnchor(drawings, ["a", "b"], { x: 99, y: 99 })).toEqual({ x: 10, y: 20 });
    expect(getDrawingGroupSnapAnchor(drawings, ["missing"], { x: 99, y: 99 })).toEqual({ x: 99, y: 99 });
  });

  it("returns resize handles around a bounds rectangle", () => {
    expect(getDrawingResizeHandles({ left: 0, top: 10, right: 100, bottom: 50 })).toEqual([
      { handle: "nw", point: { x: 0, y: 10 } },
      { handle: "n", point: { x: 50, y: 10 } },
      { handle: "ne", point: { x: 100, y: 10 } },
      { handle: "e", point: { x: 100, y: 30 } },
      { handle: "se", point: { x: 100, y: 50 } },
      { handle: "s", point: { x: 50, y: 50 } },
      { handle: "sw", point: { x: 0, y: 50 } },
      { handle: "w", point: { x: 0, y: 30 } }
    ]);
  });

  it("hit-tests resize and rotation handles", () => {
    const drawings = [drawing({ id: "box", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] })];
    const camera = { x: 0, y: 0, zoom: 1 };

    expect(getDrawingResizeHandleAtPoint(drawings, ["box"], { x: 100, y: 100 }, camera)?.handle).toBe("se");
    expect(getDrawingRotationHandle({ left: 0, top: 0, right: 100, bottom: 100 }, camera)).toEqual({ x: 50, y: -30 });
    expect(getDrawingRotationHandleAtPoint(drawings, ["box"], { x: 50, y: -30 }, camera)?.center).toEqual({ x: 50, y: 50 });
  });

  it("normalizes rectangle, ellipse, and two-point triangle control points", () => {
    expect(getRectangleDrawingPoints([{ x: 0, y: 0 }, { x: 10, y: 20 }])).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 20 },
      { x: 0, y: 20 }
    ]);
    expect(getEllipseAxisPoints([{ x: 10, y: 20 }, { x: 30, y: 50 }])).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 20 },
      { x: 10, y: 50 }
    ]);
    expect(getTriangleDrawingPoints([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 8.66 }
    ]);
  });

  it("rotates generic and shape-normalized drawing points", () => {
    expect(rotatePoints([{ x: 10, y: 0 }], { x: 0, y: 0 }, Math.PI / 2)[0].x).toBeCloseTo(0);
    expect(rotatePoints([{ x: 10, y: 0 }], { x: 0, y: 0 }, Math.PI / 2)[0].y).toBeCloseTo(10);
    expect(rotateDrawingPoints(drawing({ kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }), { x: 5, y: 5 }, Math.PI / 2)).toHaveLength(4);
  });

  it("resizes rectangles from the opposite anchor", () => {
    expect(
      resizeDrawingPoints(
        drawing({ kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }),
        { left: 0, top: 0, right: 100, bottom: 100 },
        "e",
        { x: 150, y: 100 },
        false
      )
    ).toEqual([{ x: 0, y: 0 }, { x: 150, y: 100 }]);
  });

  it("resizes circles from their center", () => {
    expect(
      resizeDrawingPoints(
        drawing({ kind: "circle", points: [{ x: 50, y: 50 }, { x: 100, y: 50 }] }),
        { left: 0, top: 0, right: 100, bottom: 100 },
        "e",
        { x: 120, y: 50 },
        false
      )
    ).toEqual([{ x: 50, y: 50 }, { x: 120, y: 50 }]);
  });
});
