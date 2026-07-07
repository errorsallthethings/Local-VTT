import type { Asset, Campaign } from "../../../shared/localvtt";

export function mergeCampaignDraft(summaryCampaign: Campaign, draftCampaign: Campaign): Campaign {
  const draftScenesById = new Map(draftCampaign.scenes.map((scene) => [scene.id, scene]));
  const draftAssetsById = new Map(draftCampaign.assets.map((asset) => [asset.id, asset]));
  return {
    ...summaryCampaign,
    name: draftCampaign.name,
    description: draftCampaign.description,
    sceneLibrary: draftCampaign.sceneLibrary,
    sceneFolders: draftCampaign.sceneFolders,
    scenes: summaryCampaign.scenes.map((scene) => {
      const draftScene = draftScenesById.get(scene.id);
      return draftScene
        ? {
            ...scene,
            folderId: draftScene.folderId,
            mapAssetId: scene.mapAssetId ?? draftScene.mapAssetId,
            weather: draftScene.weather ?? scene.weather
          }
        : scene;
    }),
    assets: summaryCampaign.assets.map((asset) => mergeAssetDraft(asset, draftAssetsById.get(asset.id))),
    playerDisplay: draftCampaign.playerDisplay,
    activePlayerDisplayProfileId: draftCampaign.activePlayerDisplayProfileId,
    playerDisplayProfiles: draftCampaign.playerDisplayProfiles,
    diceSettings: draftCampaign.diceSettings,
    updatedAt: draftCampaign.updatedAt
  };
}

function mergeAssetDraft(summaryAsset: Asset, draftAsset?: Asset): Asset {
  if (!draftAsset) {
    return summaryAsset;
  }
  return {
    ...summaryAsset,
    name: draftAsset.name,
    tokenDefaults: draftAsset.tokenDefaults
  };
}
