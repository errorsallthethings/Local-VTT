import type { FogShape, Point, Scene } from "../../shared/localvtt";
import type { Camera } from "./camera";
import { drawSelectionBox } from "./selectionRenderer";

export type FogTool =
  | "reveal-rectangle"
  | "hide-rectangle"
  | "reveal-brush"
  | "hide-brush"
  | "reveal-polygon"
  | "hide-polygon"
  | "reveal-circle"
  | "hide-circle";

export interface FogDrag {
  pointerId: number;
  kind: "rectangle" | "brush" | "circle";
  start: Point;
  current: Point;
  points: Point[];
  radius?: number;
  operation: FogShape["operation"];
}

export interface FogPolygonDraft {
  operation: FogShape["operation"];
  points: Point[];
  current?: Point;
}

export function drawFog(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  camera: Camera,
  mode: "gm" | "player",
  preview: FogDrag | null,
  polygonDraft: FogPolygonDraft | null = null,
  selectedShapeId: string | string[] | null = null
) {
  const fog = scene.fog;
  const opacity = mode === "gm" ? fog.gmOpacity : fog.playerOpacity;
  const shapes = [
    ...fog.shapes.filter((shape) => (mode === "gm" ? shape.visibleInGm ?? shape.visible ?? true : shape.visibleInPlayer ?? shape.visible ?? true)),
    ...getPreviewFogShapes(preview, polygonDraft)
  ];

  const fogCanvas = document.createElement("canvas");
  fogCanvas.width = Math.max(1, Math.ceil(viewportWidth));
  fogCanvas.height = Math.max(1, Math.ceil(viewportHeight));
  const fogCtx = fogCanvas.getContext("2d");
  if (!fogCtx) {
    return;
  }

  fogCtx.save();
  fogCtx.setTransform(camera.zoom, 0, 0, camera.zoom, camera.x, camera.y);
  fogCtx.globalAlpha = opacity;
  fogCtx.fillStyle = fog.color;

  if (fog.mode === "hidden" || fog.mode === "partial") {
    const left = -camera.x / camera.zoom;
    const top = -camera.y / camera.zoom;
    const width = viewportWidth / camera.zoom;
    const height = viewportHeight / camera.zoom;
    fogCtx.fillRect(left, top, width, height);
  }

  for (const shape of shapes) {
    fogCtx.globalCompositeOperation = shape.operation === "reveal" ? "destination-out" : "source-over";
    fogCtx.globalAlpha = shape.operation === "reveal" ? 1 : opacity;
    fogCtx.fillStyle = fog.color;
    fogCtx.strokeStyle = fog.color;
    fillFogShape(fogCtx, shape);
  }

  fogCtx.restore();

  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(fogCanvas, 0, 0);
  ctx.restore();

  if (mode === "gm" && preview) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    drawFogPreviewOutline(ctx, preview);
    ctx.restore();
  }
  if (mode === "gm" && polygonDraft) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    drawPolygonDraftOutline(ctx, polygonDraft);
    ctx.restore();
  }
  if (mode === "gm") {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    for (const shape of fog.shapes.filter((shape) => shape.visibleInGm ?? shape.visible ?? true)) {
      drawPersistedFogShapeOutline(ctx, shape, camera.zoom);
    }
    ctx.restore();
  }
  if (mode === "gm" && selectedShapeId) {
    const selectedShapeIds = new Set(Array.isArray(selectedShapeId) ? selectedShapeId : [selectedShapeId]);
    for (const selectedShape of fog.shapes.filter((shape) => selectedShapeIds.has(shape.id) && (shape.visibleInGm ?? shape.visible ?? true))) {
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);
      drawFogShapeSelection(ctx, selectedShape, camera.zoom);
      ctx.restore();
    }
  }
}

function drawPersistedFogShapeOutline(ctx: CanvasRenderingContext2D, shape: FogShape, zoom: number) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = shape.operation === "reveal" ? "#8ee6a8" : "#ff9b9b";
  ctx.globalAlpha = 0.82;
  ctx.lineWidth = Math.max(1.5, 2 / Math.max(0.1, zoom));
  ctx.setLineDash([8 / Math.max(0.1, zoom), 5 / Math.max(0.1, zoom)]);
  traceFogShapePath(ctx, shape);
  ctx.stroke();
  ctx.restore();
}

export function isMeaningfulFogDrag(drag: FogDrag): boolean {
  if (drag.kind === "brush") {
    return drag.points.length > 1 || distanceBetween(drag.start, drag.current) > 1;
  }
  if (drag.kind === "circle") {
    return distanceBetween(drag.start, drag.current) >= 4;
  }
  return Math.abs(drag.current.x - drag.start.x) >= 4 && Math.abs(drag.current.y - drag.start.y) >= 4;
}

export function normalizeBrushPoints(points: Point[], current: Point): Point[] {
  const last = points[points.length - 1];
  return last && distanceBetween(last, current) <= 1 ? points : [...points, current];
}

export function shouldAddBrushPoint(previous: Point | undefined, point: Point, radius: number): boolean {
  return !previous || distanceBetween(previous, point) >= Math.max(2, radius * 0.35);
}

export function isPolygonTool(tool: FogTool | null): boolean {
  return tool === "reveal-polygon" || tool === "hide-polygon";
}

export function getFogOperationForTool(tool: FogTool): FogShape["operation"] {
  return tool.startsWith("reveal") ? "reveal" : "hide";
}

export function getFogDragKindForTool(tool: FogTool): FogDrag["kind"] {
  if (tool.includes("brush")) {
    return "brush";
  }
  if (tool.includes("circle")) {
    return "circle";
  }
  return "rectangle";
}

export function isMeaningfulPolygon(points: Point[]): boolean {
  return points.length >= 3;
}

