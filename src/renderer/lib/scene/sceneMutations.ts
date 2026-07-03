import type { FogSettings, GridSettings, Scene } from "../../../shared/localvtt";

export type SceneItemRenameKind = "fog-shape" | "environment-effect" | "token";
export type SceneColorDialogKind = "fog" | "grid";
export type TokenColorKind = "border" | "glow";

export interface SceneColorDialogState {
  kind: SceneColorDialogKind;
  title: string;
  value: string;
}

export interface SceneColorPatch {
  fogPatch: Partial<FogSettings> | null;
  gridPatch: Partial<GridSettings> | null;
}

export interface TokenColorDialogState {
  tokenId: string;
  tokenName: string;
  value: string;
  kind: TokenColorKind;
}

export function getSceneItemRenameName(scene: Scene | null, kind: SceneItemRenameKind, itemId: string, fallbackName: string): string {
  const name =
    kind === "fog-shape"
      ? scene?.fog.shapes.find((shape) => shape.id === itemId)?.name
      : kind === "environment-effect"
        ? scene?.environment.effects.find((effect) => effect.id === itemId)?.name
        : scene?.tokens.find((token) => token.id === itemId)?.name;
  return name?.trim() || fallbackName;
}

export function getSceneColorDialogState(scene: Scene, kind: SceneColorDialogKind): SceneColorDialogState {
  return {
    kind,
    title: kind === "fog" ? "Fog Color" : "Grid Color",
    value: kind === "fog" ? scene.fog.color : scene.grid.color
  };
}

export function applySceneColorDialog(dialog: SceneColorDialogState): SceneColorPatch {
  return {
    fogPatch: dialog.kind === "fog" ? { color: dialog.value } : null,
    gridPatch: dialog.kind === "grid" ? { color: dialog.value } : null
  };
}

export function getTokenColorDialogState(scene: Scene | null, tokenId: string, value: string, kind: TokenColorKind): TokenColorDialogState {
  return {
    tokenId,
    tokenName: scene?.tokens.find((token) => token.id === tokenId)?.name?.trim() || "Token",
    value,
    kind
  };
}

export function renameFogShape(scene: Scene, shapeId: string, name: string, updatedAt = new Date().toISOString()): Scene | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...scene,
    fog: {
      ...scene.fog,
      shapes: scene.fog.shapes.map((shape) => (shape.id === shapeId ? { ...shape, name: trimmedName } : shape))
    },
    updatedAt
  };
}

export function renameEnvironmentEffect(scene: Scene, effectId: string, name: string, updatedAt = new Date().toISOString()): Scene | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...scene,
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.map((effect) => (effect.id === effectId ? { ...effect, name: trimmedName } : effect))
    },
    updatedAt
  };
}

export function renameSceneToken(scene: Scene, tokenId: string, name: string, updatedAt = new Date().toISOString()): Scene | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...scene,
    tokens: scene.tokens.map((token) => (token.id === tokenId ? { ...token, name: trimmedName } : token)),
    updatedAt
  };
}

export function setSceneTokenColor(
  scene: Scene,
  tokenId: string,
  value: string,
  kind: TokenColorKind,
  updatedAt = new Date().toISOString()
): Scene {
  return {
    ...scene,
    tokens: scene.tokens.map((token) =>
      token.id === tokenId ? (kind === "glow" ? { ...token, glowColor: value } : { ...token, borderColor: value }) : token
    ),
    updatedAt
  };
}
