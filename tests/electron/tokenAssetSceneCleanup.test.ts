import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createDefaultScene, type Scene } from "../../src/shared/localvtt";
import { removeTokenAssetFromCampaignScenes } from "../../electron/tokenAssetSceneCleanup";

describe("token asset scene cleanup", () => {
  it("removes token asset references from campaign scenes and writes changed scenes", async () => {
    const campaign = {
      ...createDefaultCampaign("Cleanup Test"),
      scenes: [
        { id: "scene-1", name: "One", file: "scenes/scene-1.json" },
        { id: "scene-2", name: "Two", file: "scenes/scene-2.json" }
      ]
    };
    const sceneWithToken = {
      ...createDefaultScene("One"),
      id: "scene-1",
      tokens: [
        { id: "token-1", assetId: "asset-1", name: "Hero", x: 1, y: 2, size: 1, visible: true },
        { id: "token-2", assetId: "asset-2", name: "Ally", x: 3, y: 4, size: 1, visible: true }
      ]
    };
    const sceneWithoutToken = { ...createDefaultScene("Two"), id: "scene-2" };
    const writes: Scene[] = [];

    const changedScenes = await removeTokenAssetFromCampaignScenes(
      campaign,
      "asset-1",
      async (sceneId) => (sceneId === "scene-1" ? sceneWithToken : sceneWithoutToken),
      async (scene) => {
        writes.push(scene);
      }
    );

    expect(changedScenes).toHaveLength(1);
    expect(changedScenes[0].id).toBe("scene-1");
    expect(changedScenes[0].tokens.map((token) => token.assetId)).toEqual(["asset-2"]);
    expect(writes).toEqual(changedScenes);
  });

  it("continues when a scene cannot be loaded", async () => {
    const campaign = {
      ...createDefaultCampaign("Cleanup Test"),
      scenes: [
        { id: "missing", name: "Missing", file: "scenes/missing.json" },
        { id: "valid", name: "Valid", file: "scenes/valid.json" }
      ]
    };
    const validScene = {
      ...createDefaultScene("Valid"),
      id: "valid",
      tokens: [{ id: "token-1", assetId: "asset-1", name: "Hero", x: 1, y: 2, size: 1, visible: true }]
    };
    const writes: Scene[] = [];

    const changedScenes = await removeTokenAssetFromCampaignScenes(
      campaign,
      "asset-1",
      async (sceneId) => {
        if (sceneId === "missing") {
          throw new Error("missing scene");
        }
        return validScene;
      },
      async (scene) => {
        writes.push(scene);
      }
    );

    expect(changedScenes.map((scene) => scene.id)).toEqual(["valid"]);
    expect(writes.map((scene) => scene.id)).toEqual(["valid"]);
  });

  it("continues when writing one changed scene fails", async () => {
    const campaign = {
      ...createDefaultCampaign("Cleanup Test"),
      scenes: [
        { id: "first", name: "First", file: "scenes/first.json" },
        { id: "second", name: "Second", file: "scenes/second.json" }
      ]
    };
    const makeScene = (id: string) => ({
      ...createDefaultScene(id),
      id,
      tokens: [{ id: `token-${id}`, assetId: "asset-1", name: id, x: 1, y: 2, size: 1, visible: true }]
    });
    const writes: string[] = [];

    const changedScenes = await removeTokenAssetFromCampaignScenes(
      campaign,
      "asset-1",
      async (sceneId) => makeScene(sceneId),
      async (scene) => {
        writes.push(scene.id);
        if (scene.id === "first") {
          throw new Error("write failed");
        }
      }
    );

    expect(writes).toEqual(["first", "second"]);
    expect(changedScenes.map((scene) => scene.id)).toEqual(["second"]);
  });
});
