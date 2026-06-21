import { describe, expect, it } from "vitest";
import { areCamerasEqual, getCameraForPanDrag, getCameraForWheelZoom, getRenderCamera } from "../../src/renderer/canvas/camera";
import {
  getFogDragKindForTool,
  getFogDragFromPoint,
  getFogOperationForTool,
  getFogShapeFromDrag,
  getFogShapeFromPolygonDraft,
  getFogVisibilityPatchForNewShape,
  getUpdatedFogDrag,
  isMeaningfulFogDrag,
  isMeaningfulPolygon,
  isPolygonTool,
  normalizeBrushPoints,
  shouldAddBrushPoint
} from "../../src/renderer/canvas/fogRenderer";
import { getNearestGridPoint, getNearestSquareGridSnapPoint } from "../../src/renderer/canvas/gridMath";
import { getCameraForMapFit, resolveMapTransform } from "../../src/renderer/canvas/mapRenderer";
import { createDefaultScene } from "../../src/shared/localvtt";

describe("canvas helpers", () => {
it("getRenderCamera applies display scale only to zoom", () => {
  expect(getRenderCamera({ x: 12, y: -8, zoom: 1.5 }, 2)).toEqual({
    x: 12,
    y: -8,
    zoom: 3
  });
});

it("areCamerasEqual tolerates tiny floating point drift", () => {
  expect(areCamerasEqual({ x: 1, y: 2, zoom: 3 }, { x: 1.0005, y: 1.9995, zoom: 3.00005 })).toBe(true);
  expect(areCamerasEqual({ x: 1, y: 2, zoom: 3 }, { x: 1.01, y: 2, zoom: 3 })).toBe(false);
  expect(areCamerasEqual({ x: 1, y: 2, zoom: 3 }, { x: 1, y: 2, zoom: 3.001 })).toBe(false);
});

it("getCameraForPanDrag offsets the starting camera by pointer movement", () => {
  expect(getCameraForPanDrag({ x: 100, y: 80, camera: { x: 20, y: -10, zoom: 2 } }, 130, 50)).toEqual({
    x: 50,
    y: -40,
    zoom: 2
  });
});

it("getCameraForWheelZoom keeps the world point under the cursor anchored", () => {
  const camera = { x: 20, y: -10, zoom: 2 };
  const nextCamera = getCameraForWheelZoom({ camera, mouseX: 120, mouseY: 90, deltaY: -1 });

  expect(nextCamera.zoom).toBeCloseTo(2.16);
  expect((120 - nextCamera.x) / nextCamera.zoom).toBeCloseTo((120 - camera.x) / camera.zoom);
  expect((90 - nextCamera.y) / nextCamera.zoom).toBeCloseTo((90 - camera.y) / camera.zoom);
});

it("getCameraForWheelZoom clamps zoom bounds", () => {
  expect(getCameraForWheelZoom({ camera: { x: 0, y: 0, zoom: 10 }, mouseX: 0, mouseY: 0, deltaY: -1 }).zoom).toBe(6);
  expect(getCameraForWheelZoom({ camera: { x: 0, y: 0, zoom: 0.01 }, mouseX: 0, mouseY: 0, deltaY: 1 }).zoom).toBe(0.08);
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

it("getNearestSquareGridSnapPoint includes square centers, corners, and edge midpoints", () => {
  const grid = {
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
  } as const;

  expect(getNearestSquareGridSnapPoint({ x: 34, y: 44 }, grid)).toEqual({ x: 35, y: 45 });
  expect(getNearestSquareGridSnapPoint({ x: 11, y: 21 }, grid)).toEqual({ x: 10, y: 20 });
  expect(getNearestSquareGridSnapPoint({ x: 35, y: 19 }, grid)).toEqual({ x: 35, y: 20 });
  expect(getNearestSquareGridSnapPoint({ x: 60, y: 46 }, grid)).toEqual({ x: 60, y: 45 });
  expect(getNearestSquareGridSnapPoint({ x: 36, y: 70 }, grid)).toEqual({ x: 35, y: 70 });
  expect(getNearestSquareGridSnapPoint({ x: 9, y: 44 }, grid)).toEqual({ x: 10, y: 45 });
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

it("getCameraForMapFit centers a transformed map inside the viewport", () => {
  const scene = createDefaultScene("Map Fit");
  scene.mapTransform = { x: 100, y: 50, scale: 2, rotation: 0, fitMode: "manual" };

  expect(getCameraForMapFit(scene, 200, 100, 1000, 800)).toEqual({
    x: -202,
    y: 49,
    zoom: 2.34
  });
});

it("getCameraForMapFit accounts for rotation and rejects invalid dimensions", () => {
  const scene = createDefaultScene("Rotated Map Fit");
  scene.mapTransform = { x: 0, y: 0, scale: 1, rotation: 90, fitMode: "manual" };

  expect(getCameraForMapFit(scene, 200, 100, 1000, 800)).toEqual({
    x: 684,
    y: 32,
    zoom: 3.68
  });
  expect(getCameraForMapFit(scene, 0, 100, 1000, 800)).toEqual({ x: 0, y: 0, zoom: 1 });
});

it("fog tool helpers classify operation, shape, and polygon tools", () => {
  expect(getFogOperationForTool("reveal-brush")).toBe("reveal");
  expect(getFogOperationForTool("hide-rectangle")).toBe("hide");
  expect(getFogDragKindForTool("reveal-brush")).toBe("brush");
  expect(getFogDragKindForTool("hide-rectangle")).toBe("rectangle");
  expect(getFogDragKindForTool("reveal-circle")).toBe("circle");
  expect(isPolygonTool("reveal-polygon")).toBe(true);
  expect(isPolygonTool("reveal-circle")).toBe(false);
  expect(isPolygonTool("hide-brush")).toBe(false);
  expect(isMeaningfulPolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
  expect(isMeaningfulPolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }])).toBe(true);
});

it("creates fog drags from tool state", () => {
  expect(getFogDragFromPoint(7, "reveal-brush", { x: 10, y: 20 }, 30)).toEqual({
    pointerId: 7,
    kind: "brush",
    start: { x: 10, y: 20 },
    current: { x: 10, y: 20 },
    points: [{ x: 10, y: 20 }],
    radius: 15,
    operation: "reveal"
  });
  expect(getFogDragFromPoint(7, "hide-rectangle", { x: 10, y: 20 }, 30).radius).toBeUndefined();
  expect(getFogDragFromPoint(7, "hide-brush", { x: 10, y: 20 }, 4).radius).toBe(4);
});

it("fog visibility patch makes newly hidden fog visible when opacity is zeroed", () => {
  const scene = createDefaultScene("Fog");

  expect(getFogVisibilityPatchForNewShape({ ...scene.fog, gmOpacity: 0, playerOpacity: 0 }, "hide")).toEqual({
    gmOpacity: 0.5,
    playerOpacity: 1,
    opacity: 1
  });
  expect(getFogVisibilityPatchForNewShape({ ...scene.fog, gmOpacity: 0, playerOpacity: 0 }, "reveal")).toEqual({});
  expect(getFogVisibilityPatchForNewShape({ ...scene.fog, gmOpacity: 0.5, playerOpacity: 0 }, "hide")).toEqual({});
});

it("builds committed fog shapes from drag and polygon draft state", () => {
  expect(
    getFogShapeFromDrag(
      {
        pointerId: 1,
        kind: "circle",
        start: { x: 10, y: 12 },
        current: { x: 13, y: 16 },
        points: [],
        operation: "hide"
      },
      "fog-1",
      "Hide Circle 1",
      false
    )
  ).toEqual({
    id: "fog-1",
    name: "Hide Circle 1",
    operation: "hide",
    kind: "circle",
    points: [{ x: 10, y: 12 }, { x: 13, y: 16 }],
    radius: 5,
    visibleInGm: true,
    visibleInPlayer: false,
    visible: true
  });

  expect(
    getFogShapeFromPolygonDraft(
      {
        operation: "reveal",
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }]
      },
      "fog-2",
      "Reveal Polygon 1",
      true
    )
  ).toEqual({
    id: "fog-2",
    name: "Reveal Polygon 1",
    operation: "reveal",
    kind: "polygon",
    points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }],
    visibleInGm: true,
    visibleInPlayer: true,
    visible: true
  });
});

