import { describe, expect, it } from "vitest";
import { mapAssetUsedByOtherScenes } from "../../electron/mapAssetUsage";
import { createDefaultCampaign, createDefaultScene, type Scene } from "../../src/shared/localvtt";

describe("map asset usage", () => {
  it("ignores the current scene when checking map reuse", async () => {
    const campaign = createCampaignWithScenes(["scene-1"]);
    const scenes = new Map<string, Scene>([["scene-1", sceneWithMap("scene-1", "map-1")]]);

    await expect(mapAssetUsedByOtherScenes(campaign, "map-1", "scene-1", async (sceneId) => requiredScene(scenes, sceneId))).resolves.toBe(false);
  });

  it("detects map usage in another scene", async () => {
    const campaign = createCampaignWithScenes(["scene-1", "scene-2"]);
    const scenes = new Map<string, Scene>([
      ["scene-1", sceneWithMap("scene-1", "map-1")],
      ["scene-2", sceneWithMap("scene-2", "map-1")]
    ]);

    await expect(mapAssetUsedByOtherScenes(campaign, "map-1", "scene-1", async (sceneId) => requiredScene(scenes, sceneId))).resolves.toBe(true);
  });

  it("ignores scenes that cannot be read", async () => {
    const campaign = createCampaignWithScenes(["scene-1", "scene-2", "scene-3"]);
    const scenes = new Map<string, Scene>([["scene-3", sceneWithMap("scene-3", "map-2")]]);

    await expect(
      mapAssetUsedByOtherScenes(campaign, "map-1", "scene-1", async (sceneId) => {
        if (sceneId === "scene-2") {
          throw new Error("Scene could not be read.");
        }
        return requiredScene(scenes, sceneId);
      })
    ).resolves.toBe(false);
  });
});

function createCampaignWithScenes(sceneIds: string[]) {
  const campaign = createDefaultCampaign("Campaign");
  campaign.scenes = sceneIds.map((id, index) => ({
    id,
    name: `Scene ${index + 1}`,
    file: `scenes/${id}.scene.json`
  }));
  return campaign;
}

function sceneWithMap(sceneId: string, mapAssetId?: string): Scene {
  const scene = createDefaultScene(sceneId);
  scene.id = sceneId;
  scene.mapAssetId = mapAssetId;
  return scene;
}

function requiredScene(scenes: Map<string, Scene>, sceneId: string): Scene {
  const scene = scenes.get(sceneId);
  if (!scene) {
    throw new Error(`Missing scene ${sceneId}.`);
  }
  return scene;
}
