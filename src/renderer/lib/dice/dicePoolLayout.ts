import type { DiceSceneSize, DiceSceneThrowDirection } from "../../../shared/localvtt";
import type { DiceVisualRoll } from "./dice";

export type DicePoolDisplayMode = "panel" | "scene";

export type DicePoolLayout = {
  count: number;
  columns: number;
  rows: number;
  scale: number;
  xSpacing: number;
  ySpacing: number;
};

export type DiceLanding = {
  baseX: number;
  baseY: number;
  startX: number;
  startY: number;
};

export type SceneVisibleBounds = {
  width: number;
  height: number;
};

export type SceneRollBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export function getDicePoolLayout(count: number, displayMode: DicePoolDisplayMode, sceneSize: DiceSceneSize = "md"): DicePoolLayout {
  if (displayMode === "scene") {
    const sizeScale = getSceneDiceSizeScale(sceneSize);
    if (count <= 1) {
      return scaleDicePoolLayout({ count, columns: 1, rows: 1, scale: 0.5, xSpacing: 1.2, ySpacing: 1.02 }, sizeScale);
    }
    if (count <= 2) {
      return scaleDicePoolLayout({ count, columns: count, rows: 1, scale: 0.44, xSpacing: 1.0, ySpacing: 1.2 }, sizeScale);
    }
    if (count <= 4) {
      return scaleDicePoolLayout({ count, columns: count, rows: 1, scale: 0.36, xSpacing: 0.72, ySpacing: 1.2 }, sizeScale);
    }
    if (count <= 8) {
      return scaleDicePoolLayout({ count, columns: Math.ceil(count / 2), rows: 2, scale: 0.28, xSpacing: 0.54, ySpacing: 0.58 }, sizeScale);
    }
    return scaleDicePoolLayout({ count, columns: 4, rows: Math.ceil(count / 4), scale: 0.22, xSpacing: 0.42, ySpacing: 0.46 }, sizeScale);
  }
  if (count <= 1) {
    return { count, columns: 1, rows: 1, scale: 1, xSpacing: 1.2, ySpacing: 1.02 };
  }
  if (count <= 2) {
    return { count, columns: count, rows: 1, scale: 0.72, xSpacing: 2.28, ySpacing: 1.1 };
  }
  if (count <= 3) {
    return { count, columns: count, rows: 1, scale: 0.56, xSpacing: 1.72, ySpacing: 1.05 };
  }
  if (count <= 4) {
    return { count, columns: 2, rows: 2, scale: 0.54, xSpacing: 1.62, ySpacing: 1.56 };
  }
  if (count <= 8) {
    return { count, columns: Math.ceil(count / 2), rows: 2, scale: 0.43, xSpacing: 1.34, ySpacing: 1.24 };
  }
  return { count, columns: 4, rows: Math.ceil(count / 4), scale: 0.32, xSpacing: 1.16, ySpacing: 1.08 };
}

export function getPanelDiceLanding(index: number, layout: DicePoolLayout): DiceLanding {
  const position = getDicePoolPosition(index, layout);
  return {
    baseX: position.x,
    baseY: position.y,
    startX: position.x,
    startY: position.y
  };
}

export function getSceneDiceLanding(index: number, layout: DicePoolLayout, visual: DiceVisualRoll, bounds: SceneVisibleBounds, throwDirection: DiceSceneThrowDirection = "random"): DiceLanding {
  const arranged = getDicePoolPosition(index, layout);
  const margin = Math.max(0.62, layout.scale * 1.85);
  const landingWidth = Math.max(margin * 2, bounds.width - margin * 2);
  const landingHeight = Math.max(margin * 2, bounds.height - margin * 2);
  const startMaxX = Math.max(margin, bounds.width / 2 - margin * 1.15);
  const startMaxY = Math.max(margin, bounds.height / 2 - margin * 1.15);
  const jitterX = (seedRange(visual.seed, 20, 1) - 0.5) * Math.min(bounds.width * 0.22, 2.2);
  const jitterY = (seedRange(visual.seed, 21, 1) - 0.5) * Math.min(bounds.height * 0.2, 1.5);
  const baseX = clampNumber(arranged.x + jitterX, -landingWidth / 2 + margin, landingWidth / 2 - margin);
  const baseY = clampNumber(arranged.y + jitterY, -landingHeight / 2 + margin, landingHeight / 2 - margin);
  const edge = getSceneThrowEdge(throwDirection, visual.seed);
  const sideOffset = seedRange(visual.seed, 23, 1) - 0.5;
  if (edge === 0) {
    return { baseX, baseY, startX: sideOffset * startMaxX * 2, startY: startMaxY };
  }
  if (edge === 1) {
    return { baseX, baseY, startX: startMaxX, startY: sideOffset * startMaxY * 2 };
  }
  if (edge === 2) {
    return { baseX, baseY, startX: sideOffset * startMaxX * 2, startY: -startMaxY };
  }
  return { baseX, baseY, startX: -startMaxX, startY: sideOffset * startMaxY * 2 };
}

function getSceneThrowEdge(direction: DiceSceneThrowDirection, seed: number): number {
  if (direction === "top") {
    return 0;
  }
  if (direction === "right") {
    return 1;
  }
  if (direction === "bottom") {
    return 2;
  }
  if (direction === "left") {
    return 3;
  }
  return Math.floor(seedRange(seed, 22, 4));
}

export function getSceneRollBounds(bounds: SceneVisibleBounds): SceneRollBounds {
  return {
    minX: -bounds.width / 2,
    maxX: bounds.width / 2,
    minY: -bounds.height / 2,
    maxY: bounds.height / 2
  };
}

export function getSceneDiceSizeScale(size: DiceSceneSize): number {
  const scales = {
    xs: 0.55,
    sm: 0.75,
    md: 1,
    lg: 1.35,
    xl: 1.75
  } satisfies Record<DiceSceneSize, number>;
  return scales[size];
}

export function getDicePoolPosition(index: number, layout: DicePoolLayout): { x: number; y: number } {
  const row = Math.floor(index / layout.columns);
  const column = index % layout.columns;
  const columnsInRow = row === layout.rows - 1 ? Math.max(1, indexCountInLastRow(layout, row)) : layout.columns;
  const centeredColumn = column - (columnsInRow - 1) / 2;
  const centeredRow = row - (layout.rows - 1) / 2;
  return {
    x: centeredColumn * layout.xSpacing,
    y: -centeredRow * layout.ySpacing + (layout.rows > 1 ? 0.24 : 0)
  };
}

function scaleDicePoolLayout(layout: DicePoolLayout, scale: number): DicePoolLayout {
  return {
    ...layout,
    scale: layout.scale * scale,
    xSpacing: layout.xSpacing * scale,
    ySpacing: layout.ySpacing * scale
  };
}

function indexCountInLastRow(layout: DicePoolLayout, row: number): number {
  if (layout.rows === 1 || row !== layout.rows - 1) {
    return layout.columns;
  }
  const remainder = layout.count % layout.columns;
  return remainder === 0 ? layout.columns : remainder;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seedRange(seed: number, offset: number, max: number): number {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * max;
}
