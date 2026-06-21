import type { Campaign, Scene } from "../../../shared/localvtt";
import { mergeCampaignDraft } from "./campaignDraft";

export function getSceneDraftToSave(
  sceneId: string,
  sceneDrafts: Record<string, Scene>,
  activeScene: Scene | null
): Scene | null {
  return activeScene?.id === sceneId ? activeScene : (sceneDrafts[sceneId] ?? null);
}

export function getDirtySceneIdsInFolder(campaign: Campaign, dirtySceneIds: Set<string>, folderId: string): string[] {
  return campaign.scenes.filter((scene) => scene.folderId === folderId && dirtySceneIds.has(scene.id)).map((scene) => scene.id);
}

export function moveSceneEntryToFolder(campaign: Campaign, sceneId: string, folderId: string | undefined, updatedAt: string): Campaign {
  return {
    ...campaign,
    scenes: campaign.scenes.map((scene) => (scene.id === sceneId ? { ...scene, folderId } : scene)),
    updatedAt
  };
}

export function moveSceneEntry(
  campaign: Campaign,
  sceneId: string,
  target: { folderId?: string; beforeSceneId?: string; afterSceneId?: string },
  updatedAt: string
): Campaign {
  const sceneToMove = campaign.scenes.find((scene) => scene.id === sceneId);
  if (!sceneToMove || target.beforeSceneId === sceneId || target.afterSceneId === sceneId) {
    return campaign;
  }

  const remainingScenes = campaign.scenes.filter((scene) => scene.id !== sceneId);
  const movedScene = { ...sceneToMove, folderId: target.folderId };
  const targetSceneId = target.beforeSceneId ?? target.afterSceneId;
  const targetIndex = targetSceneId ? remainingScenes.findIndex((scene) => scene.id === targetSceneId) : -1;
  const insertIndex = targetIndex < 0 ? remainingScenes.length : target.beforeSceneId ? targetIndex : targetIndex + 1;
  const scenes = [...remainingScenes];
  scenes.splice(insertIndex, 0, movedScene);

  if (campaign.scenes.every((scene, index) => scene === scenes[index] || (scene.id === scenes[index]?.id && scene.folderId === scenes[index]?.folderId))) {
    return campaign;
  }

  return {
    ...campaign,
    scenes,
    updatedAt
  };
}

export function getDuplicateSceneName(sourceName: string, campaign: Campaign): string {
  const existingNames = new Set(campaign.scenes.map((scene) => scene.name.trim().toLowerCase()));
  const baseName = `${sourceName.trim() || "Untitled Scene"} Copy`;
  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let copyNumber = 2;
  let candidate = `${baseName} ${copyNumber}`;
  while (existingNames.has(candidate.toLowerCase())) {
    copyNumber += 1;
    candidate = `${baseName} ${copyNumber}`;
  }
  return candidate;
}

export function getDuplicateFolderName(sourceName: string, campaign: Campaign): string {
  const existingNames = new Set(campaign.sceneFolders.map((folder) => folder.name.trim().toLowerCase()));
  const baseName = `${sourceName.trim() || "Folder"} Copy`;
  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let copyNumber = 2;
  let candidate = `${baseName} ${copyNumber}`;
  while (existingNames.has(candidate.toLowerCase())) {
    copyNumber += 1;
    candidate = `${baseName} ${copyNumber}`;
  }
  return candidate;
}

export function insertSceneFolderAfterSource(
  campaign: Campaign,
  sourceFolderId: string,
  folder: Campaign["sceneFolders"][number],
  updatedAt: string
): Campaign {
  const sourceIndex = campaign.sceneFolders.findIndex((candidate) => candidate.id === sourceFolderId);
  const sceneFolders = [...campaign.sceneFolders];
  sceneFolders.splice(sourceIndex >= 0 ? sourceIndex + 1 : sceneFolders.length, 0, folder);
  return {
    ...campaign,
    sceneFolders,
    updatedAt
  };
}

export function insertSceneEntryAfterSource(
  campaign: Campaign,
  sourceSceneId: string,
  scene: Scene,
  folderId: string | undefined,
  updatedAt: string
): Campaign {
  const sourceIndex = campaign.scenes.findIndex((entry) => entry.id === sourceSceneId);
  const duplicateEntry = {
    id: scene.id,
    name: scene.name,
    file: `scenes/${scene.id}.scene.json`,
    mapAssetId: scene.mapAssetId,
    weather: scene.weather,
    folderId
  };
  const scenes = [...campaign.scenes];
  scenes.splice(sourceIndex >= 0 ? sourceIndex + 1 : scenes.length, 0, duplicateEntry);
  return {
    ...campaign,
    scenes,
    updatedAt
  };
}

export function removeFolderFromCampaign(campaign: Campaign, folderId: string, updatedAt: string): Campaign {
  return {
    ...campaign,
    sceneLibrary: {
      ...campaign.sceneLibrary,
      collapsedFolderIds: campaign.sceneLibrary.collapsedFolderIds.filter((collapsedFolderId) => collapsedFolderId !== folderId)
    },
    sceneFolders: campaign.sceneFolders.filter((folder) => folder.id !== folderId),
    scenes: campaign.scenes.map((scene) => (scene.folderId === folderId ? { ...scene, folderId: undefined } : scene)),
    updatedAt
  };
}

export function moveSceneFolder(campaign: Campaign, folderId: string, direction: "up" | "down", updatedAt: string): Campaign {
  const currentIndex = campaign.sceneFolders.findIndex((folder) => folder.id === folderId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= campaign.sceneFolders.length) {
    return campaign;
  }

  const sceneFolders = [...campaign.sceneFolders];
  [sceneFolders[currentIndex], sceneFolders[targetIndex]] = [sceneFolders[targetIndex], sceneFolders[currentIndex]];
  return {
    ...campaign,
    sceneFolders,
    updatedAt
  };
}

export function applyMapAssetToCampaign(
  summaryCampaign: Campaign,
  draftCampaign: Campaign,
  campaignDirty: boolean,
  activeSceneId: string,
  mapAssetId: string
): Campaign {
  const baseCampaign = campaignDirty ? mergeCampaignDraft(summaryCampaign, draftCampaign) : summaryCampaign;
  return {
    ...baseCampaign,
    scenes: baseCampaign.scenes.map((entry) => (entry.id === activeSceneId ? { ...entry, mapAssetId } : entry))
  };
}

export function removeSceneDraft(drafts: Record<string, Scene>, sceneId: string): Record<string, Scene> {
  const next = { ...drafts };
  delete next[sceneId];
  return next;
}

export function removeDirtySceneId(ids: Set<string>, sceneId: string): Set<string> {
  const next = new Set(ids);
  next.delete(sceneId);
  return next;
}
