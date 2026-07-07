import { describe, expect, it } from "vitest";
import { getTokenAssetUsage } from "../../electron/tokenAssetUsage";
import { createDefaultCampaign, createDefaultScene, type Scene } from "../../src/shared/localvtt";

describe("token asset usage", () => {
  it("counts token asset usage across campaign scenes", async () => {
    const campaign = createCampaignWithScenes(["scene-1", "scene-2", "scene-3"]);
    const scenes = new Map<string, Scene>([
      ["scene-1", sceneWithTokens("scene-1", ["asset-1", "asset-2"])],
      ["scene-2", sceneWithTokens("scene-2", ["asset-1", "asset-1"])],
      ["scene-3", sceneWithTokens("scene-3", ["asset-2"])]
    ]);

    await expect(getTokenAssetUsage(campaign, "asset-1", async (sceneId) => requiredScene(scenes, sceneId))).resolves.toEqual([
      { sceneId: "scene-1", sceneName: "Scene 1", count: 1 },
      { sceneId: "scene-2", sceneName: "Scene 2", count: 2 }
    ]);
  });

  it("ignores scenes that cannot be read", async () => {
    const campaign = createCampaignWithScenes(["scene-1", "scene-2"]);
    const scenes = new Map<string, Scene>([["scene-2", sceneWithTokens("scene-2", ["asset-1"])]]);

    await expect(
      getTokenAssetUsage(campaign, "asset-1", async (sceneId) => {
        if (sceneId === "scene-1") {
          throw new Error("Scene could not be read.");
        }
        return requiredScene(scenes, sceneId);
      })
    ).resolves.toEqual([{ sceneId: "scene-2", sceneName: "Scene 2", count: 1 }]);
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

function sceneWithTokens(sceneId: string, assetIds: string[]): Scene {
  const scene = createDefaultScene(sceneId);
  scene.id = sceneId;
  scene.tokens = assetIds.map((assetId, index) => ({
    id: `${sceneId}-token-${index}`,
    assetId,
    x: index,
    y: index,
    rotation: 0,
    scale: 1,
    hidden: false
  }));
  return scene;
}

function requiredScene(scenes: Map<string, Scene>, sceneId: string): Scene {
  const scene = scenes.get(sceneId);
  if (!scene) {
    throw new Error(`Missing scene ${sceneId}.`);
  }
  return scene;
}
