import type { Point, SquareCropRect } from "../../shared/localvtt";

export interface TokenCropInput {
  naturalWidth: number;
  naturalHeight: number;
  previewSize: number;
  zoom: number;
  offset: Point;
}

export interface TokenCropLayout {
  scale: number;
  displayWidth: number;
  displayHeight: number;
  left: number;
  top: number;
}

export type TokenCropSourceRect = SquareCropRect;

export function getTokenCropLayout(input: TokenCropInput): TokenCropLayout {
  const safeWidth = Math.max(1, input.naturalWidth);
  const safeHeight = Math.max(1, input.naturalHeight);
  const safePreview = Math.max(1, input.previewSize);
  const safeZoom = Math.max(1, input.zoom);
  const scale = (safePreview / Math.min(safeWidth, safeHeight)) * safeZoom;
  const displayWidth = safeWidth * scale;
  const displayHeight = safeHeight * scale;
  return {
    scale,
    displayWidth,
    displayHeight,
    left: (safePreview - displayWidth) / 2 + input.offset.x,
    top: (safePreview - displayHeight) / 2 + input.offset.y
  };
}

export function clampTokenCropOffset(input: TokenCropInput): Point {
  const layout = getTokenCropLayout(input);
  const previewSize = Math.max(1, input.previewSize);
  const centeredLeft = (previewSize - layout.displayWidth) / 2;
  const centeredTop = (previewSize - layout.displayHeight) / 2;
  const clampedLeft = Math.min(0, Math.max(previewSize - layout.displayWidth, layout.left));
  const clampedTop = Math.min(0, Math.max(previewSize - layout.displayHeight, layout.top));
  return {
    x: clampedLeft - centeredLeft,
    y: clampedTop - centeredTop
  };
}

export function getTokenCropSourceRect(input: TokenCropInput): TokenCropSourceRect {
  const layout = getTokenCropLayout({ ...input, offset: clampTokenCropOffset(input) });
  const size = Math.min(input.naturalWidth, input.naturalHeight, input.previewSize / layout.scale);
  return {
    x: Math.min(input.naturalWidth - size, Math.max(0, -layout.left / layout.scale)),
    y: Math.min(input.naturalHeight - size, Math.max(0, -layout.top / layout.scale)),
    size
  };
}
