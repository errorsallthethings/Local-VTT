import {
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_TOKEN_BORDER_STYLE,
  DEFAULT_TOKEN_BORDER_WIDTH,
  DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
  DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
  DEFAULT_TOKEN_GLOW_COLOR,
  DEFAULT_TOKEN_MASK,
  DEFAULT_TOKEN_SIZE_PRESET,
  type Asset,
  type GridType,
  type Point,
  type Scene,
  type Token,
  type TokenBorderWidthPreset,
  type TokenBorderStyle,
  type TokenMask,
  type TokenPresentationDefaults,
  type TokenSizePreset
} from "../../../shared/localvtt";
import { getSnappedTokenPosition } from "../../canvas/tokens";

export function createImportedToken(scene: Scene, asset: Asset, tokenId: string, placementPoint?: Point): Token {
  const tokenLayer = scene.layers.find((layer) => layer.id === "token");
  const presentation = getTokenPresentationFromDefaults(asset.tokenDefaults, scene.grid.sizePx, scene.grid.type);
  const size = presentation.size;
  const position = placementPoint ? getTokenPositionAtPoint(scene, size, placementPoint) : getDefaultTokenPosition(scene);
  return {
    id: tokenId,
    name: stripFileExtension(asset.name),
    assetId: asset.id,
    position,
    ...presentation,
    order: scene.tokens.length,
    hidden: false,
    visibleInGm: tokenLayer?.visibleInGm ?? true,
    visibleInPlayer: tokenLayer?.visibleInPlayer ?? false
  };
}

export function getTokenPositionAtPoint(scene: Scene, size: Token["size"], point: Point): Point {
  const centeredPosition = {
    x: point.x - size.width / 2,
    y: point.y - size.height / 2
  };
  return getSnappedTokenPosition(centeredPosition, getDefaultTokenPrototype(size), scene);
}

export function duplicateToken(tokens: readonly Token[], sourceTokenId: string, duplicateTokenId: string): Token[] {
  const sourceToken = tokens.find((token) => token.id === sourceTokenId);
  if (!sourceToken) {
    return [...tokens];
  }

  const duplicate: Token = {
    ...sourceToken,
    id: duplicateTokenId,
    name: getDuplicateTokenName(sourceToken.name, tokens),
    position: { ...sourceToken.position },
    size: { ...sourceToken.size },
    vision: sourceToken.vision ? { ...sourceToken.vision } : undefined,
    light: sourceToken.light ? { ...sourceToken.light } : undefined,
    order: tokens.length
  };

  return [...tokens, duplicate].map((token, index) => ({ ...token, order: index }));
}

export function getDefaultTokenPosition(scene: Scene): { x: number; y: number } {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: scene.grid.offsetX,
    y: scene.grid.offsetY
  };
}

export function getDefaultTokenSize(scene: Scene, defaults?: TokenPresentationDefaults): { width: number; height: number } {
  const presentation = getTokenPresentationFromDefaults(defaults, scene.grid.sizePx, scene.grid.type);
  if (presentation.sizePreset !== DEFAULT_TOKEN_SIZE_PRESET || defaults?.customSizeCells) {
    return presentation.size;
  }
  const size = Math.max(1, scene.grid.sizePx);
  if (scene.grid.type === "hex") {
    const tokenSize = size * 0.72;
    return { width: tokenSize, height: tokenSize };
  }
  return { width: size, height: size };
}

export function getTokenPresentationDefaults(token: Token, gridSize: number): TokenPresentationDefaults {
  const sizePreset = token.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET;
  const safeGridSize = Math.max(1, gridSize);
  return {
    sizePreset,
    customSizeCells:
      sizePreset === "custom"
        ? {
            width: Math.round((token.size.width / safeGridSize) * 100) / 100,
            height: Math.round((token.size.height / safeGridSize) * 100) / 100
          }
        : undefined,
    mask: token.mask ?? DEFAULT_TOKEN_MASK,
    borderColor: token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR,
    borderStyle: token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE,
    borderWidth: token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH,
    borderWidthPreset: token.borderWidthPreset ?? getBorderWidthPreset(token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH),
    glowColor: token.glowColor ?? DEFAULT_TOKEN_GLOW_COLOR,
    footprintVisible: token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE
  };
}

export interface TokenSettingsPresentation {
  sizePreset: TokenSizePreset;
  borderColor: string;
  borderWidth: number;
  borderWidthPreset: TokenBorderWidthPreset;
  borderStyle: TokenBorderStyle;
  glowColor: string;
  customWidthCells: number;
  customHeightCells: number;
  customSizeDisabled: boolean;
  mask: TokenMask;
  footprintHidden: boolean;
}

export function getTokenSettingsPresentation(token: Token, gridSize: number, gridType: GridType): TokenSettingsPresentation {
  const borderWidth = token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH;
  const safeGridSize = Math.max(1, gridSize);
  return {
    sizePreset: token.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET,
    borderColor: token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR,
    borderWidth,
    borderWidthPreset: token.borderWidthPreset ?? getBorderWidthPreset(borderWidth),
    borderStyle: token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE,
    glowColor: token.glowColor ?? DEFAULT_TOKEN_GLOW_COLOR,
    customWidthCells: Math.round((token.size.width / safeGridSize) * 100) / 100,
    customHeightCells: Math.round((token.size.height / safeGridSize) * 100) / 100,
    customSizeDisabled: gridType === "hex",
    mask: token.mask ?? DEFAULT_TOKEN_MASK,
    footprintHidden: !(token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE)
  };
}

