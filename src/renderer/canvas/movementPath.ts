import type { Point } from "../../shared/localvtt";

export const MOVEMENT_PATH_COLORS = {
  start: "#f6d365",
  waypoint: "#d7deea",
  target: "#7aa2f7",
  shadow: "rgb(4 8 14 / 0.82)",
  stroke: "rgb(255 255 255 / 0.95)"
} as const;

export function normalizeMovementPath(points: Point[], minimumDistance = 2): Point[] {
  return points.reduce<Point[]>((path, point) => {
    const previous = path[path.length - 1];
    return previous && getPathSegmentDistance(previous, point) <= minimumDistance ? path : [...path, point];
  }, []);
}

export function hasMeaningfulPath(points: Point[], minimumDistance = 2): boolean {
  return points.some((point, index) => {
    const previous = points[index - 1];
    return previous ? getPathSegmentDistance(previous, point) >= minimumDistance : false;
  });
}

export function getPathDistance(points: Point[]): number {
  return points.reduce((total, point, index) => {
    const previous = points[index - 1];
    return previous ? total + getPathSegmentDistance(previous, point) : total;
  }, 0);
}

export function getPointAlongPath(points: Point[], distance: number): Point {
  let remainingDistance = distance;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentDistance = getPathSegmentDistance(start, end);
    if (segmentDistance === 0) {
      continue;
    }
    if (remainingDistance <= segmentDistance) {
      const progress = remainingDistance / segmentDistance;
      return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress
      };
    }
    remainingDistance -= segmentDistance;
  }
  return points[points.length - 1];
}

export function getPathMidpoint(points: Point[]): Point {
  return getPointAlongPath(points, getPathDistance(points) / 2);
}

export function removeLastWaypoint<TPath extends { waypoints: Point[] }>(path: TPath): TPath | null {
  if (path.waypoints.length === 0) {
    return null;
  }
  return {
    ...path,
    waypoints: path.waypoints.slice(0, -1)
  };
}

export function drawDashedMovementPath(ctx: CanvasRenderingContext2D, points: Point[], scale = 1) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([18 * scale, 11 * scale]);
  ctx.lineWidth = 8 * scale;
  ctx.strokeStyle = MOVEMENT_PATH_COLORS.shadow;
  traceCanvasPath(ctx, points);

  ctx.lineWidth = 5 * scale;
  ctx.strokeStyle = MOVEMENT_PATH_COLORS.stroke;
  traceCanvasPath(ctx, points);
  ctx.restore();
}

export function drawPathMarker(ctx: CanvasRenderingContext2D, point: Point, color: string, scale = 1, emphasis: "normal" | "small" = "normal") {
  const radius = (emphasis === "small" ? 4 : 6) * scale;
  ctx.save();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = MOVEMENT_PATH_COLORS.shadow;
  ctx.lineWidth = 2 * scale;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function traceCanvasPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function getPathSegmentDistance(start: Point, end: Point): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}
