import { describe, expect, it } from "vitest";
import {
  applyMapAssetToCampaign,
  getDuplicateSceneName,
  getDirtySceneIdsInFolder,
  getSceneDraftToSave,
  insertSceneEntryAfterSource,
  moveSceneFolder,
  moveSceneEntryToFolder,
  removeDirtySceneId,
  removeFolderFromCampaign,
  removeSceneDraft
} from "../../src/renderer/lib/campaignActions";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";

describe("campaign action helpers", () => {
  it("selects a draft scene before falling back to the active scene", () => {
    const draft = createDefaultScene("Draft");
    draft.id = "scene-1";
    const active = createDefaultScene("Active");
    active.id = "scene-2";

    expect(getSceneDraftToSave("scene-1", { "scene-1": draft }, active)).toBe(draft);
    expect(getSceneDraftToSave("scene-2", {}, active)).toBe(active);
    expect(getSceneDraftToSave("scene-3", {}, active)).toBeNull();
  });

  it("finds dirty scene ids inside a folder", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [
      { id: "scene-1", name: "One", file: "one.json", folderId: "folder-a" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-b" },
      { id: "scene-3", name: "Three", file: "three.json", folderId: "folder-a" }
    ];

    expect(getDirtySceneIdsInFolder(campaign, new Set(["scene-1", "scene-2"]), "folder-a")).toEqual(["scene-1"]);
  });

  it("moves a scene entry to a folder without changing other scene metadata", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [{ id: "scene-1", name: "One", file: "one.json", mapAssetId: "map-old" }];

    expect(moveSceneEntryToFolder(campaign, "scene-1", "folder-a", "now").scenes[0]).toEqual({
      id: "scene-1",
      name: "One",
      file: "one.json",
      mapAssetId: "map-old",
      folderId: "folder-a"
    });
  });

  it("generates unique duplicate scene names", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [
      { id: "scene-1", name: "Vault", file: "vault.json" },
      { id: "scene-2", name: "Vault Copy", file: "vault-copy.json" },
      { id: "scene-3", name: "Vault Copy 2", file: "vault-copy-2.json" }
    ];

    expect(getDuplicateSceneName("Vault", campaign)).toBe("Vault Copy 3");
  });

  it("inserts duplicated scene entries next to the source scene", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [
      { id: "scene-1", name: "One", file: "one.json" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-a" }
    ];
    const duplicate = createDefaultScene("Two Copy");
    duplicate.id = "scene-copy";
    duplicate.mapAssetId = "map-1";

    const next = insertSceneEntryAfterSource(campaign, "scene-2", duplicate, "folder-a", "now");

    expect(next.scenes).toEqual([
      { id: "scene-1", name: "One", file: "one.json" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-a" },
      { id: "scene-copy", name: "Two Copy", file: "scenes/scene-copy.scene.json", folderId: "folder-a", mapAssetId: "map-1" }
    ]);
    expect(next.updatedAt).toBe("now");
  });

  it("removes a folder and unfiles scenes assigned to it", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.sceneFolders = [
      { id: "folder-a", name: "A", color: "#7aa2f7", createdAt: "before" },
      { id: "folder-b", name: "B", color: "#4cbf78", createdAt: "before" }
    ];
    campaign.sceneLibrary = { collapsedFolderIds: ["folder-a", "folder-b"] };
    campaign.scenes = [
      { id: "scene-1", name: "One", file: "one.json", folderId: "folder-a" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-b" }
    ];

    const next = removeFolderFromCampaign(campaign, "folder-a", "now");

    expect(next.sceneFolders.map((folder) => folder.id)).toEqual(["folder-b"]);
    expect(next.sceneLibrary.collapsedFolderIds).toEqual(["folder-b"]);
    expect(next.scenes).toEqual([
      { id: "scene-1", name: "One", file: "one.json", folderId: undefined },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-b" }
    ]);
    expect(next.updatedAt).toBe("now");
  });

  it("moves scene folders up and down without changing scenes", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.sceneFolders = [
      { id: "folder-a", name: "A", color: "#7aa2f7", createdAt: "before" },
      { id: "folder-b", name: "B", color: "#4cbf78", createdAt: "before" },
      { id: "folder-c", name: "C", color: "#d99a35", createdAt: "before" }
    ];
    campaign.scenes = [{ id: "scene-1", name: "One", file: "one.json", folderId: "folder-b" }];

    const movedUp = moveSceneFolder(campaign, "folder-b", "up", "now");
    const movedDown = moveSceneFolder(campaign, "folder-b", "down", "later");

    expect(movedUp.sceneFolders.map((folder) => folder.id)).toEqual(["folder-b", "folder-a", "folder-c"]);
    expect(movedUp.scenes).toBe(campaign.scenes);
    expect(movedUp.updatedAt).toBe("now");
    expect(movedDown.sceneFolders.map((folder) => folder.id)).toEqual(["folder-a", "folder-c", "folder-b"]);
    expect(movedDown.updatedAt).toBe("later");
  });

  it("does not move scene folders past the list boundaries", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.sceneFolders = [
      { id: "folder-a", name: "A", color: "#7aa2f7", createdAt: "before" },
      { id: "folder-b", name: "B", color: "#4cbf78", createdAt: "before" }
    ];

    expect(moveSceneFolder(campaign, "folder-a", "up", "now")).toBe(campaign);
    expect(moveSceneFolder(campaign, "folder-b", "down", "now")).toBe(campaign);
    expect(moveSceneFolder(campaign, "missing", "up", "now")).toBe(campaign);
  });

  it("applies imported map assets while preserving dirty campaign draft fields", () => {
    const summary = createDefaultCampaign("Summary");
    summary.scenes = [{ id: "scene-1", name: "Summary Scene", file: "summary.json" }];
    const draft = createDefaultCampaign("Draft");
    draft.description = "Unsaved description";
    draft.scenes = [{ id: "scene-1", name: "Draft Scene", file: "draft.json", folderId: "folder-a" }];

    const next = applyMapAssetToCampaign(summary, draft, true, "scene-1", "map-new");

    expect(next.description).toBe("Unsaved description");
    expect(next.scenes[0]).toEqual({
      id: "scene-1",
      name: "Summary Scene",
      file: "summary.json",
      folderId: "folder-a",
      mapAssetId: "map-new"
    });
  });

  it("removes scene draft and dirty ids immutably", () => {
    const scene = createDefaultScene("Draft");
    const drafts = { "scene-1": scene, "scene-2": scene };
    const dirtyIds = new Set(["scene-1", "scene-2"]);

    expect(removeSceneDraft(drafts, "scene-1")).toEqual({ "scene-2": scene });
    expect(drafts).toHaveProperty("scene-1");
    expect([...removeDirtySceneId(dirtyIds, "scene-1")]).toEqual(["scene-2"]);
    expect(dirtyIds.has("scene-1")).toBe(true);
  });
});
