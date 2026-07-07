import type { Scene } from "../../../../shared/localvtt";
import type { TokenDragState } from "../../../canvas/scene";
import { getSceneAfterTokenDrag, type TokenDragPreview } from "../../../canvas/tokens";
import { updateSceneDrawingPoints, updateSceneEnvironmentEffectPoints, updateSceneWeatherMaskPoints } from "../../../lib/scene";
import type { DrawingTransformPointerCompleteAction } from "./sceneDrawingTransformPointer";
import type { MaskEffectPointerCompleteAction } from "./sceneMaskEffectPointer";

export function getSceneAfterDrawingTransformPointerComplete(scene: Scene, action: DrawingTransformPointerCompleteAction): Scene | null {
  return action.kind !== "none" && action.preview ? updateSceneDrawingPoints(scene, action.preview) : null;
}

export function getSceneAfterMaskEffectPointerComplete(scene: Scene, action: MaskEffectPointerCompleteAction): Scene | null {
  if (action.kind === "commit-weather" && action.preview) {
    return updateSceneWeatherMaskPoints(scene, action.preview);
  }

  if (action.kind === "commit-environment-effect" && action.preview) {
    return updateSceneEnvironmentEffectPoints(scene, action.preview);
  }

  return null;
}

export function getSceneAfterTokenPointerComplete(
  scene: Scene,
  tokenDrag: TokenDragState,
  tokenDragPreview: TokenDragPreview | null
): { scene: Scene; syncScene: Scene } | null {
  const token = scene.tokens.find((candidate) => candidate.id === tokenDrag.tokenId);
  if (!token) {
    return null;
  }

  const result = getSceneAfterTokenDrag(scene, tokenDrag, token, tokenDragPreview);
  return {
    scene: result.scene,
    syncScene: result.syncScene ?? result.scene
  };
}
