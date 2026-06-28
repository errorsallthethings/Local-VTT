import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createDefaultScene, projectSceneForPlayer } from "../../src/shared/localvtt";
import { getPlayerViewDisplayStateFromLastState } from "../../src/renderer/lib/player-view";
import { shouldShowPlayerHoldAfterSceneDelete } from "../../src/renderer/hooks/usePlayerViewState";

describe("player view state reconciliation", () => {
  it("restores a Player View scene only when it belongs to the current campaign", () => {
    const campaign = createDefaultCampaign("Player View State");
    campaign.scenes = [{ id: "scene-1", name: "One", file: "scene-1.json" }];
    const scene = { ...createDefaultScene("One"), id: "scene-1" };
    const projection = projectSceneForPlayer(campaign, scene);

    expect(getPlayerViewDisplayStateFromLastState(projection, campaign.scenes)).toEqual({
      playerSceneId: "scene-1",
      playerDisplayMode: "scene"
    });
    expect(getPlayerViewDisplayStateFromLastState(projection, [{ id: "scene-2", name: "Two", file: "scene-2.json" }])).toBeNull();
    expect(getPlayerViewDisplayStateFromLastState(projection, undefined)).toBeNull();
  });

  it("restores Player View idle variants", () => {
    expect(getPlayerViewDisplayStateFromLastState({ type: "idle", variant: "blackout", title: "", message: "" }, [])).toEqual({
      playerSceneId: null,
      playerDisplayMode: "blackout"
    });
    expect(getPlayerViewDisplayStateFromLastState({ type: "idle", title: "Waiting", message: "Hold screen" }, [])).toEqual({
      playerSceneId: null,
      playerDisplayMode: "hold"
    });
  });

  it("ignores invalid last Player View state", () => {
    expect(getPlayerViewDisplayStateFromLastState({ type: "scene", scene: { id: "scene-1" } }, [])).toBeNull();
    expect(getPlayerViewDisplayStateFromLastState(null, [])).toBeNull();
  });

  it("shows the Player View hold screen only after deleting the displayed scene", () => {
    expect(shouldShowPlayerHoldAfterSceneDelete("scene-1", "scene-1", true)).toBe(true);
    expect(shouldShowPlayerHoldAfterSceneDelete("scene-2", "scene-1", true)).toBe(false);
    expect(shouldShowPlayerHoldAfterSceneDelete("scene-1", null, true)).toBe(false);
    expect(shouldShowPlayerHoldAfterSceneDelete("scene-1", "scene-1", false)).toBe(false);
  });
});
