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

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
