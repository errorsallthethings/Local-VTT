import type { Scene } from "../../shared/localvtt";

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
  ctx.scale(transform.scale, transform.scale);
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight);
  ctx.restore();
}

export function resolveMapTransform(scene: Scene, sourceWidth: number, sourceHeight: number, viewportWidth: number, viewportHeight: number) {
  const transform = scene.mapTransform;
  if (transform.fitMode === "manual" || sourceWidth <= 0 || sourceHeight <= 0) {
    return transform;
  }

  const containScale = Math.min(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const coverScale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const scale = transform.fitMode === "cover" ? coverScale : transform.fitMode === "actual-size" ? 1 : containScale;
  return {
    ...transform,
    x: (viewportWidth - sourceWidth * scale) / 2,
    y: (viewportHeight - sourceHeight * scale) / 2,
    scale
  };
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
