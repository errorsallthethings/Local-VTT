import type { DrawingElement, DrawingStrokeStyle, GridSettings, Point, Scene } from "../../shared/localvtt";
import { formatMeasurementDistance, getStraightLineMeasurementDistance } from "./measurement";
import { drawSelectionBox } from "./selectionRenderer";

export const DRAWING_POINT_MIN_DISTANCE = 3;

export type DrawingTool =
  | "freehand"
  | "line"
  | "rectangle"
  | "circle"
  | "triangle"
  | "polygon"
  | "template-line"
  | "template-rectangle"
  | "template-circle"
  | "template-cone";

export type DrawingPreview = {
  pointerId: number;
  kind: DrawingTool;
  points: Point[];
  current: Point;
  color: string;
  opacity: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeStyle?: DrawingStrokeStyle;
  measurementLabelVisible?: boolean;
  ellipse?: boolean;
};

export type DrawingPointOverrides = Map<string, Point[]>;

export function drawDrawings(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  mode: "gm" | "player",
  layerOpacity = 1,
  preview: DrawingPreview | null = null,
  zoom = 1,
  selectedDrawingId: string | string[] | null = null,
  drawingPointOverrides: DrawingPointOverrides | null = null,
  selectionPointOverrides: DrawingPointOverrides | null = drawingPointOverrides
) {
  if (layerOpacity <= 0) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const selectedDrawingIds = new Set(Array.isArray(selectedDrawingId) ? selectedDrawingId : selectedDrawingId ? [selectedDrawingId] : []);
  for (const drawing of scene.drawings) {
    if (!isDrawingVisible(drawing, mode)) {
      continue;
    }
    const overridePoints = mode === "gm" ? drawingPointOverrides?.get(drawing.id) : null;
    const renderDrawing = overridePoints ? { ...drawing, points: overridePoints } : drawing;
    drawDrawingElement(ctx, renderDrawing, scene, layerOpacity, zoom);
    if (mode === "gm" && selectedDrawingIds.has(drawing.id)) {
      const selectionOverridePoints = selectionPointOverrides?.get(drawing.id);
      drawDrawingSelection(ctx, selectionOverridePoints ? { ...drawing, points: selectionOverridePoints } : renderDrawing, zoom);
    }
  }
  if (preview) {
    drawDrawingElement(
      ctx,
      {
        id: "preview",
        name: "Preview",
        kind: preview.kind === "circle" && !preview.ellipse ? "circle" : getDrawingKindForTool(preview.kind),
        points: getDrawingPreviewPoints(preview),
        color: preview.color,
        opacity: preview.opacity,
        strokeColor: preview.strokeColor ?? preview.color,
        strokeOpacity: preview.strokeOpacity ?? preview.opacity,
        strokeWidth: preview.strokeWidth,
        fillColor: preview.fillColor ?? preview.color,
        fillOpacity: preview.fillOpacity ?? 0,
        strokeStyle: preview.strokeStyle ?? "solid",
        measurementLabelVisible: preview.measurementLabelVisible,
        visibleInGm: true,
        visibleInPlayer: true
      },
      scene,
      layerOpacity,
      zoom
    );
  }
  ctx.restore();
}

export function getDrawingPreviewPoints(preview: DrawingPreview): Point[] {
  if (preview.kind === "circle" && preview.ellipse && preview.points[0]) {
    const [center] = preview.points;
    return [
      center,
      { x: preview.current.x, y: center.y },
      { x: center.x, y: preview.current.y }
    ];
  }
  if (isTwoPointDrawingTool(preview.kind)) {
    return [preview.points[0], preview.current].filter(Boolean);
  }
  const lastPoint = preview.points[preview.points.length - 1];
  if (!lastPoint || distanceBetweenPoints(lastPoint, preview.current) < DRAWING_POINT_MIN_DISTANCE) {
    return preview.points;
  }
  return [...preview.points, preview.current];
}

export function isMeaningfulDrawingPreview(preview: DrawingPreview): boolean {
  const points = getDrawingPreviewPoints(preview);
  if (points.length < 2) {
    return false;
  }
  return getPathDistance(points) >= DRAWING_POINT_MIN_DISTANCE;
}

export function shouldAddDrawingPoint(previous: Point | undefined, current: Point): boolean {
  return !previous || distanceBetweenPoints(previous, current) >= DRAWING_POINT_MIN_DISTANCE;
}

