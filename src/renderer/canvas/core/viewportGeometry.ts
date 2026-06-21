import type { Point } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CanvasPointerLike = {
  currentTarget: Pick<HTMLElement, "getBoundingClientRect">;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;
};

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

export function eventToWorldPoint(event: CanvasPointerLike, camera: Camera): Point {
  return clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, camera);
}

export function isSnapModifier(event: Pick<CanvasPointerLike, "ctrlKey" | "metaKey">): boolean {
  return event.ctrlKey || event.metaKey;
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
