import { describe, expect, it } from "vitest";
import {
  createSceneForCampaign,
  deleteSceneFromCampaign,
  duplicateSceneForCampaign,
  renameSceneInCampaign,
  saveSceneInCampaign
} from "../../electron/sceneLifecycle";
import { createCampaignSceneEntry } from "../../electron/sceneEntries";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";

describe("scene lifecycle helpers", () => {
  it("creates scenes and appends campaign scene entries", () => {
    const campaign = createDefaultCampaign("Campaign");

    const result = createSceneForCampaign(campaign, "", "2026-07-02T12:00:00.000Z");

    expect(result.scene.name).toBe("Untitled Scene");
    expect(result.campaign.scenes).toHaveLength(1);
    expect(result.campaign.scenes[0]).toMatchObject({ id: result.scene.id, name: "Untitled Scene" });
    expect(result.campaign.updatedAt).toBe("2026-07-02T12:00:00.000Z");
  });

  it("duplicates scenes after the source entry and preserves requested folder", () => {
    const campaign = createDefaultCampaign("Campaign");
    const first = { ...createDefaultScene("First"), id: "scene-1" };
    const second = { ...createDefaultScene("Second"), id: "scene-2" };
    campaign.scenes = [createCampaignSceneEntry(first), createCampaignSceneEntry(second)];

    const result = duplicateSceneForCampaign(campaign, first, "", "scene-1", "folder-a", "2026-07-02T12:00:00.000Z");

    expect(result.scene.name).toBe("First Copy");
    expect(result.campaign.scenes.map((entry) => entry.id)).toEqual(["scene-1", result.scene.id, "scene-2"]);
    expect(result.campaign.scenes[1].folderId).toBe("folder-a");
  });

  it("saves scenes and refreshes campaign summary fields", () => {
    const campaign = createDefaultCampaign("Campaign");
    const scene = { ...createDefaultScene("Old"), id: "scene-1", mapAssetId: "map-1" };
    campaign.scenes = [createCampaignSceneEntry(scene)];

    const result = saveSceneInCampaign(campaign, { ...scene, name: "New", mapAssetId: "map-2" }, "2026-07-02T12:00:00.000Z");

    expect(result.scene.updatedAt).toBe("2026-07-02T12:00:00.000Z");
    expect(result.campaign.scenes[0]).toMatchObject({ id: "scene-1", name: "New", mapAssetId: "map-2" });
  });

  it("renames scenes and rejects invalid rename requests", () => {
    const campaign = createDefaultCampaign("Campaign");
    const scene = { ...createDefaultScene("Old"), id: "scene-1" };
    campaign.scenes = [createCampaignSceneEntry(scene)];

    const result = renameSceneInCampaign(campaign, scene, "scene-1", "  New Name  ", "2026-07-02T12:00:00.000Z");

    expect(result.scene.name).toBe("New Name");
    expect(result.campaign.scenes[0].name).toBe("New Name");
    expect(() => renameSceneInCampaign(campaign, scene, "scene-1", "   ")).toThrow("Scene name cannot be empty.");
    expect(() => renameSceneInCampaign(campaign, scene, "other-scene", "New")).toThrow("Invalid scene file.");
  });

  it("deletes scenes from campaign summaries", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [
      { id: "scene-1", name: "One", file: "scenes/scene-1.scene.json" },
      { id: "scene-2", name: "Two", file: "scenes/scene-2.scene.json" }
    ];

    const result = deleteSceneFromCampaign(campaign, "scene-1", "2026-07-02T12:00:00.000Z");

    expect(result.scenes.map((entry) => entry.id)).toEqual(["scene-2"]);
    expect(result.updatedAt).toBe("2026-07-02T12:00:00.000Z");
  });
});
