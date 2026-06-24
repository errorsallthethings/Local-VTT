import { isPlayerIdleState, isPlayerSceneProjection, type CampaignSceneEntry } from "../../../shared/localvtt";

export type PlayerDisplayMode = "scene" | "hold" | "blackout";

export interface PlayerViewDisplayState {
  playerSceneId: string | null;
  playerDisplayMode: PlayerDisplayMode;
}

export function getPlayerViewDisplayStateFromLastState(
  state: unknown,
  scenes: readonly CampaignSceneEntry[] | undefined
): PlayerViewDisplayState | null {
  if (isPlayerSceneProjection(state) && scenes?.some((scene) => scene.id === state.scene.id)) {
    return { playerSceneId: state.scene.id, playerDisplayMode: "scene" };
  }
  if (isPlayerIdleState(state)) {
    return { playerSceneId: null, playerDisplayMode: state.variant ?? "hold" };
  }
  return null;
}
