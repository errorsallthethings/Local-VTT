import type { Campaign, Scene } from "../../shared/localvtt";
import { mergeCampaignDraft } from "./campaignDraft";

export function getSceneDraftToSave(
  sceneId: string,
  sceneDrafts: Record<string, Scene>,
  activeScene: Scene | null
): Scene | null {
  return sceneDrafts[sceneId] ?? (activeScene?.id === sceneId ? activeScene : null);
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

export function removeFolderFromCampaign(campaign: Campaign, folderId: string, updatedAt: string): Campaign {
  return {
    ...campaign,
    sceneFolders: campaign.sceneFolders.filter((folder) => folder.id !== folderId),
    scenes: campaign.scenes.map((scene) => (scene.folderId === folderId ? { ...scene, folderId: undefined } : scene)),
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
