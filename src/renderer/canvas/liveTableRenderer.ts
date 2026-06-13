import type { LiveTableEvent, LiveTablePoint, Point } from "../../shared/localvtt";
import type { Camera } from "./camera";

export const PING_DURATION_MS = 1600;
export const LASER_POINT_LIFETIME_MS = 1100;
export const LASER_MIN_POINT_DISTANCE = 8;

export function getActiveLaserPoints(points: LiveTablePoint[], now: number): LiveTablePoint[] {
  return points.filter((point) => now - point.createdAt <= LASER_POINT_LIFETIME_MS);
}

export function hasActiveLiveTableEvents(events: LiveTableEvent[], now = Date.now()): boolean {
  return events.some((event) => {
    if (event.type === "ping") {
      return now - event.createdAt <= PING_DURATION_MS;
    }
    if (event.type === "laser") {
      return getActiveLaserPoints(event.points, now).length > 0;
    }
    return false;
  });
}

export function drawLiveTableEvents(ctx: CanvasRenderingContext2D, events: LiveTableEvent[], camera: Camera) {
  const now = Date.now();
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  for (const event of events) {
    if (event.type === "ping") {
      drawPing(ctx, event.point, Math.max(1, camera.zoom), Math.max(0, Math.min(1, (now - event.createdAt) / PING_DURATION_MS)), event.size, event.color);
    } else if (event.type === "laser") {
      drawLaserTrail(ctx, event.points, now, Math.max(1, camera.zoom));
    }
  }
  ctx.restore();
}

function drawPing(ctx: CanvasRenderingContext2D, point: Point, zoom: number, progress: number, size = 1, color = "#f6d365") {
  if (progress >= 1) {
    return;
  }
  const scale = Math.max(0.5, Math.min(3, size));
  const pingColor = hexToRgb(color) ?? { r: 246, g: 211, b: 101 };
  const baseRadius = (26 * scale) / zoom;
  const alpha = 1 - progress;
  const colorWithAlpha = (value: number) => `rgba(${pingColor.r}, ${pingColor.g}, ${pingColor.b}, ${value})`;

  ctx.save();
  ctx.shadowColor = colorWithAlpha(0.8 * alpha);
  ctx.shadowBlur = (18 * scale) / zoom;
  ctx.lineWidth = (8 * scale) / zoom;
  for (const offset of [0, 0.22, 0.44]) {
    const ringProgress = Math.max(0, Math.min(1, progress - offset));
    const ringAlpha = Math.max(0, 1 - ringProgress) * alpha;
    const rippleRadius = ((64 + ringProgress * 136) * scale) / zoom;
    ctx.strokeStyle = colorWithAlpha(0.95 * ringAlpha);
    ctx.beginPath();
    ctx.arc(point.x, point.y, rippleRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = colorWithAlpha(0.45 * alpha);
  ctx.beginPath();
  ctx.arc(point.x, point.y, baseRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(alpha);
  ctx.lineWidth = (5 * scale) / zoom;
  ctx.stroke();

  ctx.shadowBlur = (10 * scale) / zoom;
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.88 * alpha})`;
  ctx.lineWidth = (5 * scale) / zoom;
  ctx.beginPath();
  ctx.moveTo(point.x - (42 * scale) / zoom, point.y);
  ctx.lineTo(point.x + (42 * scale) / zoom, point.y);
  ctx.moveTo(point.x, point.y - (42 * scale) / zoom);
  ctx.lineTo(point.x, point.y + (42 * scale) / zoom);
  ctx.stroke();

  ctx.lineWidth = (3 * scale) / zoom;
  ctx.beginPath();
  ctx.arc(point.x, point.y, (11 * scale) / zoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function hexToRgb(value: string): { r: number; g: number; b: number } | null {
  const normalized = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!normalized) {
    return null;
  }
  const hex = normalized[1];
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16)
  };
}

function drawLaserTrail(ctx: CanvasRenderingContext2D, points: LiveTablePoint[], now: number, zoom: number) {
  const visiblePoints = getActiveLaserPoints(points, now);
  if (visiblePoints.length === 0) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let index = 1; index < visiblePoints.length; index += 1) {
    const previous = visiblePoints[index - 1];
    const current = visiblePoints[index];
    const age = now - current.createdAt;
    const alpha = Math.max(0, 1 - age / LASER_POINT_LIFETIME_MS);
    ctx.strokeStyle = `rgba(255, 82, 94, ${0.88 * alpha})`;
    ctx.lineWidth = Math.max(8 / zoom, (20 * alpha) / zoom);
    ctx.beginPath();
    ctx.moveTo(previous.point.x, previous.point.y);
    ctx.lineTo(current.point.x, current.point.y);
    ctx.stroke();
  }

  const newest = visiblePoints[visiblePoints.length - 1];
  const newestAlpha = Math.max(0, 1 - (now - newest.createdAt) / LASER_POINT_LIFETIME_MS);
  ctx.shadowColor = `rgba(255, 82, 94, ${0.9 * newestAlpha})`;
  ctx.shadowBlur = 12 / zoom;
  ctx.fillStyle = `rgba(255, 236, 238, ${0.95 * newestAlpha})`;
  ctx.strokeStyle = `rgba(255, 82, 94, ${0.9 * newestAlpha})`;
  ctx.lineWidth = 4 / zoom;
  ctx.beginPath();
  ctx.arc(newest.point.x, newest.point.y, 12 / zoom, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
