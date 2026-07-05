import type { Asset, Point, Scene } from "../../../shared/localvtt";
import { createImportedToken } from "./tokenDefaults";

export type TokenImportMode = "scene" | "library";

export type TokenCropDialogState = {
  asset: Asset;
  mode: TokenImportMode;
};

export interface ImportedTokenSceneUpdate {
  scene: Scene;
  tokenId: string;
}

export function canStartTokenImport(campaignPath: string | null | undefined, mode: TokenImportMode, activeScene: Scene | null): boolean {
  return Boolean(campaignPath && (mode !== "scene" || activeScene));
}

export function getTokenCropDialogState(asset: Asset, mode: TokenImportMode): TokenCropDialogState {
  return { asset, mode };
}

export function getImportedTokenSceneUpdate(
  scene: Scene | null,
  asset: Asset,
  tokenId: string,
  updatedAt: string,
  placementPoint?: Point
): ImportedTokenSceneUpdate | null {
  if (!scene) {
    return null;
  }

  const token = createImportedToken(scene, asset, tokenId, placementPoint);
  return {
    tokenId,
    scene: {
      ...scene,
      tokens: [...scene.tokens, token],
      updatedAt
    }
  };
}
