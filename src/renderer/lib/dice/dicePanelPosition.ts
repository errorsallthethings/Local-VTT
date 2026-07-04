export interface DicePanelPosition {
  x: number;
  y: number;
}

export interface DicePanelSize {
  width: number;
  height: number;
}

export interface DicePanelViewport {
  width: number;
  height: number;
}

export interface DicePanelDragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

export interface DicePanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function clampDicePanelPosition(
  x: number,
  y: number,
  viewport: DicePanelViewport,
  size: Partial<DicePanelSize> | null | undefined,
  margin = 8
): DicePanelPosition {
  const width = size?.width ?? 300;
  const height = size?.height ?? 520;
  const maxX = Math.max(margin, viewport.width - width - margin);
  const maxY = Math.max(margin, viewport.height - height - margin);
  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY)
  };
}

export function getDicePanelPositionInViewport(
  x: number,
  y: number,
  viewport: DicePanelViewport,
  rect: DicePanelRect | null | undefined,
  margin = 8
): DicePanelPosition {
  return clampDicePanelPosition(x, y, viewport, rect, margin);
}

export function getDicePanelDragStart(pointerId: number, clientX: number, clientY: number, rect: DicePanelRect): DicePanelDragState {
  return {
    pointerId,
    offsetX: clientX - rect.left,
    offsetY: clientY - rect.top
  };
}

export function getDicePanelDragPosition(
  drag: DicePanelDragState,
  clientX: number,
  clientY: number,
  viewport: DicePanelViewport,
  rect: DicePanelRect | null | undefined,
  margin = 8
): DicePanelPosition {
  return getDicePanelPositionInViewport(clientX - drag.offsetX, clientY - drag.offsetY, viewport, rect, margin);
}
