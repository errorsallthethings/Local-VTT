import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createDefaultScene, projectSceneForPlayer, type DrawingElement } from "../../src/shared/localvtt";
import { getPlayerViewDisplayStateFromLastState } from "../../src/renderer/lib/player-view";
import {
  getPlayerSceneAutoSyncAction,
  getPlayerTemplatePreviewSyncScene,
  shouldShowPlayerHoldAfterSceneDelete
} from "../../src/renderer/hooks/usePlayerViewState";

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

  it("syncs the active scene only when Player View is showing that scene", () => {
    expect(
      getPlayerSceneAutoSyncAction({
        hasCampaign: true,
        activeSceneId: "scene-1",
        playerSceneId: "scene-1",
        playerDisplayMode: "scene",
        skipNextAutoSync: false
      })
    ).toBe("sync");
    expect(
      getPlayerSceneAutoSyncAction({
        hasCampaign: true,
        activeSceneId: "scene-1",
        playerSceneId: "scene-1",
        playerDisplayMode: "scene",
        skipNextAutoSync: true
      })
    ).toBe("skip-once");
    expect(
      getPlayerSceneAutoSyncAction({
        hasCampaign: true,
        activeSceneId: "scene-2",
        playerSceneId: "scene-1",
        playerDisplayMode: "scene",
        skipNextAutoSync: false
      })
    ).toBe("ignore");
    expect(
      getPlayerSceneAutoSyncAction({
        hasCampaign: true,
        activeSceneId: "scene-1",
        playerSceneId: "scene-1",
        playerDisplayMode: "hold",
        skipNextAutoSync: false
      })
    ).toBe("ignore");
    expect(
      getPlayerSceneAutoSyncAction({
        hasCampaign: false,
        activeSceneId: "scene-1",
        playerSceneId: "scene-1",
        playerDisplayMode: "scene",
        skipNextAutoSync: false
      })
    ).toBe("ignore");
  });

  it("publishes and clears temporary template preview scenes without persisting preview drawings", () => {
    const scene = { ...createDefaultScene("Previewed"), id: "scene-1" };
    scene.drawings = [
      { id: "template-preview", kind: "rectangle", points: [], color: "#fff", opacity: 1, strokeWidth: 2, visibleInPlayer: true },
      { id: "saved-drawing", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 2, visibleInPlayer: true }
    ];
    const previewDrawing: DrawingElement = {
      id: "template-preview",
      kind: "circle",
      points: [{ x: 1, y: 1 }],
      color: "#f5d98a",
      opacity: 0.75,
      strokeWidth: 4,
      visibleInPlayer: true
    };

    const published = getPlayerTemplatePreviewSyncScene({
      activeScene: scene,
      hasCampaign: true,
      playerSceneId: "scene-1",
      playerDisplayMode: "scene",
      templatePreviewVisibleInPlayer: true,
      playerTemplatePreviewDrawing: previewDrawing,
      previewPublished: false
    });

    expect(published.previewPublished).toBe(true);
    expect(published.scene?.drawings).toEqual([scene.drawings[1], previewDrawing]);
    expect(scene.drawings[0].kind).toBe("rectangle");

    const cleared = getPlayerTemplatePreviewSyncScene({
      activeScene: scene,
      hasCampaign: true,
      playerSceneId: "scene-1",
      playerDisplayMode: "scene",
      templatePreviewVisibleInPlayer: false,
      playerTemplatePreviewDrawing: previewDrawing,
      previewPublished: true
    });

    expect(cleared).toEqual({ scene, previewPublished: false });

    expect(
      getPlayerTemplatePreviewSyncScene({
        activeScene: scene,
        hasCampaign: true,
        playerSceneId: "scene-1",
        playerDisplayMode: "scene",
        templatePreviewVisibleInPlayer: false,
        playerTemplatePreviewDrawing: null,
        previewPublished: false
      })
    ).toEqual({ scene: null, previewPublished: false });
    expect(
      getPlayerTemplatePreviewSyncScene({
        activeScene: scene,
        hasCampaign: true,
        playerSceneId: "other-scene",
        playerDisplayMode: "scene",
        templatePreviewVisibleInPlayer: true,
        playerTemplatePreviewDrawing: previewDrawing,
        previewPublished: true
      })
    ).toEqual({ scene: null, previewPublished: false });
  });
});
