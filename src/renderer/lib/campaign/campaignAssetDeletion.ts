import { normalizeScene, type Scene } from "../../../shared/localvtt";
import { removeSceneTokensByAsset } from "../tokens";

export interface TokenAssetDeleteSceneUpdate {
  activeScene: Scene | null;
  sceneDrafts: Record<string, Scene>;
  selectedTokenIds: string[];
}

export interface TokenAssetDeleteCompletion extends TokenAssetDeleteSceneUpdate {
  playerSyncScene: Scene | null;
}

export function getMapAssetDeleteSceneUpdate(
  activeScene: Scene,
  savedScene: Scene,
  wasDirty: boolean,
  updatedAt: string
): { activeScene: Scene; draftScene: Scene | null; cleanScene: Scene | null } {
  if (!wasDirty) {
    return {
      activeScene: savedScene,
      draftScene: null,
      cleanScene: savedScene
    };
  }

  const draftScene = normalizeScene({ ...activeScene, mapAssetId: savedScene.mapAssetId, mapVariants: savedScene.mapVariants, updatedAt });
  return {
    activeScene: draftScene,
    draftScene,
    cleanScene: null
  };
}

export interface MapAssetDeleteCompletion {
  activeScene: Scene;
  sceneDrafts: Record<string, Scene>;
  dirtySceneIds: Set<string>;
  cleanScene: Scene | null;
}

export function getMapAssetDeleteCompletion({
  activeScene,
  savedScene,
  wasDirty,
  updatedAt,
  sceneDrafts,
  dirtySceneIds
}: {
  activeScene: Scene;
  savedScene: Scene;
  wasDirty: boolean;
  updatedAt: string;
  sceneDrafts: Record<string, Scene>;
  dirtySceneIds: ReadonlySet<string>;
}): MapAssetDeleteCompletion {
  const update = getMapAssetDeleteSceneUpdate(activeScene, savedScene, wasDirty, updatedAt);
  const nextSceneDrafts = { ...sceneDrafts };
  const nextDirtySceneIds = new Set(dirtySceneIds);

  if (update.draftScene) {
    nextSceneDrafts[update.draftScene.id] = update.draftScene;
    nextDirtySceneIds.add(update.draftScene.id);
  }

  return {
    activeScene: update.activeScene,
    sceneDrafts: nextSceneDrafts,
    dirtySceneIds: nextDirtySceneIds,
    cleanScene: update.cleanScene
  };
}

export function getSceneDraftsAfterTokenAssetDelete(
  sceneDrafts: Record<string, Scene>,
  deletedAssetId: string
): Record<string, Scene> {
  const nextDrafts = { ...sceneDrafts };
  for (const [sceneId, draft] of Object.entries(nextDrafts)) {
    nextDrafts[sceneId] = removeSceneTokensByAsset(draft, deletedAssetId);
  }
  return nextDrafts;
}

export function getActiveSceneAfterTokenAssetDelete(
  activeScene: Scene | null,
  changedScenesById: ReadonlyMap<string, Scene>,
  deletedAssetId: string
): Scene | null {
  if (!activeScene) {
    return null;
  }
  if (!changedScenesById.has(activeScene.id) && !activeScene.tokens.some((token) => token.assetId === deletedAssetId)) {
    return activeScene;
  }
  return removeSceneTokensByAsset(changedScenesById.get(activeScene.id) ?? activeScene, deletedAssetId);
}

export function getSelectedTokenIdsAfterTokenAssetDelete(selectedTokenIds: readonly string[], activeScene: Scene | null): string[] {
  if (!activeScene) {
    return [];
  }
  const remainingTokenIds = new Set(activeScene.tokens.map((token) => token.id));
  return selectedTokenIds.filter((tokenId) => remainingTokenIds.has(tokenId));
}

export function getTokenAssetDeleteSceneUpdate(
  sceneDrafts: Record<string, Scene>,
  activeScene: Scene | null,
  changedScenes: readonly Scene[],
  deletedAssetId: string,
  selectedTokenIds: readonly string[]
): TokenAssetDeleteSceneUpdate {
  const changedScenesById = new Map(changedScenes.map((scene) => [scene.id, scene]));
  const nextActiveScene = getActiveSceneAfterTokenAssetDelete(activeScene, changedScenesById, deletedAssetId);
  return {
    activeScene: nextActiveScene,
    sceneDrafts: getSceneDraftsAfterTokenAssetDelete(sceneDrafts, deletedAssetId),
    selectedTokenIds: getSelectedTokenIdsAfterTokenAssetDelete(selectedTokenIds, nextActiveScene)
  };
}

export function getTokenAssetDeleteCompletion({
  sceneDrafts,
  activeScene,
  changedScenes,
  deletedAssetId,
  selectedTokenIds,
  playerSceneId
}: {
  sceneDrafts: Record<string, Scene>;
  activeScene: Scene | null;
  changedScenes: readonly Scene[];
  deletedAssetId: string;
  selectedTokenIds: readonly string[];
  playerSceneId: string | null;
}): TokenAssetDeleteCompletion {
  const update = getTokenAssetDeleteSceneUpdate(sceneDrafts, activeScene, changedScenes, deletedAssetId, selectedTokenIds);
  return {
    ...update,
    playerSyncScene: update.activeScene && update.activeScene.id === playerSceneId ? update.activeScene : null
  };
}
