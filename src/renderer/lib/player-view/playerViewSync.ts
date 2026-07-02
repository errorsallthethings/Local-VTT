import { projectSceneForPlayer, type Campaign, type PlayerSceneProjectionOptions, type Scene } from "../../../shared/localvtt";
import { logRendererWarning } from "../rendererDiagnostics";

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

export function updatePlayerSceneIfOpenInBackground(
  api: PlayerViewSceneSyncApi,
  campaign: Campaign,
  scene: Scene,
  options: PlayerSceneProjectionOptions = {}
): void {
  void updatePlayerSceneIfOpen(api, campaign, scene, options).catch((caught) => {
    logRendererWarning("LOCALVTT_PLAYER_VIEW_SYNC_FAILED", caught);
  });
}
