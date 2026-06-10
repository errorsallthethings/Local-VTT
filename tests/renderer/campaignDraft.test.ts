import { describe, expect, it } from "vitest";
import { mergeCampaignDraft } from "../../src/renderer/lib/campaignDraft";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";

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
  draft.sceneFolders = [{ id: "folder", name: "Dungeon", color: "#4cbf78", createdAt: "2026-06-05T00:00:00.000Z" }];
  draft.sceneLibrary = { collapsedFolderIds: ["folder"] };
  const draftWeather = createDefaultScene("Weather Draft").weather;
  draftWeather.enabled = true;
  draftWeather.effects.rain.enabled = true;
  draft.scenes = [
    { id: "scene-1", name: "Draft Scene One", file: "draft/scene-1.scene.json", folderId: "folder", mapAssetId: "draft-map" },
    { id: "scene-2", name: "Draft Scene Two", file: "draft/scene-2.scene.json", folderId: "folder", mapAssetId: "draft-map-2", weather: draftWeather }
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
    { id: "scene-2", name: "Scene Two", file: "scenes/scene-2.scene.json", mapAssetId: "draft-map-2", folderId: "folder", weather: draftWeather }
  ]);
});

it("preserves unsaved library token asset edits while keeping summary asset membership", () => {
  const summary = createDefaultCampaign("Summary");
  summary.assets = [
    {
      id: "token-1",
      name: "Original",
      kind: "token",
      mediaType: "image",
      relativePath: "assets/tokens/token-1.png",
      thumbnailRelativePath: "assets/thumbnails/token-1.jpg",
      originalFileName: "token-1.png",
      createdAt: "2026-06-05T00:00:00.000Z"
    },
    {
      id: "token-2",
      name: "New Import",
      kind: "token",
      mediaType: "image",
      relativePath: "assets/tokens/token-2.png",
      originalFileName: "token-2.png",
      createdAt: "2026-06-05T01:00:00.000Z"
    }
  ];
  const draft = createDefaultCampaign("Draft");
  draft.assets = [
    {
      ...summary.assets[0],
      name: "Renamed Library Token",
      tokenDefaults: {
        borderStyle: "dashed",
        borderColor: "#ff3366",
        borderWidth: 24
      }
    },
    {
      id: "deleted-token",
      name: "Deleted Token",
      kind: "token",
      mediaType: "image",
      relativePath: "assets/tokens/deleted-token.png",
      originalFileName: "deleted-token.png",
      createdAt: "2026-06-04T00:00:00.000Z"
    }
  ];

  const merged = mergeCampaignDraft(summary, draft);

  expect(merged.assets.map((asset) => asset.id)).toEqual(["token-1", "token-2"]);
  expect(merged.assets[0]).toMatchObject({
    id: "token-1",
    name: "Renamed Library Token",
    tokenDefaults: {
      borderStyle: "dashed",
      borderColor: "#ff3366",
      borderWidth: 24
    },
    relativePath: "assets/tokens/token-1.png",
    thumbnailRelativePath: "assets/thumbnails/token-1.jpg"
  });
  expect(merged.assets[1].name).toBe("New Import");
});
});
