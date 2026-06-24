import { projectSceneForPlayer, type Campaign, type PlayerSceneProjectionOptions, type Scene } from "../../../shared/localvtt";

export interface PlayerViewSceneSyncApi {
  sendSceneToPlayer: (projection: ReturnType<typeof projectSceneForPlayer>) => Promise<boolean>;
  updatePlayerSceneIfOpen: (projection: ReturnType<typeof projectSceneForPlayer>) => Promise<boolean>;
}

export function sendSceneToPlayer(
  api: PlayerViewSceneSyncApi,
  campaign: Campaign,
  scene: Scene,
  options: PlayerSceneProjectionOptions = {}
): Promise<boolean> {
  return api.sendSceneToPlayer(projectSceneForPlayer(campaign, scene, options));
}

export function updatePlayerSceneIfOpen(
  api: PlayerViewSceneSyncApi,
  campaign: Campaign,
  scene: Scene,
  options: PlayerSceneProjectionOptions = {}
): Promise<boolean> {
  return api.updatePlayerSceneIfOpen(projectSceneForPlayer(campaign, scene, options));
}
