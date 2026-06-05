import { describe, expect, it } from "vitest";
import { mergeCampaignDraft } from "../../src/renderer/lib/campaignDraft";
import { createDefaultCampaign } from "../../src/shared/localvtt";

describe("mergeCampaignDraft", () => {
it("preserves summary scene metadata while applying draft sidebar fields", () => {
  const summary = createDefaultCampaign("Summary");
  summary.description = "Old description";
  summary.scenes = [
    { id: "scene-1", name: "Scene One", file: "scenes/scene-1.scene.json", mapAssetId: "summary-map" },
    { id: "scene-2", name: "Scene Two", file: "scenes/scene-2.scene.json" }
  ];

  const draft = createDefaultCampaign("Draft");
  draft.description = "New description";
  draft.updatedAt = "2026-06-05T12:00:00.000Z";
  draft.sceneFolders = [{ id: "folder", name: "Dungeon", createdAt: "2026-06-05T00:00:00.000Z" }];
  draft.sceneLibrary = { collapsedFolderIds: ["folder"] };
  draft.scenes = [
    { id: "scene-1", name: "Draft Scene One", file: "draft/scene-1.scene.json", folderId: "folder", mapAssetId: "draft-map" },
    { id: "scene-2", name: "Draft Scene Two", file: "draft/scene-2.scene.json", folderId: "folder", mapAssetId: "draft-map-2" }
  ];
  draft.playerDisplay = { ...draft.playerDisplay, pixelsPerInch: 144 };

  const merged = mergeCampaignDraft(summary, draft);

  expect(merged.name).toBe("Draft");
  expect(merged.description).toBe("New description");
  expect(merged.updatedAt).toBe(draft.updatedAt);
  expect(merged.sceneFolders).toEqual(draft.sceneFolders);
  expect(merged.sceneLibrary).toEqual({ collapsedFolderIds: ["folder"] });
  expect(merged.playerDisplay.pixelsPerInch).toBe(144);
  expect(merged.scenes).toEqual([
    { id: "scene-1", name: "Scene One", file: "scenes/scene-1.scene.json", mapAssetId: "summary-map", folderId: "folder" },
    { id: "scene-2", name: "Scene Two", file: "scenes/scene-2.scene.json", mapAssetId: "draft-map-2", folderId: "folder" }
  ]);
});
});
