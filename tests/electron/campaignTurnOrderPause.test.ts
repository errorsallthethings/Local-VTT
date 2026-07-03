import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createDefaultScene, type Scene } from "../../src/shared/localvtt";
import { pauseCampaignTurnOrders } from "../../electron/campaignTurnOrderPause";

describe("campaign turn order pause", () => {
  it("pauses and writes only scenes with visible or active turn order", async () => {
    const campaign = campaignWithScenes(["calm", "active", "visible"]);
    const calm = { ...createDefaultScene("Calm"), id: "calm" };
    const active = { ...createDefaultScene("Active"), id: "active" };
    active.turnOrder.active = true;
    const visible = { ...createDefaultScene("Visible"), id: "visible" };
    visible.turnOrder.playerViewVisible = true;
    const scenes = new Map<string, Scene>([
      ["calm", calm],
      ["active", active],
      ["visible", visible]
    ]);
    const writes: Scene[] = [];

    const changed = await pauseCampaignTurnOrders(
      campaign,
      async (sceneId) => requiredScene(scenes, sceneId),
      async (scene) => {
        writes.push(scene);
      }
    );

    expect(changed.map((scene) => scene.id)).toEqual(["active", "visible"]);
    expect(writes).toEqual(changed);
    expect(changed.every((scene) => !scene.turnOrder.active && !scene.turnOrder.playerViewVisible)).toBe(true);
  });

  it("continues when a scene cannot be read", async () => {
    const campaign = campaignWithScenes(["missing", "active"]);
    const active = { ...createDefaultScene("Active"), id: "active" };
    active.turnOrder.active = true;

    const changed = await pauseCampaignTurnOrders(
      campaign,
      async (sceneId) => {
        if (sceneId === "missing") {
          throw new Error("missing scene");
        }
        return active;
      },
      async () => undefined
    );

    expect(changed.map((scene) => scene.id)).toEqual(["active"]);
  });

  it("continues when writing one changed scene fails", async () => {
    const campaign = campaignWithScenes(["first", "second"]);
    const writes: string[] = [];

    const changed = await pauseCampaignTurnOrders(
      campaign,
      async (sceneId) => {
        const scene = { ...createDefaultScene(sceneId), id: sceneId };
        scene.turnOrder.active = true;
        return scene;
      },
      async (scene) => {
        writes.push(scene.id);
        if (scene.id === "first") {
          throw new Error("write failed");
        }
      }
    );

    expect(writes).toEqual(["first", "second"]);
    expect(changed.map((scene) => scene.id)).toEqual(["second"]);
  });
});

function campaignWithScenes(sceneIds: string[]) {
  const campaign = createDefaultCampaign("Turn Order Test");
  campaign.scenes = sceneIds.map((id) => ({
    id,
    name: id,
    file: `scenes/${id}.scene.json`
  }));
  return campaign;
}

function requiredScene(scenes: Map<string, Scene>, sceneId: string): Scene {
  const scene = scenes.get(sceneId);
  if (!scene) {
    throw new Error(`Missing scene ${sceneId}.`);
  }
  return scene;
}