export function getFogVisibilityPatchForNewShape(fog: Scene["fog"], operation: FogShape["operation"]): Partial<Scene["fog"]> {
  return operation === "hide" && fog.gmOpacity === 0 && fog.playerOpacity === 0
    ? { gmOpacity: 0.5, playerOpacity: 1, opacity: 1 }
    : {};
}

export function getFogShapeFromDrag(drag: FogDrag, id: string, name: string, visibleInPlayer: boolean): FogShape {
  return {
    id,
    name,
    operation: drag.operation,
    kind: drag.kind,
    points: drag.kind === "brush" ? normalizeBrushPoints(drag.points, drag.current) : [drag.start, drag.current],
    radius: drag.kind === "circle" ? distanceBetween(drag.start, drag.current) : drag.radius,
    visibleInGm: true,
    visibleInPlayer,
    visible: true
  };
}

export function getFogShapeFromPolygonDraft(draft: FogPolygonDraft, id: string, name: string, visibleInPlayer: boolean): FogShape {
  return {
    id,
    name,
    operation: draft.operation,
    kind: "polygon",
    points: draft.points,
    visibleInGm: true,
    visibleInPlayer,
    visible: true
  };
}

function getPreviewFogShapes(preview: FogDrag | null, polygonDraft: FogPolygonDraft | null): FogShape[] {
  const shapes: FogShape[] = [];
  if (preview) {
    shapes.push({
      id: "preview",
      operation: preview.operation,
      kind: preview.kind,
      points: preview.kind === "brush" ? normalizeBrushPoints(preview.points, preview.current) : [preview.start, preview.current],
      radius: preview.kind === "circle" ? distanceBetween(preview.start, preview.current) : preview.radius
    });
  }
  if (polygonDraft && polygonDraft.current && polygonDraft.points.length >= 2) {
    shapes.push({
      id: "polygon-preview",
      operation: polygonDraft.operation,
      kind: "polygon",
      points: [...polygonDraft.points, polygonDraft.current]
    });
  }
  return shapes;
}

function fillFogShape(ctx: CanvasRenderingContext2D, shape: FogShape) {
  if (shape.kind === "brush" && shape.points.length >= 1) {
    traceBrushStroke(ctx, shape.points, Math.max(1, shape.radius ?? 24));
    return;
  }

  if (shape.kind === "rectangle" && shape.points.length >= 2) {
    const rect = pointsToRect(shape.points[0], shape.points[1]);
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    return;
  }

  if (shape.kind === "polygon" && shape.points.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (const point of shape.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (shape.kind === "circle" && shape.points[0] && shape.radius) {
    ctx.beginPath();
    ctx.arc(shape.points[0].x, shape.points[0].y, shape.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function traceFogShapePath(ctx: CanvasRenderingContext2D, shape: FogShape) {
  if (shape.kind === "brush" && shape.points.length >= 1) {
    traceBrushStroke(ctx, shape.points, Math.max(1, shape.radius ?? 24));
    return;
  }
  if (shape.kind === "rectangle" && shape.points.length >= 2) {
    const rect = pointsToRect(shape.points[0], shape.points[1]);
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    return;
  }
  if (shape.kind === "polygon" && shape.points.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (const point of shape.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    return;
  }
  if (shape.kind === "circle" && shape.points[0] && shape.radius) {
    ctx.beginPath();
    ctx.arc(shape.points[0].x, shape.points[0].y, shape.radius, 0, Math.PI * 2);
  }
}

function drawFogPreviewOutline(ctx: CanvasRenderingContext2D, preview: FogDrag) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = preview.operation === "reveal" ? "#8ee6a8" : "#ff9b9b";
  ctx.setLineDash([8, 5]);
  if (preview.kind === "brush") {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(preview.current.x, preview.current.y, Math.max(1, preview.radius ?? 24), 0, Math.PI * 2);
    ctx.stroke();
  } else if (preview.kind === "circle") {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(preview.start.x, preview.start.y, distanceBetween(preview.start, preview.current), 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const rect = pointsToRect(preview.start, preview.current);
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }
  ctx.restore();
}

function drawPolygonDraftOutline(ctx: CanvasRenderingContext2D, draft: FogPolygonDraft) {
  if (draft.points.length === 0) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = draft.operation === "reveal" ? "#8ee6a8" : "#ff9b9b";
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(draft.points[0].x, draft.points[0].y);
  for (const point of draft.points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  if (draft.current) {
    ctx.lineTo(draft.current.x, draft.current.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  for (const point of draft.points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0b1118";
    ctx.stroke();
  }
  ctx.restore();
}

function drawFogShapeSelection(ctx: CanvasRenderingContext2D, shape: FogShape, zoom: number) {
  const bounds = getFogShapeBounds(shape);
  if (!bounds) {
    return;
  }

  const padding = Math.max(8, (shape.kind === "brush" ? shape.radius ?? 24 : 0) + 8);
  drawSelectionBox(ctx, bounds, zoom, padding);
}

function getFogShapeBounds(shape: FogShape) {
  if (shape.kind === "rectangle" && shape.points.length >= 2) {
    return pointsToRect(shape.points[0], shape.points[1]);
  }
  if (shape.kind === "circle" && shape.points[0] && shape.radius) {
    return {
      x: shape.points[0].x - shape.radius,
      y: shape.points[0].y - shape.radius,
      width: shape.radius * 2,
      height: shape.radius * 2
    };
  }
  if (shape.points.length === 0) {
    return null;
  }
  const xs = shape.points.map((point) => point.x);
  const ys = shape.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

function traceBrushStroke(ctx: CanvasRenderingContext2D, points: Point[], radius: number) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = radius * 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function pointsToRect(start: Point, end: Point) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  };
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