function drawDrawingSelection(ctx: CanvasRenderingContext2D, drawing: DrawingElement, zoom: number) {
  const bounds = getDrawingBounds(drawing);
  if (!bounds) {
    return;
  }
  drawSelectionBox(
    ctx,
    { x: bounds.left, y: bounds.top, width: Math.max(1, bounds.right - bounds.left), height: Math.max(1, bounds.bottom - bounds.top) },
    zoom,
    10
  );
}

export function getDrawingAtPoint(drawings: DrawingElement[], point: Point, hitRadius = 8): DrawingElement | null {
  for (const drawing of [...drawings].reverse()) {
    if (!isDrawingVisible(drawing, "gm")) {
      continue;
    }
    if (isPointNearDrawing(drawing, point, hitRadius)) {
      return drawing;
    }
  }
  return null;
}

function drawDrawingElement(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scene: Scene, layerOpacity: number, zoom: number) {
  const points = drawing.points;
  if (points.length === 0) {
    return;
  }

  ctx.save();
  const strokeOpacity = drawing.strokeOpacity ?? drawing.opacity;
  ctx.globalAlpha = Math.max(0, Math.min(1, strokeOpacity * layerOpacity));
  ctx.strokeStyle = drawing.strokeColor ?? drawing.color;
  ctx.fillStyle = drawing.fillColor ?? drawing.fill ?? drawing.color;
  ctx.lineWidth = drawing.strokeWidth;
  if (drawing.measurementLabelVisible) {
    ctx.setLineDash([Math.max(8, drawing.strokeWidth * 1.8), Math.max(6, drawing.strokeWidth * 1.1)]);
    drawTemplateGridHighlights(ctx, drawing, scene.grid);
  } else {
    applyDrawingStrokeStyle(ctx, drawing.strokeStyle ?? "solid", drawing.strokeWidth);
  }

  if (drawing.kind === "line") {
    drawLine(ctx, points);
  } else if (drawing.kind === "rectangle") {
    drawRectangle(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "circle") {
    drawCircle(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "ellipse") {
    drawEllipse(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "triangle") {
    drawTriangle(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "polygon") {
    drawPolygonShape(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "cone") {
    drawCone(ctx, points, drawing, layerOpacity);
  } else {
    drawPath(ctx, points);
  }
  drawTemplateLabel(ctx, drawing, scene, zoom);
  ctx.restore();
}

function isPointNearDrawing(drawing: DrawingElement, point: Point, hitRadius: number): boolean {
  const points = drawing.points;
  if (points.length < 2) {
    return false;
  }
  if (drawing.kind === "circle") {
    const radius = distanceBetweenPoints(points[0], points[1]);
    return Math.abs(distanceBetweenPoints(points[0], point) - radius) <= hitRadius || distanceBetweenPoints(points[0], point) <= radius;
  }
  if (drawing.kind === "ellipse") {
    return isPointNearEllipse(drawing, point, hitRadius);
  }
  if (drawing.kind === "rectangle") {
    if (points.length >= 4) {
      return isPointInPolygon(point, points);
    }
    const minX = Math.min(points[0].x, points[1].x) - hitRadius;
    const maxX = Math.max(points[0].x, points[1].x) + hitRadius;
    const minY = Math.min(points[0].y, points[1].y) - hitRadius;
    const maxY = Math.max(points[0].y, points[1].y) + hitRadius;
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  if (drawing.kind === "triangle") {
    const triangle = getTriangle(points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  if (drawing.kind === "polygon") {
    return isPointInPolygon(point, points);
  }
  return points.some((candidate, index) => {
    const next = points[index + 1];
    return next ? distanceToSegment(point, candidate, next) <= hitRadius : false;
  });
}

function isPointNearEllipse(drawing: DrawingElement, point: Point, hitRadius: number): boolean {
  const [center, edge, axis] = drawing.points;
  if (!center || !edge) {
    return false;
  }
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const deltaX = point.x - center.x;
  const deltaY = point.y - center.y;
  const localX = deltaX * cos - deltaY * sin;
  const localY = deltaX * sin + deltaY * cos;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const normalizedX = localX / radiusX;
  const normalizedY = localY / radiusY;
  const normalizedDistance = normalizedX ** 2 + normalizedY ** 2;
  const tolerance = Math.max(hitRadius / radiusX, hitRadius / radiusY);
  return normalizedDistance <= 1 || Math.abs(normalizedDistance - 1) <= tolerance;
}

function drawLine(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.stroke();
}

function drawPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }
  tracePath(ctx, points);
  ctx.stroke();
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
}

function drawRectangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  if (points.length >= 4) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    fillCurrentTemplatePath(ctx, drawing, layerOpacity);
    ctx.stroke();
    return;
  }
  const [start, end] = points;
  fillTemplateShape(ctx, drawing, layerOpacity, () => {
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
  });
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
}

function drawCircle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const [start, end] = points;
  ctx.beginPath();
  ctx.arc(start.x, start.y, distanceBetweenPoints(start, end), 0, Math.PI * 2);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
  if (drawing.measurementLabelVisible) {
    drawCenterPoint(ctx, start, drawing);
    if (drawing.id === "preview") {
      drawDashedGuide(ctx, start, end, drawing);
    }
  }
}

function drawCone(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const triangle = getConeTriangle(points);
  if (!triangle) {
    return;
  }
  const [origin, left, right] = triangle;

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
  if (drawing.measurementLabelVisible) {
    const oppositeCenter = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
    drawDashedGuide(ctx, origin, oppositeCenter, drawing);
  }
}

function drawEllipse(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const [center, edge, axis] = points;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radiusX, radiusY, rotation, 0, Math.PI * 2);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

function drawTriangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  const triangle = getTriangle(points);
  if (!triangle) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(triangle[0].x, triangle[0].y);
  ctx.lineTo(triangle[1].x, triangle[1].y);
  ctx.lineTo(triangle[2].x, triangle[2].y);
  ctx.closePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

function drawPolygonShape(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 3) {
    drawPath(ctx, points);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

function fillTemplateShape(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number, tracePath: () => void) {
  ctx.beginPath();
  tracePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
}

function fillCurrentTemplatePath(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number) {
  if (drawing.measurementLabelVisible) {
    return;
  }
  const fillOpacity = drawing.fillOpacity ?? (drawing.fill ? drawing.opacity : 0);
  if (fillOpacity <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, fillOpacity * layerOpacity));
  ctx.fill();
  ctx.restore();
}

function drawCenterPoint(ctx: CanvasRenderingContext2D, point: Point, drawing: DrawingElement) {
  ctx.save();
  ctx.globalAlpha = Math.max(0.65, Math.min(1, drawing.opacity));
  ctx.fillStyle = drawing.strokeColor ?? drawing.color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, Math.max(3, drawing.strokeWidth * 0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDashedGuide(ctx: CanvasRenderingContext2D, start: Point, end: Point, drawing: DrawingElement) {
  ctx.save();
  ctx.globalAlpha = Math.max(0.55, Math.min(0.9, drawing.opacity));
  ctx.strokeStyle = drawing.strokeColor ?? drawing.color;
  ctx.lineWidth = Math.max(2, drawing.strokeWidth * 0.18);
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

function applyDrawingStrokeStyle(ctx: CanvasRenderingContext2D, style: DrawingStrokeStyle, strokeWidth: number) {
  if (style === "dashed") {
    ctx.setLineDash([Math.max(8, strokeWidth * 1.8), Math.max(6, strokeWidth * 1.1)]);
    return;
  }
  if (style === "dotted") {
    ctx.setLineDash([Math.max(1, strokeWidth * 0.12), Math.max(6, strokeWidth * 1.1)]);
    return;
  }
  if (style === "dash-dot") {
    ctx.setLineDash([Math.max(10, strokeWidth * 1.8), Math.max(5, strokeWidth * 0.8), Math.max(1, strokeWidth * 0.18), Math.max(5, strokeWidth * 0.8)]);
    return;
  }
  if (style === "sketch") {
    ctx.setLineDash([Math.max(12, strokeWidth * 2.1), Math.max(3, strokeWidth * 0.45), Math.max(4, strokeWidth * 0.7), Math.max(3, strokeWidth * 0.55)]);
    return;
  }
  ctx.setLineDash([]);
}

function getConeTriangle(points: Point[]): [Point, Point, Point] | null {
  if (points.length < 2) {
    return null;
  }
  const [start, end] = points;
  const distance = distanceBetweenPoints(start, end);
  if (distance <= 0) {
    return null;
  }
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const halfAngle = Math.PI / 6;
  return [
    start,
    {
      x: start.x + Math.cos(angle - halfAngle) * distance,
      y: start.y + Math.sin(angle - halfAngle) * distance
    },
    {
      x: start.x + Math.cos(angle + halfAngle) * distance,
      y: start.y + Math.sin(angle + halfAngle) * distance
    }
  ];
}

function getTriangle(points: Point[]): [Point, Point, Point] | null {
  if (points.length >= 3) {
    return [points[0], points[1], points[2]];
  }
  if (points.length < 2) {
    return null;
  }
  const [start, end] = points;
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return [
    start,
    end,
    {
      x: midpoint.x - dy * 0.866,
      y: midpoint.y + dx * 0.866
    }
  ];
}

function isPointInTriangle(point: Point, a: Point, b: Point, c: Point): boolean {
  const area = triangleArea(a, b, c);
  const area1 = triangleArea(point, b, c);
  const area2 = triangleArea(a, point, c);
  const area3 = triangleArea(a, b, point);
  return Math.abs(area - (area1 + area2 + area3)) <= 0.5;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    if ((current.y > point.y) !== (previous.y > point.y) && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x) {
      inside = !inside;
    }
  }
  return inside;
}

function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) {
    return distanceBetweenPoints(point, start);
  }
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared));
  return distanceBetweenPoints(point, {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y)
  });
}

