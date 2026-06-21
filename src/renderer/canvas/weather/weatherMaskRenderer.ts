import type { WeatherMask } from "../../../shared/localvtt";
import { getWeatherMaskBounds } from "../scene/boundsGeometry";
import type { Camera } from "../core/camera";
import { drawSelectionBox } from "../selection/selectionRenderer";
import { distanceBetween } from "../tokens/tokenGeometry";
import {
  getVisibleWeatherMasks,
  getWeatherMaskDragRect,
  getWeatherMaskRect,
  type WeatherMaskDrag,
  type WeatherPolygonDraft
} from "./weatherMaskGeometry";

export function drawWeatherMaskPreview(ctx: CanvasRenderingContext2D, preview: WeatherMaskDrag, camera: Camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.strokeStyle = "#8bc6ff";
  ctx.fillStyle = "rgb(139 198 255 / 0.12)";
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
  if (preview.kind === "circle") {
    ctx.beginPath();
    ctx.arc(preview.start.x, preview.start.y, distanceBetween(preview.start, preview.current), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const { x, y, width, height } = getWeatherMaskDragRect(preview);
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  }
  ctx.restore();
}

export function drawWeatherPolygonDraft(ctx: CanvasRenderingContext2D, draft: WeatherPolygonDraft, camera: Camera) {
  if (draft.points.length === 0) {
    return;
  }

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.strokeStyle = "#8bc6ff";
  ctx.fillStyle = "#8bc6ff";
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
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
    ctx.arc(point.x, point.y, 8 / camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1, 2 / camera.zoom);
    ctx.strokeStyle = "#0b1118";
    ctx.stroke();
  }
  ctx.restore();
}

export function drawWeatherMaskSelection(ctx: CanvasRenderingContext2D, mask: WeatherMask, camera: Camera) {
  const bounds = getWeatherMaskBounds(mask);
  if (!bounds) {
    return;
  }
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  drawSelectionBox(ctx, bounds, camera.zoom, 10);
  ctx.restore();
}

export function drawWeatherMaskOutlines(ctx: CanvasRenderingContext2D, masks: WeatherMask[], camera: Camera) {
  for (const mask of getVisibleWeatherMasks(masks)) {
    drawWeatherMaskShape(ctx, mask, camera, { fill: false, selected: false });
  }
}

export function drawWeatherMaskShape(ctx: CanvasRenderingContext2D, mask: WeatherMask, camera: Camera, options: { fill: boolean; selected: boolean }) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.globalAlpha = options.selected ? 1 : 0.78;
  if (options.selected) {
    const bounds = getWeatherMaskBounds(mask);
    if (bounds) {
      drawSelectionBox(ctx, bounds, camera.zoom, 10);
    }
    ctx.restore();
    return;
  } else {
    ctx.strokeStyle = "#8bc6ff";
    ctx.fillStyle = options.fill ? "rgb(139 198 255 / 0.16)" : "transparent";
    ctx.lineWidth = Math.max(1.75, 2 / camera.zoom);
    ctx.setLineDash([9 / camera.zoom, 5 / camera.zoom]);
  }
  if (mask.kind === "circle" && mask.points[0] && mask.radius) {
    ctx.beginPath();
    ctx.arc(mask.points[0].x, mask.points[0].y, mask.radius, 0, Math.PI * 2);
    if (options.fill || options.selected) {
      ctx.fill();
    }
    ctx.stroke();
  } else if (mask.kind === "rectangle" && mask.points.length >= 2) {
    const rect = getWeatherMaskRect(mask);
    if (!rect) {
      ctx.restore();
      return;
    }
    if (options.fill || options.selected) {
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (mask.kind === "polygon" && mask.points.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(mask.points[0].x, mask.points[0].y);
    for (const point of mask.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    if (options.fill || options.selected) {
      ctx.fill();
    }
    ctx.stroke();
  }
  ctx.restore();
}
