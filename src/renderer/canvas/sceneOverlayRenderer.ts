import type { Point, Scene } from "../../shared/localvtt";
import type { Camera } from "./camera";
import {
  getDrawingResizeHandles,
  getDrawingRotationHandle,
  getSelectedResizableDrawingBounds
} from "./drawingTransform";
import type { MapCalibrationBox } from "./mapCalibrationGeometry";
import { pointsToSelectionRect } from "./selectionGeometry";

export type SelectionMarqueeDrag = {
  start: Point;
  current: Point;
};

export function drawSnapMarker(ctx: CanvasRenderingContext2D, point: Point, camera: Camera, operation: "reveal" | "hide") {
  const screenX = point.x * camera.zoom + camera.x;
  const screenY = point.y * camera.zoom + camera.y;

  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = operation === "reveal" ? "#a7f3c5" : "#ffd2d2";
  ctx.strokeStyle = "#0b1118";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBrushHoverPreview(ctx: CanvasRenderingContext2D, point: Point, radius: number, camera: Camera, operation: "reveal" | "hide") {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = operation === "reveal" ? "#8ee6a8" : "#ff9b9b";
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawDrawingBrushHoverPreview(ctx: CanvasRenderingContext2D, point: Point, radius: number, camera: Camera, color: string, opacity: number) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.globalAlpha = Math.max(0.35, Math.min(1, opacity));
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawSelectionMarquee(ctx: CanvasRenderingContext2D, drag: SelectionMarqueeDrag, camera: Camera) {
  const rect = pointsToSelectionRect(drag.start, drag.current);
  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const x = rect.x * camera.zoom + camera.x;
  const y = rect.y * camera.zoom + camera.y;
  const width = rect.width * camera.zoom;
  const height = rect.height * camera.zoom;
  ctx.fillStyle = "rgb(122 162 247 / 0.14)";
  ctx.strokeStyle = "#7aa2f7";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 5]);
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

export function drawDrawingResizeHandles(ctx: CanvasRenderingContext2D, drawings: Scene["drawings"], selectedDrawingIds: string[], camera: Camera) {
  const bounds = getSelectedResizableDrawingBounds(drawings, selectedDrawingIds);
  if (!bounds) {
    return;
  }
  const handles = getDrawingResizeHandles(bounds);
  const rotationHandle = getDrawingRotationHandle(bounds, camera);
  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const centerX = ((bounds.left + bounds.right) / 2) * camera.zoom + camera.x;
  const topY = bounds.top * camera.zoom + camera.y;
  const rotationX = rotationHandle.x * camera.zoom + camera.x;
  const rotationY = rotationHandle.y * camera.zoom + camera.y;
  ctx.strokeStyle = "#f6d365";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX, topY);
  ctx.lineTo(rotationX, rotationY);
  ctx.stroke();
  ctx.fillStyle = "#f6d365";
  ctx.strokeStyle = "#05070a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(rotationX, rotationY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (const handle of handles) {
    const x = handle.point.x * camera.zoom + camera.x;
    const y = handle.point.y * camera.zoom + camera.y;
    ctx.beginPath();
    ctx.rect(x - 4, y - 4, 8, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMapCalibrationBox(ctx: CanvasRenderingContext2D, box: MapCalibrationBox | null, camera: Camera) {
  if (!box) {
    return;
  }
  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const x = box.x * camera.zoom + camera.x;
  const y = box.y * camera.zoom + camera.y;
  const width = box.width * camera.zoom;
  const height = box.height * camera.zoom;
  ctx.fillStyle = "rgb(246 195 67 / 0.16)";
  ctx.strokeStyle = "#f6c343";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y + height);
  ctx.moveTo(x + width, y);
  ctx.lineTo(x, y + height);
  ctx.stroke();
  ctx.fillStyle = "#f6d98a";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillText(`${Math.round(box.width)} x ${Math.round(box.height)}px`, x + 8, y - 8);
  ctx.fillStyle = "#0b1118";
  ctx.strokeStyle = "#f6d98a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x + width - 7, y + height - 7, 14, 14);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
