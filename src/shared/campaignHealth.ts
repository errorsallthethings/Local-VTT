import type { Asset, Campaign, Scene } from "./localvtt.js";

export type CampaignHealthAssetKind = Asset["kind"] | "thumbnail";
export type CampaignHealthSceneReferenceKind = "campaign-scene" | "scene-map" | "scene-token" | "scene-overlay" | "turn-order-entry" | "campaign-player";

export interface CampaignHealthMissingAssetFile {
  assetId: string;
  assetName: string;
  kind: CampaignHealthAssetKind;
  relativePath: string;
}

export interface CampaignHealthSceneFileIssue {
  sceneId: string;
  sceneName: string;
  file: string;
  reason: string;
}

export interface CampaignHealthUnknownAssetReference {
  sceneId?: string;
  sceneName?: string;
  assetId: string;
  owner: CampaignHealthSceneReferenceKind;
}

export interface CampaignHealthUnreferencedAsset {
  assetId: string;
  assetName: string;
  kind: Asset["kind"];
  relativePath: string;
}

export interface CampaignHealthReport {
  missingAssetFiles: CampaignHealthMissingAssetFile[];
  staleThumbnailReferences: CampaignHealthMissingAssetFile[];
  sceneFileIssues: CampaignHealthSceneFileIssue[];
  unknownAssetReferences: CampaignHealthUnknownAssetReference[];
  unreferencedAssets: CampaignHealthUnreferencedAsset[];
}

export function createEmptyCampaignHealthReport(): CampaignHealthReport {
  return {
    missingAssetFiles: [],
    staleThumbnailReferences: [],
    sceneFileIssues: [],
    unknownAssetReferences: [],
    unreferencedAssets: []
  };
}

export function collectSceneAssetReferences(scene: Scene): Array<{ assetId: string; owner: CampaignHealthSceneReferenceKind }> {
  const references: Array<{ assetId: string; owner: CampaignHealthSceneReferenceKind }> = [];
  if (scene.mapAssetId) {
    references.push({ assetId: scene.mapAssetId, owner: "scene-map" });
  }
  for (const token of scene.tokens) {
    if (token.assetId) {
      references.push({ assetId: token.assetId, owner: "scene-token" });
    }
  }
  for (const overlay of scene.overlays) {
    references.push({ assetId: overlay.assetId, owner: "scene-overlay" });
  }
  for (const entry of scene.turnOrder.entries) {
    if (entry.assetId) {
      references.push({ assetId: entry.assetId, owner: "turn-order-entry" });
    }
  }
  return references;
}

export function collectCampaignAssetReferences(campaign: Campaign): Array<{ assetId: string; owner: CampaignHealthSceneReferenceKind }> {
  return campaign.players
    .filter((player) => Boolean(player.assetId))
    .map((player) => ({ assetId: player.assetId as string, owner: "campaign-player" }));
}
