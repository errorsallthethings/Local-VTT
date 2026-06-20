import type { Point } from "../../shared/localvtt";
import type { Camera } from "./camera";

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function clientToWorldPoint(element: Pick<HTMLElement, "getBoundingClientRect">, clientX: number, clientY: number, camera: Camera): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: (clientX - rect.left - camera.x) / camera.zoom,
    y: (clientY - rect.top - camera.y) / camera.zoom
  };
}

export function getCanvasViewportCenter(element: Pick<HTMLElement, "getBoundingClientRect">, camera: Camera): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.width / 2 - camera.x) / camera.zoom,
    y: (rect.height / 2 - camera.y) / camera.zoom
  };
}

export function worldToScreenPoint(point: Point, camera: Camera): Point {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y
  };
}

export function worldRectToScreen(bounds: ScreenRect, camera: Camera): ScreenRect {
  const topLeft = worldToScreenPoint({ x: bounds.x, y: bounds.y }, camera);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bounds.width * camera.zoom,
    height: bounds.height * camera.zoom
  };
}
