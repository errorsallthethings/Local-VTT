import type { DrawingElement, Point, Scene } from "../../shared/localvtt";
import { formatMeasurementDistance, getStraightLineMeasurementDistance } from "./measurement";

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
  strokeWidth: number;
};

export function drawDrawings(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  mode: "gm" | "player",
  layerOpacity = 1,
  preview: DrawingPreview | null = null,
  zoom = 1,
  selectedDrawingId: string | null = null
) {
  if (layerOpacity <= 0) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const drawing of scene.drawings) {
    if (!isDrawingVisible(drawing, mode)) {
      continue;
    }
    if (mode === "gm" && drawing.id === selectedDrawingId) {
      drawDrawingSelection(ctx, drawing, zoom);
    }
    drawDrawingElement(ctx, drawing, scene, layerOpacity, zoom);
  }
  if (preview) {
    drawDrawingElement(
      ctx,
      {
        id: "preview",
        name: "Preview",
        kind: getDrawingKindForTool(preview.kind),
        points: getDrawingPreviewPoints(preview),
        color: preview.color,
        opacity: preview.opacity,
        strokeWidth: preview.strokeWidth,
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
  const points = drawing.points;
  if (points.length < 2) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = "#7aa2f7";
  ctx.lineWidth = Math.max(2, 3 / Math.max(0.1, zoom));
  ctx.setLineDash([8 / Math.max(0.1, zoom), 5 / Math.max(0.1, zoom)]);
  if (drawing.kind === "circle") {
    const [start, end] = points;
    ctx.beginPath();
    ctx.arc(start.x, start.y, distanceBetweenPoints(start, end), 0, Math.PI * 2);
    ctx.stroke();
  } else if (drawing.kind === "rectangle") {
    const [start, end] = points;
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (drawing.kind === "cone") {
    const triangle = getConeTriangle(points);
    if (triangle) {
      ctx.beginPath();
      ctx.moveTo(triangle[0].x, triangle[0].y);
      ctx.lineTo(triangle[1].x, triangle[1].y);
      ctx.lineTo(triangle[2].x, triangle[2].y);
      ctx.closePath();
      ctx.stroke();
    }
  } else {
    drawPath(ctx, points);
  }
  ctx.restore();
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
  ctx.globalAlpha = Math.max(0, Math.min(1, drawing.opacity * layerOpacity));
  ctx.strokeStyle = drawing.color;
  ctx.fillStyle = drawing.fill ?? drawing.color;
  ctx.lineWidth = drawing.strokeWidth;

  if (drawing.kind === "line") {
    drawLine(ctx, points);
  } else if (drawing.kind === "rectangle") {
    drawRectangle(ctx, points, drawing);
  } else if (drawing.kind === "circle") {
    drawCircle(ctx, points, drawing);
  } else if (drawing.kind === "triangle") {
    drawTriangle(ctx, points, drawing);
  } else if (drawing.kind === "polygon") {
    drawPolygonShape(ctx, points, drawing);
  } else if (drawing.kind === "cone") {
    drawCone(ctx, points, drawing);
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
  if (drawing.kind === "rectangle") {
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
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function drawRectangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement) {
  if (points.length < 2) {
    return;
  }
  const [start, end] = points;
  fillTemplateShape(ctx, drawing, () => {
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
  });
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
}

function drawCircle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement) {
  if (points.length < 2) {
    return;
  }
  const [start, end] = points;
  ctx.beginPath();
  ctx.arc(start.x, start.y, distanceBetweenPoints(start, end), 0, Math.PI * 2);
  fillCurrentTemplatePath(ctx, drawing);
  ctx.stroke();
}

function drawCone(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement) {
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
  fillCurrentTemplatePath(ctx, drawing);
  ctx.stroke();
}

function drawTriangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement) {
  const triangle = getTriangle(points);
  if (!triangle) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(triangle[0].x, triangle[0].y);
  ctx.lineTo(triangle[1].x, triangle[1].y);
  ctx.lineTo(triangle[2].x, triangle[2].y);
  ctx.closePath();
  fillCurrentTemplatePath(ctx, drawing);
  ctx.stroke();
}

function drawPolygonShape(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement) {
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
  fillCurrentTemplatePath(ctx, drawing);
  ctx.stroke();
}

function fillTemplateShape(ctx: CanvasRenderingContext2D, drawing: DrawingElement, tracePath: () => void) {
  ctx.beginPath();
  tracePath();
  fillCurrentTemplatePath(ctx, drawing);
}

function fillCurrentTemplatePath(ctx: CanvasRenderingContext2D, drawing: DrawingElement) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(0.22, drawing.opacity * 0.18));
  ctx.fill();
  ctx.restore();
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
  const position = getTemplateLabelPosition(drawing);
  const scale = 1 / Math.max(0.1, zoom);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.font = `${Math.round(13 * scale)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const metrics = ctx.measureText(label);
  const paddingX = 12 * scale;
  const width = metrics.width + paddingX * 2;
  const height = 36 * scale;
  ctx.fillStyle = "rgba(11, 17, 24, 0.88)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  traceRoundedRect(ctx, position.x - width / 2, position.y - height / 2, width, height, 8 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(label, position.x, position.y + scale);
  ctx.restore();
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

function getTemplateLabelPosition(drawing: DrawingElement): Point {
  const [start, end] = drawing.points;
  if (drawing.kind === "circle") {
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
  }
  if (drawing.kind === "rectangle") {
    return {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 16
    };
  }
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
}

function traceRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
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
  return tool;
}
