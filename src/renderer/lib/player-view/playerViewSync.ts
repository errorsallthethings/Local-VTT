import { projectSceneForPlayer, type Campaign, type PlayerSceneProjectionOptions, type Scene } from "../../../shared/localvtt";
import type { PlayerViewOpenOptions, PlayerViewOpenResult } from "../../../shared/localVttApi";
import { logRendererWarning } from "../rendererDiagnostics";
import { getPlayerViewOpenOptions, getPlayerViewOpenWarning } from "./playerViewOrchestration";

export interface PlayerViewSceneSyncApi {
  sendSceneToPlayer: (projection: ReturnType<typeof projectSceneForPlayer>) => Promise<boolean>;
  updatePlayerSceneIfOpen: (projection: ReturnType<typeof projectSceneForPlayer>) => Promise<boolean>;
}

export interface PlayerViewOpenAndSyncApi extends PlayerViewSceneSyncApi {
  openPlayerView: (options?: PlayerViewOpenOptions) => Promise<PlayerViewOpenResult>;
}

export interface PlayerViewOpenAndSendResult {
  sent: boolean;
  warning: string | null;
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

export async function openAndSendSceneToPlayer(
  api: PlayerViewOpenAndSyncApi,
  campaign: Campaign,
  scene: Scene,
  options: PlayerSceneProjectionOptions = {}
): Promise<PlayerViewOpenAndSendResult> {
  const openResult = await api.openPlayerView(getPlayerViewOpenOptions(campaign.playerDisplay));
  const sent = await sendSceneToPlayer(api, campaign, scene, options);
  return {
    sent,
    warning: getPlayerViewOpenWarning(openResult, campaign.playerDisplay)
  };
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