it("brush fog helpers avoid redundant points and tiny movements", () => {
  const points = [{ x: 0, y: 0 }];
  expect(normalizeBrushPoints(points, { x: 0.5, y: 0.5 })).toBe(points);
  expect(normalizeBrushPoints(points, { x: 2, y: 0 })).toEqual([...points, { x: 2, y: 0 }]);
  expect(shouldAddBrushPoint(undefined, { x: 0, y: 0 }, 20)).toBe(true);
  expect(shouldAddBrushPoint({ x: 0, y: 0 }, { x: 4, y: 0 }, 20)).toBe(false);
  expect(shouldAddBrushPoint({ x: 0, y: 0 }, { x: 8, y: 0 }, 20)).toBe(true);
});

it("updates fog drag previews and constrains rectangles when requested", () => {
  expect(
    getUpdatedFogDrag(
      {
        pointerId: 1,
        kind: "rectangle",
        start: { x: 0, y: 0 },
        current: { x: 10, y: 10 },
        points: [{ x: 0, y: 0 }],
        operation: "hide"
      },
      { x: 20, y: 5 },
      true
    ).current
  ).toEqual({ x: 20, y: 20 });

  expect(
    getUpdatedFogDrag(
      {
        pointerId: 1,
        kind: "circle",
        start: { x: 0, y: 0 },
        current: { x: 10, y: 10 },
        points: [{ x: 0, y: 0 }],
        operation: "reveal"
      },
      { x: 20, y: 5 },
      true
    ).current
  ).toEqual({ x: 20, y: 5 });
});

it("updates fog brush drag previews when movement exceeds brush spacing", () => {
  const drag = {
    pointerId: 1,
    kind: "brush" as const,
    start: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    points: [{ x: 0, y: 0 }],
    radius: 10,
    operation: "reveal" as const
  };

  expect(getUpdatedFogDrag(drag, { x: 1, y: 0 }, false).points).toEqual([{ x: 0, y: 0 }]);
  expect(getUpdatedFogDrag(drag, { x: 5, y: 0 }, false).points).toEqual([{ x: 0, y: 0 }, { x: 5, y: 0 }]);
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
  expect(
    isMeaningfulFogDrag({
      pointerId: 1,
      kind: "circle",
      start: { x: 0, y: 0 },
      current: { x: 2, y: 0 },
      points: [],
      operation: "reveal"
    })
  ).toBe(false);
  expect(
    isMeaningfulFogDrag({
      pointerId: 1,
      kind: "circle",
      start: { x: 0, y: 0 },
      current: { x: 6, y: 0 },
      points: [],
      operation: "reveal"
    })
  ).toBe(true);
});
});
