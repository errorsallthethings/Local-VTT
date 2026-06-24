import type { PlayerIdleState } from "../../../shared/localvtt";

export const DEFAULT_PLAYER_HOLD_STATE: PlayerIdleState = {
  type: "idle",
  variant: "hold",
  title: "Waiting for Next Scene",
  message: "The GM is preparing the next map."
};

export const PLAYER_BLACKOUT_STATE: PlayerIdleState = {
  type: "idle",
  variant: "blackout",
  title: "",
  message: ""
};

type PlayerIdleApi = {
  showPlayerIdle: (title: string, message: string, variant?: PlayerIdleState["variant"]) => Promise<unknown>;
};

export async function showDefaultPlayerHold(api: PlayerIdleApi = window.localVtt): Promise<void> {
  await api.showPlayerIdle(DEFAULT_PLAYER_HOLD_STATE.title, DEFAULT_PLAYER_HOLD_STATE.message, DEFAULT_PLAYER_HOLD_STATE.variant);
}

export async function showPlayerBlackout(api: PlayerIdleApi = window.localVtt): Promise<void> {
  await api.showPlayerIdle(PLAYER_BLACKOUT_STATE.title, PLAYER_BLACKOUT_STATE.message, PLAYER_BLACKOUT_STATE.variant);
}
