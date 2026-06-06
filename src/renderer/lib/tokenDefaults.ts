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
  type Scene,
  type Token
} from "../../shared/localvtt";

export function createImportedToken(scene: Scene, asset: Asset, tokenId: string): Token {
  const tokenLayer = scene.layers.find((layer) => layer.id === "token");
  return {
    id: tokenId,
    name: stripFileExtension(asset.name),
    assetId: asset.id,
    position: getDefaultTokenPosition(scene),
    size: getDefaultTokenSize(scene),
    sizePreset: DEFAULT_TOKEN_SIZE_PRESET,
    mask: DEFAULT_TOKEN_MASK,
    borderColor: DEFAULT_TOKEN_BORDER_COLOR,
    borderStyle: DEFAULT_TOKEN_BORDER_STYLE,
    borderWidth: DEFAULT_TOKEN_BORDER_WIDTH,
    borderWidthPreset: DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
    glowColor: DEFAULT_TOKEN_GLOW_COLOR,
    footprintVisible: DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
    order: scene.tokens.length,
    hidden: false,
    visibleInGm: tokenLayer?.visibleInGm ?? true,
    visibleInPlayer: tokenLayer?.visibleInPlayer ?? false
  };
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

export function getDefaultTokenSize(scene: Scene): { width: number; height: number } {
  const size = Math.max(1, scene.grid.sizePx);
  if (scene.grid.type === "hex") {
    const tokenSize = size * 0.72;
    return { width: tokenSize, height: tokenSize };
  }
  return { width: size, height: size };
}

export function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "") || fileName;
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
