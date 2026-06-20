import type { Point } from "../../shared/localvtt";

const ENVIRONMENT_FEATHER_MASK_CACHE_LIMIT = 80;
const environmentFeatherMaskCache = new Map<string, HTMLCanvasElement>();

export function getEnvironmentFeatherAlpha(progress: number): number {
  return Math.pow(Math.max(0, Math.min(1, progress)), 1.85);
}

export function roundMaskValue(value: number): number {
  return Math.round(value * 10) / 10;
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const crossesY = current.y > point.y !== previous.y > point.y;
    if (crossesY) {
      const intersectionX = ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y || 1) + current.x;
      if (point.x < intersectionX) {
        inside = !inside;
      }
    }
  }
  return inside;
}

export function getDistanceToPolygonEdge(point: Point, polygon: Point[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    nearest = Math.min(nearest, getDistanceToSegment(point, start, end));
  }
  return nearest;
}

export function getDistanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
}

export function getEnvironmentFeatherMask(key: string, width: number, height: number, alphaAt: (x: number, y: number) => number): HTMLCanvasElement {
  const cached = environmentFeatherMaskCache.get(key);
  if (cached) {
    environmentFeatherMaskCache.delete(key);
    environmentFeatherMaskCache.set(key, cached);
    return cached;
  }
  const mask = createEnvironmentFeatherMask(width, height, alphaAt);
  environmentFeatherMaskCache.set(key, mask);
  while (environmentFeatherMaskCache.size > ENVIRONMENT_FEATHER_MASK_CACHE_LIMIT) {
    const oldestKey = environmentFeatherMaskCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    environmentFeatherMaskCache.delete(oldestKey);
  }
  return mask;
}

export function createEnvironmentFeatherMask(width: number, height: number, alphaAt: (x: number, y: number) => number): HTMLCanvasElement {
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const maskCtx = mask.getContext("2d");
  if (!maskCtx) {
    return mask;
  }
  const image = maskCtx.createImageData(width, height);
  for (let pixelY = 0; pixelY < height; pixelY += 1) {
    for (let pixelX = 0; pixelX < width; pixelX += 1) {
      const offset = (pixelY * width + pixelX) * 4;
      image.data[offset] = 0;
      image.data[offset + 1] = 0;
      image.data[offset + 2] = 0;
      image.data[offset + 3] = Math.round(alphaAt(pixelX + 0.5, pixelY + 0.5) * 255);
    }
  }
  maskCtx.putImageData(image, 0, 0);
  return mask;
}