export function getTokenSizePresetPatch(preset: TokenSizePreset, gridSize: number, gridType: GridType): Partial<Token> {
  if (preset === "custom") {
    return { sizePreset: "custom" };
  }
  return {
    sizePreset: preset,
    size: getTokenSizeForPreset(preset, gridSize, gridType)
  };
}

export function getTokenCustomSizePatch(token: Pick<Token, "size">, gridSize: number, axis: "width" | "height", cells: number): Partial<Token> {
  const safeGridSize = Math.max(1, gridSize);
  const clampedCells = Math.min(10, Math.max(0.25, cells));
  return {
    sizePreset: "custom",
    size: {
      width: axis === "width" ? safeGridSize * clampedCells : token.size.width,
      height: axis === "height" ? safeGridSize * clampedCells : token.size.height
    }
  };
}

export function getTokenBorderWidthPresetPatch(preset: TokenBorderWidthPreset, currentBorderWidth: number): Partial<Token> {
  return {
    borderWidthPreset: preset,
    borderWidth: getBorderWidthForPreset(preset, currentBorderWidth)
  };
}

export function getTokenCustomBorderWidthPatch(borderWidth: number): Partial<Token> {
  return {
    borderWidth: Math.min(64, Math.max(1, borderWidth))
  };
}

export function getTokenFootprintVisibilityPatch(hidden: boolean): Partial<Token> {
  return {
    footprintVisible: !hidden
  };
}

export function getTokenPresentationFromDefaults(defaults: TokenPresentationDefaults | undefined, gridSize: number, gridType: GridType): Pick<
  Token,
  "size" | "sizePreset" | "mask" | "borderColor" | "borderStyle" | "borderWidth" | "borderWidthPreset" | "glowColor" | "footprintVisible"
> {
  const sizePreset = defaults?.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET;
  return {
    size: getTokenSizeForPreset(sizePreset, gridSize, gridType, defaults?.customSizeCells),
    sizePreset,
    mask: defaults?.mask ?? DEFAULT_TOKEN_MASK,
    borderColor: defaults?.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR,
    borderStyle: defaults?.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE,
    borderWidth: defaults?.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH,
    borderWidthPreset: defaults?.borderWidthPreset ?? DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
    glowColor: defaults?.glowColor ?? DEFAULT_TOKEN_GLOW_COLOR,
    footprintVisible: defaults?.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE
  };
}

export function getTokenSizeForPreset(preset: TokenSizePreset, gridSize: number, gridType: GridType, customSizeCells?: TokenPresentationDefaults["customSizeCells"]): Token["size"] {
  const size = Math.max(1, gridSize);
  if (preset === "custom" && gridType !== "hex" && customSizeCells) {
    return {
      width: size * customSizeCells.width,
      height: size * customSizeCells.height
    };
  }
  if (gridType === "hex") {
    const cells = getTokenPresetCells(preset);
    const multiplier = preset === "tiny" ? 0.42 : Math.max(0.72, cells * 0.72);
    return {
      width: size * multiplier,
      height: size * multiplier
    };
  }
  const cells = getTokenPresetCells(preset);
  return {
    width: size * cells,
    height: size * cells
  };
}

export function getBorderWidthPreset(width: number): TokenBorderWidthPreset {
  if (width === 16) {
    return "thin";
  }
  if (width === 24) {
    return "medium";
  }
  if (width === 32) {
    return "thick";
  }
  return "custom";
}

export function getBorderWidthForPreset(preset: TokenBorderWidthPreset, fallback: number): number {
  switch (preset) {
    case "thin":
      return 16;
    case "medium":
      return 24;
    case "thick":
      return 32;
    case "custom":
      return fallback;
  }
}

export function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "") || fileName;
}

function getTokenPresetCells(preset: TokenSizePreset): number {
  switch (preset) {
    case "tiny":
      return 0.5;
    case "large":
      return 2;
    case "huge":
      return 3;
    case "gargantuan":
      return 4;
    case "medium":
    case "custom":
      return 1;
  }
}

function getDuplicateTokenName(name: string, tokens: readonly Token[]): string {
  const baseName = name.trim() || "Token";
  const existingNames = new Set(tokens.map((token) => token.name.trim()).filter(Boolean));
  const firstCopyName = `${baseName} Copy`;
  if (!existingNames.has(firstCopyName)) {
    return firstCopyName;
  }
  let suffix = 2;
  while (existingNames.has(`${firstCopyName} ${suffix}`)) {
    suffix += 1;
  }
  return `${firstCopyName} ${suffix}`;
}

function getDefaultTokenPrototype(size: Token["size"]): Token {
  return {
    id: "token-placement-preview",
    name: "Token",
    position: { x: 0, y: 0 },
    size,
    sizePreset: DEFAULT_TOKEN_SIZE_PRESET,
    hidden: false,
    visibleInPlayer: false
  };
}
