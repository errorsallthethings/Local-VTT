import { describe, expect, it } from "vitest";
import { getRenderCamera } from "../../src/renderer/canvas/camera";
import {
  getFogDragKindForTool,
  getFogOperationForTool,
  isMeaningfulFogDrag,
  isMeaningfulPolygon,
  isPolygonTool,
  normalizeBrushPoints,
  shouldAddBrushPoint
} from "../../src/renderer/canvas/fogRenderer";
import { getNearestGridPoint } from "../../src/renderer/canvas/gridMath";
import { resolveMapTransform } from "../../src/renderer/canvas/mapRenderer";
import { createDefaultScene } from "../../src/shared/localvtt";

describe("canvas helpers", () => {
it("getRenderCamera applies display scale only to zoom", () => {
  expect(getRenderCamera({ x: 12, y: -8, zoom: 1.5 }, 2)).toEqual({
    x: 12,
    y: -8,
    zoom: 3
  });
});

it("getNearestGridPoint snaps to the configured grid offset", () => {
  expect(
    getNearestGridPoint(
      { x: 173, y: 228 },
      {
        type: "square",
        sizePx: 50,
        offsetX: 10,
        offsetY: 20,
        mapGridColumns: 44,
        mapGridRows: 25,
        color: "#fff",
        opacity: 1,
        lineThickness: 1,
        showOnGm: true,
        showOnPlayer: true,
        measurement: { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" }
      }
    )
  ).toEqual({ x: 160, y: 220 });
});

it("getNearestGridPoint returns null for gridless or invalid grids", () => {
  const grid = createDefaultScene("Gridless").grid;
  expect(getNearestGridPoint({ x: 10, y: 10 }, grid)).toBeNull();
  expect(getNearestGridPoint({ x: 10, y: 10 }, { ...grid, type: "square", sizePx: 0 })).toBeNull();
});

it("resolveMapTransform centers contain, cover, and actual-size fit modes", () => {
  const scene = createDefaultScene("Map");

  expect(resolveMapTransform({ ...scene, mapTransform: { ...scene.mapTransform, fitMode: "contain" } }, 400, 200, 1000, 1000)).toEqual({
    ...scene.mapTransform,
    fitMode: "contain",
    x: 0,
    y: 250,
    scale: 2.5
  });

  expect(resolveMapTransform({ ...scene, mapTransform: { ...scene.mapTransform, fitMode: "cover" } }, 400, 200, 1000, 1000)).toEqual({
    ...scene.mapTransform,
    fitMode: "cover",
    x: -500,
    y: 0,
    scale: 5
  });

  expect(resolveMapTransform({ ...scene, mapTransform: { ...scene.mapTransform, fitMode: "actual-size" } }, 400, 200, 1000, 1000)).toEqual({
    ...scene.mapTransform,
    fitMode: "actual-size",
    x: 300,
    y: 400,
    scale: 1
  });
});

it("fog tool helpers classify operation, shape, and polygon tools", () => {
  expect(getFogOperationForTool("reveal-brush")).toBe("reveal");
  expect(getFogOperationForTool("hide-rectangle")).toBe("hide");
  expect(getFogDragKindForTool("reveal-brush")).toBe("brush");
  expect(getFogDragKindForTool("hide-rectangle")).toBe("rectangle");
  expect(isPolygonTool("reveal-polygon")).toBe(true);
  expect(isPolygonTool("hide-brush")).toBe(false);
  expect(isMeaningfulPolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
  expect(isMeaningfulPolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }])).toBe(true);
});

it("brush fog helpers avoid redundant points and tiny movements", () => {
  const points = [{ x: 0, y: 0 }];
  expect(normalizeBrushPoints(points, { x: 0.5, y: 0.5 })).toBe(points);
  expect(normalizeBrushPoints(points, { x: 2, y: 0 })).toEqual([...points, { x: 2, y: 0 }]);
  expect(shouldAddBrushPoint(undefined, { x: 0, y: 0 }, 20)).toBe(true);
  expect(shouldAddBrushPoint({ x: 0, y: 0 }, { x: 4, y: 0 }, 20)).toBe(false);
  expect(shouldAddBrushPoint({ x: 0, y: 0 }, { x: 8, y: 0 }, 20)).toBe(true);
});

it("isMeaningfulFogDrag rejects tiny rectangles and accepts real brush strokes", () => {
  expect(
    isMeaningfulFogDrag({
      pointerId: 1,
      kind: "rectangle",
      start: { x: 0, y: 0 },
      current: { x: 3, y: 10 },
      points: [],
      operation: "reveal"
    })
  ).toBe(false);
  expect(
    isMeaningfulFogDrag({
      pointerId: 1,
      kind: "brush",
      start: { x: 0, y: 0 },
      current: { x: 2, y: 0 },
      points: [{ x: 0, y: 0 }],
      operation: "hide"
    })
  ).toBe(true);
});
});
