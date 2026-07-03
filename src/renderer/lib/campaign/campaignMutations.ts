import { DEFAULT_SCENE_FOLDER_COLOR, type Campaign, type TokenPresentationDefaults } from "../../../shared/localvtt";

export type SceneFolderNameRequest =
  | { mode: "create"; name: string; folderId: string }
  | { mode: "rename"; name: string; folderId: string };

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
