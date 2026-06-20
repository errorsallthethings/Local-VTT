import type { Asset, Campaign, Scene, Token } from "../../shared/localvtt";
import { getSelectedItemIds } from "./selectionIds";

export type TokenLibrarySort = "name-asc" | "newest" | "oldest";

export function filterTokenLibraryAssets(assets: Asset[], query: string, sort: TokenLibrarySort): Asset[] {
  const normalizedQuery = query.trim().toLowerCase();
  return [...assets]
    .filter((asset) => !normalizedQuery || `${asset.name} ${asset.originalFileName}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => sortTokenAssets(a, b, sort));
}

export function getSelectedTokenLibraryAssetIds(selectedTokenAssetId: string | undefined, selectedTokenAssetIds: string[]): Set<string> {
  return getSelectedItemIds(selectedTokenAssetId, selectedTokenAssetIds);
}

export function getSelectedTokenLibraryAsset(assets: Asset[], selectedTokenAssetId: string | undefined): Asset | null {
  return selectedTokenAssetId ? (assets.find((asset) => asset.id === selectedTokenAssetId) ?? null) : null;
}

export interface SelectedTokenAssetIds {
  selectedTokenAssetId: string | undefined;
  selectedTokenAssetIds: string[];
}

export function getSelectedTokenAssetIds(tokens: readonly Token[] | undefined, selectedTokenId: string | null, selectedTokenIds: readonly string[]): SelectedTokenAssetIds {
  if (!tokens || tokens.length === 0) {
    return { selectedTokenAssetId: undefined, selectedTokenAssetIds: [] };
  }
  const selectedTokenIdSet = new Set(selectedTokenIds);
  let selectedTokenAssetId: string | undefined;
  const selectedTokenAssetIds: string[] = [];
  for (const token of tokens) {
    if (token.id === selectedTokenId) {
      selectedTokenAssetId = token.assetId;
    }
    if (selectedTokenIdSet.has(token.id) && token.assetId) {
      selectedTokenAssetIds.push(token.assetId);
    }
  }
  return { selectedTokenAssetId, selectedTokenAssetIds };
}

export function removeSceneTokensByAsset(scene: Scene, assetId: string): Scene {
  if (!scene.tokens.some((token) => token.assetId === assetId)) {
    return scene;
  }
  return {
    ...scene,
    tokens: scene.tokens.filter((token) => token.assetId !== assetId),
    updatedAt: new Date().toISOString()
  };
}

export interface TokenAssetUsage {
  sceneId: string;
  sceneName: string;
  count: number;
}

export function mergeTokenAssetUsage(
  savedUsage: TokenAssetUsage[],
  campaign: Campaign,
  sceneDrafts: Record<string, Scene>,
  activeScene: Scene | null,
  assetId: string
): TokenAssetUsage[] {
  const sceneOrder = new Map(campaign.scenes.map((scene, index) => [scene.id, index]));
  const sceneNames = new Map(campaign.scenes.map((scene) => [scene.id, scene.name]));
  const usageByScene = new Map(savedUsage.map((usage) => [usage.sceneId, usage]));
  const localScenes = new Map(Object.entries(sceneDrafts));
  if (activeScene) {
    localScenes.set(activeScene.id, activeScene);
  }

  for (const [sceneId, scene] of localScenes) {
    const count = scene.tokens.filter((token) => token.assetId === assetId).length;
    if (count > 0) {
      usageByScene.set(sceneId, {
        sceneId,
        sceneName: sceneNames.get(sceneId) ?? scene.name,
        count
      });
    } else {
      usageByScene.delete(sceneId);
    }
  }

  return [...usageByScene.values()].sort((a, b) => (sceneOrder.get(a.sceneId) ?? Number.MAX_SAFE_INTEGER) - (sceneOrder.get(b.sceneId) ?? Number.MAX_SAFE_INTEGER));
}

function sortTokenAssets(a: Asset, b: Asset, sort: TokenLibrarySort): number {
  if (sort === "newest" || sort === "oldest") {
    const direction = sort === "newest" ? -1 : 1;
    const dateDelta = (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * direction;
    if (dateDelta !== 0) {
      return dateDelta;
    }
  }
  return getAssetLabel(a).localeCompare(getAssetLabel(b), undefined, { sensitivity: "base" });
}

function getAssetLabel(asset: Asset): string {
  return asset.name || asset.originalFileName || "Token";
}
