import type { DrawingElement, Point, Scene } from "../../shared/localvtt";

export const DRAWING_POINT_MIN_DISTANCE = 3;

export type DrawingTool = "freehand" | "line";

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
  preview: DrawingPreview | null = null
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
    drawDrawingElement(ctx, drawing, layerOpacity);
  }
  if (preview) {
    drawDrawingElement(
      ctx,
      {
        id: "preview",
        name: "Preview",
        kind: preview.kind,
        points: getDrawingPreviewPoints(preview),
        color: preview.color,
        opacity: preview.opacity,
        strokeWidth: preview.strokeWidth,
        visibleInGm: true,
        visibleInPlayer: true
      },
      layerOpacity
    );
  }
  ctx.restore();
}

export function getDrawingPreviewPoints(preview: DrawingPreview): Point[] {
  if (preview.kind === "line") {
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

function drawDrawingElement(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number) {
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
    drawRectangle(ctx, points);
  } else if (drawing.kind === "circle") {
    drawCircle(ctx, points);
  } else {
    drawPath(ctx, points);
  }
  ctx.restore();
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

function drawRectangle(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }
  const [start, end] = points;
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
}

function drawCircle(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }
  const [start, end] = points;
  ctx.beginPath();
  ctx.arc(start.x, start.y, distanceBetweenPoints(start, end), 0, Math.PI * 2);
  ctx.stroke();
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
