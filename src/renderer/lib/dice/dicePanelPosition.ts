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
