import type { Scene } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";

export function drawMapSource(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  sourceWidth = getSourceWidth(source),
  sourceHeight = getSourceHeight(source)
) {
  const transform = resolveMapTransform(scene, sourceWidth, sourceHeight, viewportWidth, viewportHeight);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  const scaleX = getMapScaleX(transform);
  const scaleY = getMapScaleY(transform);
  ctx.scale(scaleX, scaleY);
  ctx.beginPath();
  ctx.rect(0, 0, sourceWidth, sourceHeight);
  ctx.clip();
  const sourceRectWidth = getSourceWidth(source);
  const sourceRectHeight = getSourceHeight(source);
  ctx.drawImage(source, 0, 0, sourceRectWidth, sourceRectHeight, 0, 0, sourceWidth, sourceHeight);
  ctx.restore();
}

export function resolveMapTransform(scene: Scene, sourceWidth: number, sourceHeight: number, viewportWidth: number, viewportHeight: number) {
  const transform = scene.mapTransform;
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return transform;
  }
  void viewportWidth;
  void viewportHeight;
  return transform;
}

export function getCameraForMapFit(scene: Scene, sourceWidth: number, sourceHeight: number, viewportWidth: number, viewportHeight: number): Camera {
  if (sourceWidth <= 0 || sourceHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const transform = resolveMapTransform(scene, sourceWidth, sourceHeight, viewportWidth, viewportHeight);
  const rotation = (transform.rotation * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const corners = [
    { x: 0, y: 0 },
    { x: sourceWidth, y: 0 },
    { x: sourceWidth, y: sourceHeight },
    { x: 0, y: sourceHeight }
  ].map((corner) => {
    const scaledX = corner.x * getMapScaleX(transform);
    const scaledY = corner.y * getMapScaleY(transform);
    return {
      x: transform.x + scaledX * cos - scaledY * sin,
      y: transform.y + scaledX * sin + scaledY * cos
    };
  });

  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minY = Math.min(...corners.map((corner) => corner.y));
  const maxY = Math.max(...corners.map((corner) => corner.y));
  const mapWidth = Math.max(1, maxX - minX);
  const mapHeight = Math.max(1, maxY - minY);
  const padding = Math.min(48, Math.max(16, Math.min(viewportWidth, viewportHeight) * 0.04));
  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);
  const zoom = Math.min(6, Math.max(0.05, Math.min(availableWidth / mapWidth, availableHeight / mapHeight)));
  const centerX = minX + mapWidth / 2;
  const centerY = minY + mapHeight / 2;

  return {
    x: viewportWidth / 2 - centerX * zoom,
    y: viewportHeight / 2 - centerY * zoom,
    zoom
  };
}

export function getMapScaleX(transform: Scene["mapTransform"]): number {
  return Number.isFinite(transform.scaleX) ? transform.scaleX : transform.scale;
}

export function getMapScaleY(transform: Scene["mapTransform"]): number {
  return Number.isFinite(transform.scaleY) ? transform.scaleY : transform.scale;
}

export function getSourceWidth(source: CanvasImageSource): number {
  if ("naturalWidth" in source) {
    return source.naturalWidth;
  }
  if ("videoWidth" in source) {
    return source.videoWidth;
  }
  return "width" in source && typeof source.width === "number" ? source.width : 0;
}

export function getSourceHeight(source: CanvasImageSource): number {
  if ("naturalHeight" in source) {
    return source.naturalHeight;
  }
  if ("videoHeight" in source) {
    return source.videoHeight;
  }
  return "height" in source && typeof source.height === "number" ? source.height : 0;
}
