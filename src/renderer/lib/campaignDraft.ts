import type { Campaign } from "../../shared/localvtt";

export function mergeCampaignDraft(summaryCampaign: Campaign, draftCampaign: Campaign): Campaign {
  const draftScenesById = new Map(draftCampaign.scenes.map((scene) => [scene.id, scene]));
  return {
    ...summaryCampaign,
    name: draftCampaign.name,
    description: draftCampaign.description,
    sceneFolders: draftCampaign.sceneFolders,
    scenes: summaryCampaign.scenes.map((scene) => {
      const draftScene = draftScenesById.get(scene.id);
      return draftScene
        ? {
            ...scene,
            folderId: draftScene.folderId,
            mapAssetId: scene.mapAssetId ?? draftScene.mapAssetId
          }
        : scene;
    }),
    playerDisplay: draftCampaign.playerDisplay,
    updatedAt: draftCampaign.updatedAt
  };
}