function drawTemplateLabel(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scene: Scene, zoom: number) {
  if (drawing.measurementLabelVisible === false) {
    return;
  }
  if (drawing.kind !== "line" && drawing.kind !== "rectangle" && drawing.kind !== "circle" && drawing.kind !== "cone") {
    return;
  }
  if (drawing.points.length < 2) {
    return;
  }
  const label = getTemplateLabel(drawing, scene);
  if (!label) {
    return;
  }
  const { position, angle } = getTemplateLabelPosition(drawing);
  const scale = 1 / Math.max(0.1, zoom);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.font = `800 ${Math.round(18 * scale)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);
  ctx.lineWidth = Math.max(3, 5 * scale);
  ctx.strokeStyle = "rgba(11, 17, 24, 0.82)";
  ctx.strokeText(label, 0, scale);
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(label, 0, scale);
  ctx.restore();
}

function drawTemplateGridHighlights(ctx: CanvasRenderingContext2D, drawing: DrawingElement, grid: GridSettings) {
  if (grid.type === "gridless" || grid.sizePx <= 0 || drawing.points.length < 2) {
    return;
  }
  const cells = getTemplateGridHighlightCells(drawing, grid);
  if (cells.length === 0) {
    return;
  }
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgb(122 162 247 / 0.18)";
  ctx.strokeStyle = "rgb(255 255 255 / 0.34)";
  ctx.lineWidth = Math.max(1, grid.lineThickness);
  for (const center of cells) {
    if (grid.type === "hex") {
      tracePointyHex(ctx, center.x, center.y, Math.max(8, grid.sizePx / 2));
      ctx.fill();
      ctx.stroke();
    } else {
      const size = grid.sizePx;
      ctx.fillRect(center.x - size / 2, center.y - size / 2, size, size);
      ctx.strokeRect(center.x - size / 2, center.y - size / 2, size, size);
    }
  }
  ctx.restore();
}

function getTemplateGridHighlightCells(drawing: DrawingElement, grid: GridSettings): Point[] {
  const bounds = getDrawingBounds(drawing);
  if (!bounds) {
    return [];
  }
  const size = grid.sizePx;
  const columns = {
    start: Math.floor((bounds.left - grid.offsetX) / size) - 1,
    end: Math.ceil((bounds.right - grid.offsetX) / size) + 1
  };
  const rows = {
    start: Math.floor((bounds.top - grid.offsetY) / size) - 1,
    end: Math.ceil((bounds.bottom - grid.offsetY) / size) + 1
  };
  const cells: Point[] = [];
  const maxCells = 2000;
  for (let row = rows.start; row <= rows.end && cells.length < maxCells; row += 1) {
    for (let column = columns.start; column <= columns.end && cells.length < maxCells; column += 1) {
      const center = { x: grid.offsetX + column * size + size / 2, y: grid.offsetY + row * size + size / 2 };
      if (isPointInsideTemplate(center, drawing, Math.max(8, size * 0.42))) {
        cells.push(center);
      }
    }
  }
  return cells;
}

export function getDrawingBounds(drawing: DrawingElement): { left: number; top: number; right: number; bottom: number } | null {
  const points = getShapePoints(drawing);
  if (points.length === 0) {
    return null;
  }
  if (drawing.kind === "circle" && drawing.points[0] && drawing.points[1]) {
    const radiusX = distanceBetweenPoints(drawing.points[0], drawing.points[1]);
    const radiusY = radiusX;
    return {
      left: drawing.points[0].x - radiusX,
      top: drawing.points[0].y - radiusY,
      right: drawing.points[0].x + radiusX,
      bottom: drawing.points[0].y + radiusY
    };
  }
  return {
    left: Math.min(...points.map((point) => point.x)),
    top: Math.min(...points.map((point) => point.y)),
    right: Math.max(...points.map((point) => point.x)),
    bottom: Math.max(...points.map((point) => point.y))
  };
}

function getShapePoints(drawing: DrawingElement): Point[] {
  if (drawing.kind === "ellipse" && drawing.points[0] && drawing.points[1]) {
    return getEllipseBoundsPoints(drawing.points);
  }
  if (drawing.kind === "cone") {
    return getConeTriangle(drawing.points) ?? drawing.points;
  }
  if (drawing.kind === "triangle") {
    return getTriangle(drawing.points) ?? drawing.points;
  }
  return drawing.points;
}

function getEllipseBoundsPoints(points: Point[]): Point[] {
  const [center, edge, axis] = points;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const samples: Point[] = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = (Math.PI * 2 * index) / 16;
    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;
    samples.push({
      x: center.x + x * cos - y * sin,
      y: center.y + x * sin + y * cos
    });
  }
  return samples;
}

function isPointInsideTemplate(point: Point, drawing: DrawingElement, hitRadius: number): boolean {
  if (drawing.kind === "line") {
    return drawing.points[0] && drawing.points[1] ? distanceToSegment(point, drawing.points[0], drawing.points[1]) <= hitRadius : false;
  }
  if (drawing.kind === "circle") {
    const [center, edge] = drawing.points;
    return center && edge ? distanceBetweenPoints(center, point) <= distanceBetweenPoints(center, edge) : false;
  }
  if (drawing.kind === "rectangle") {
    const [start, end] = drawing.points;
    if (!start || !end) {
      return false;
    }
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  return false;
}

function tracePointyHex(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    const point = {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    };
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.closePath();
}

function getTemplateLabel(drawing: DrawingElement, scene: Scene): string | null {
  const [start, end] = drawing.points;
  if (!start || !end) {
    return null;
  }
  const distance = getStraightLineMeasurementDistance(start, end, scene.grid);
  if (drawing.kind === "rectangle") {
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} square`;
  }
  if (drawing.kind === "circle") {
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} radius`;
  }
  if (drawing.kind === "cone") {
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} cone`;
  }
  return formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type);
}

