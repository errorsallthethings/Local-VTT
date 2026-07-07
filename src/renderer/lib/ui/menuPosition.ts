export interface MenuRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface FloatingMenuPositionInput {
  anchorRect: MenuRect;
  menuWidth: number;
  menuHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  gap?: number;
  viewportPadding?: number;
}

export interface FloatingMenuPosition {
  top: number;
  left: number;
}

export type CanvasContextMenuKind = "token" | "mask" | "drawing" | "environment";

export interface CanvasContextMenuPositionInput {
  anchorX: number;
  anchorY: number;
  kind: CanvasContextMenuKind;
  viewportWidth: number;
  viewportHeight: number;
  offset?: number;
  viewportPadding?: number;
}

export interface CanvasContextMenuPosition {
  x: number;
  y: number;
}

export function calculateFloatingMenuPosition({
  anchorRect,
  menuWidth,
  menuHeight,
  viewportWidth,
  viewportHeight,
  gap = 6,
  viewportPadding = 6
}: FloatingMenuPositionInput): FloatingMenuPosition {
  const maxLeft = Math.max(viewportPadding, viewportWidth - menuWidth - viewportPadding);
  const preferredLeft = anchorRect.right - menuWidth;
  const left = clamp(preferredLeft, viewportPadding, maxLeft);

  const bottomTop = anchorRect.bottom + gap;
  const topTop = anchorRect.top - menuHeight - gap;
  const maxTop = Math.max(viewportPadding, viewportHeight - menuHeight - viewportPadding);
  const top = bottomTop + menuHeight <= viewportHeight - viewportPadding ? bottomTop : clamp(topTop, viewportPadding, maxTop);

  return { top, left };
}

export function calculateCanvasContextMenuPosition({
  anchorX,
  anchorY,
  kind,
  viewportWidth,
  viewportHeight,
  offset = 8,
  viewportPadding = 12
}: CanvasContextMenuPositionInput): CanvasContextMenuPosition {
  const menuSize = getEstimatedCanvasContextMenuSize(kind);
  const hasRoomRight = anchorX + offset + menuSize.width + viewportPadding <= viewportWidth;
  const hasRoomBelow = anchorY + offset + menuSize.height + viewportPadding <= viewportHeight;
  const preferredX = hasRoomRight ? anchorX + offset : anchorX - menuSize.width - offset;
  const preferredY = hasRoomBelow ? anchorY + offset : anchorY - menuSize.height - offset;

  return {
    x: clamp(preferredX, viewportPadding, viewportWidth - menuSize.width - viewportPadding),
    y: clamp(preferredY, viewportPadding, viewportHeight - menuSize.height - viewportPadding)
  };
}

export function getEstimatedCanvasContextMenuSize(kind: CanvasContextMenuKind): { width: number; height: number } {
  if (kind === "token") {
    return { width: 300, height: 540 };
  }
  if (kind === "drawing") {
    return { width: 260, height: 270 };
  }
  if (kind === "environment") {
    return { width: 230, height: 250 };
  }
  return { width: 230, height: 250 };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
