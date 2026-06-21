import { projectSceneForPlayer, type Campaign, type PlayerSceneProjectionOptions, type Scene } from "../../shared/localvtt";

export interface PlayerViewSceneSyncApi {
  updatePlayerSceneIfOpen: (projection: ReturnType<typeof projectSceneForPlayer>) => Promise<boolean>;
}

export function updatePlayerSceneIfOpen(
  api: PlayerViewSceneSyncApi,
  campaign: Campaign,
  scene: Scene,
  options: PlayerSceneProjectionOptions = {}
): Promise<boolean> {
  return api.updatePlayerSceneIfOpen(projectSceneForPlayer(campaign, scene, options));
}