function getTemplateLabelPosition(drawing: DrawingElement): { position: Point; angle: number } {
  const [start, end] = drawing.points;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  if (drawing.kind === "circle") {
    return {
      position: {
        x: start.x,
        y: start.y - 18
      },
      angle: 0
    };
  }
  if (drawing.kind === "rectangle") {
    return {
      position: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      },
      angle: 0
    };
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    if (triangle) {
      const oppositeCenter = {
        x: (triangle[1].x + triangle[2].x) / 2,
        y: (triangle[1].y + triangle[2].y) / 2
      };
      return {
        position: {
          x: (triangle[0].x + oppositeCenter.x) / 2,
          y: (triangle[0].y + oppositeCenter.y) / 2
        },
        angle
      };
    }
  }
  return {
    position: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    },
    angle
  };
}

function isDrawingVisible(drawing: DrawingElement, mode: "gm" | "player"): boolean {
  return mode === "gm" ? drawing.visibleInGm !== false : drawing.visibleInPlayer !== false;
}

function getPathDistance(points: Point[]): number {
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    distance += distanceBetweenPoints(points[index - 1], points[index]);
  }
  return distance;
}

function distanceBetweenPoints(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isTwoPointDrawingTool(tool: DrawingTool): boolean {
  return tool !== "freehand" && tool !== "polygon";
}

function getDrawingKindForTool(tool: DrawingTool): DrawingElement["kind"] {
  if (tool === "template-line") {
    return "line";
  }
  if (tool === "template-rectangle") {
    return "rectangle";
  }
  if (tool === "template-circle") {
    return "circle";
  }
  if (tool === "template-cone") {
    return "cone";
  }
  if (tool === "circle") {
    return "ellipse";
  }
  return tool;
}
