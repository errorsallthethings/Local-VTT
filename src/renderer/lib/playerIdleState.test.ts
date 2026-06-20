import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PLAYER_HOLD_STATE, PLAYER_BLACKOUT_STATE, showDefaultPlayerHold, showPlayerBlackout } from "./playerIdleState";

describe("player idle state helpers", () => {
  it("shows the default hold state", async () => {
    const api = { showPlayerIdle: vi.fn().mockResolvedValue(undefined) };

    await showDefaultPlayerHold(api);

    expect(api.showPlayerIdle).toHaveBeenCalledWith(
      DEFAULT_PLAYER_HOLD_STATE.title,
      DEFAULT_PLAYER_HOLD_STATE.message,
      DEFAULT_PLAYER_HOLD_STATE.variant
    );
  });

  it("shows the blackout state", async () => {
    const api = { showPlayerIdle: vi.fn().mockResolvedValue(undefined) };

    await showPlayerBlackout(api);

    expect(api.showPlayerIdle).toHaveBeenCalledWith(
      PLAYER_BLACKOUT_STATE.title,
      PLAYER_BLACKOUT_STATE.message,
      PLAYER_BLACKOUT_STATE.variant
    );
  });
});
