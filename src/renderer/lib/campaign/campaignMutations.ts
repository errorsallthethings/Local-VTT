import { DEFAULT_SCENE_FOLDER_COLOR, type Campaign, type Scene, type TokenPresentationDefaults } from "../../../shared/localvtt";

export type SceneFolderNameRequest =
  | { mode: "create"; name: string; folderId: string }
  | { mode: "rename"; name: string; folderId: string };

export type SceneNameDialogState = { name: string; dialog: { mode: "create" } | { mode: "rename"; sceneId: string } };
export type SceneFolderNameDialogState = { name: string; dialog: { mode: "create" } | { mode: "rename"; folderId: string } };

export function getCreateSceneNameDialogState(defaultName = "New Battle Map"): SceneNameDialogState {
  return {
    name: defaultName,
    dialog: { mode: "create" }
  };
}

export function getRenameSceneNameDialogState(scene: Pick<Scene, "id" | "name">): SceneNameDialogState {
  return {
    name: scene.name,
    dialog: { mode: "rename", sceneId: scene.id }
  };
}

export function getCreateSceneFolderNameDialogState(defaultName = "New Folder"): SceneFolderNameDialogState {
  return {
    name: defaultName,
    dialog: { mode: "create" }
  };
}

export function getRenameSceneFolderNameDialogState(folder: Pick<Campaign["sceneFolders"][number], "id" | "name">): SceneFolderNameDialogState {
  return {
    name: folder.name,
    dialog: { mode: "rename", folderId: folder.id }
  };
}

export function submitSceneFolderName(campaign: Campaign, request: SceneFolderNameRequest, updatedAt: string): Campaign | null {
  const name = request.name.trim();
  if (!name) {
    return null;
  }

  return request.mode === "create"
    ? {
        ...campaign,
        sceneFolders: [...campaign.sceneFolders, { id: request.folderId, name, color: DEFAULT_SCENE_FOLDER_COLOR, createdAt: updatedAt }],
        updatedAt
      }
    : {
        ...campaign,
        sceneFolders: campaign.sceneFolders.map((folder) => (folder.id === request.folderId ? { ...folder, name } : folder)),
        updatedAt
      };
}

export function setSceneFolderColor(campaign: Campaign, folderId: string, color: string, updatedAt: string): Campaign {
  return {
    ...campaign,
    sceneFolders: campaign.sceneFolders.map((folder) => (folder.id === folderId ? { ...folder, color } : folder)),
    updatedAt
  };
}

export function renameCampaignTokenAsset(campaign: Campaign, assetId: string, name: string, updatedAt: string): Campaign | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...campaign,
    assets: campaign.assets.map((asset) => (asset.id === assetId ? { ...asset, name: trimmedName } : asset)),
    updatedAt
  };
}

export function setCampaignTokenAssetDefaults(
  campaign: Campaign,
  assetId: string,
  tokenDefaults: TokenPresentationDefaults,
  updatedAt: string
): Campaign {
  return {
    ...campaign,
    assets: campaign.assets.map((asset) => (asset.id === assetId ? { ...asset, tokenDefaults } : asset)),
    updatedAt
  };
}

export function renameCampaign(campaign: Campaign, name: string, updatedAt: string): Campaign | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...campaign,
    name: trimmedName,
    updatedAt
  };
}

export function getSceneDraftsAfterSceneRename(sceneDrafts: Record<string, Scene>, sceneId: string, name: string): Record<string, Scene> {
  const draft = sceneDrafts[sceneId];
  return draft ? { ...sceneDrafts, [sceneId]: { ...draft, name } } : sceneDrafts;
}

export function getActiveSceneAfterSceneRename(activeScene: Scene | null, sceneId: string, name: string, savedScene: Scene): Scene | null {
  if (activeScene?.id !== sceneId) {
    return activeScene;
  }

  return activeScene ? { ...activeScene, name } : savedScene;
}

export interface SceneNameDialogCompletion {
  activeScene: Scene | null;
  cleanScene: Scene | null;
  sceneDrafts: Record<string, Scene>;
}

export function getSceneNameDialogCompletion({
  mode,
  sceneId,
  name,
  savedScene,
  sceneDrafts,
  activeScene
}: {
  mode: "create" | "rename";
  sceneId?: string;
  name: string;
  savedScene: Scene;
  sceneDrafts: Record<string, Scene>;
  activeScene: Scene | null;
}): SceneNameDialogCompletion {
  if (mode === "create") {
    return {
      activeScene: savedScene,
      cleanScene: savedScene,
      sceneDrafts
    };
  }

  if (!sceneId) {
    return {
      activeScene,
      cleanScene: null,
      sceneDrafts
    };
  }

  return {
    activeScene: getActiveSceneAfterSceneRename(activeScene, sceneId, name, savedScene),
    cleanScene: null,
    sceneDrafts: getSceneDraftsAfterSceneRename(sceneDrafts, sceneId, name)
  };
}
