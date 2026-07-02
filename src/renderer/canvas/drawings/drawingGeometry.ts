import type { Point } from "../../../shared/localvtt";

export function getConeTriangle(points: Point[]): [Point, Point, Point] | null {
  if (points.length < 2) {
    return null;
  }
  const [start, end] = points;
  const distance = distanceBetweenPoints(start, end);
  if (distance <= 0) {
    return null;
  }
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const perpendicularAngle = angle + Math.PI / 2;
  const halfWidth = distance / 2;
  return [
    start,
    {
      x: end.x + Math.cos(perpendicularAngle) * halfWidth,
      y: end.y + Math.sin(perpendicularAngle) * halfWidth
    },
    {
      x: end.x - Math.cos(perpendicularAngle) * halfWidth,
      y: end.y - Math.sin(perpendicularAngle) * halfWidth
    }
  ];
}

export function getTriangle(points: Point[]): [Point, Point, Point] | null {
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

export function isPointInTriangle(point: Point, a: Point, b: Point, c: Point): boolean {
  const area = triangleArea(a, b, c);
  const area1 = triangleArea(point, b, c);
  const area2 = triangleArea(a, point, c);
  const area3 = triangleArea(a, b, point);
  return Math.abs(area - (area1 + area2 + area3)) <= 0.5;
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
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

export function distanceToSegment(point: Point, start: Point, end: Point): number {
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

export function distanceBetweenPoints(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
}
