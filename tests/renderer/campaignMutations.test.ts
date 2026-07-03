import { describe, expect, it } from "vitest";
import { createDefaultCampaign, DEFAULT_SCENE_FOLDER_COLOR, type Asset } from "../../src/shared/localvtt";
import {
  renameCampaignTokenAsset,
  setCampaignTokenAssetDefaults,
  setSceneFolderColor,
  submitSceneFolderName
} from "../../src/renderer/lib/campaign";

const now = "2026-07-03T12:00:00.000Z";

function tokenAsset(id = "token-1"): Asset {
  return {
    id,
    name: "Old Token",
    kind: "token",
    mediaType: "image",
    relativePath: `assets/tokens/${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}

describe("campaign mutation helpers", () => {
  it("creates and renames scene folders from trimmed names", () => {
    const campaign = createDefaultCampaign("Folders");
    const created = submitSceneFolderName(campaign, { mode: "create", folderId: "folder-1", name: "  Act One  " }, now);

    expect(created?.sceneFolders).toEqual([{ id: "folder-1", name: "Act One", color: DEFAULT_SCENE_FOLDER_COLOR, createdAt: now }]);
    expect(created?.updatedAt).toBe(now);

    const renamed = submitSceneFolderName(created!, { mode: "rename", folderId: "folder-1", name: "  Finale  " }, "later");
    expect(renamed?.sceneFolders[0]).toMatchObject({ id: "folder-1", name: "Finale", color: DEFAULT_SCENE_FOLDER_COLOR });
    expect(renamed?.updatedAt).toBe("later");
    expect(submitSceneFolderName(campaign, { mode: "create", folderId: "folder-2", name: "   " }, now)).toBeNull();
  });

  it("sets scene folder colors", () => {
    const campaign = {
      ...createDefaultCampaign("Folders"),
      sceneFolders: [{ id: "folder-1", name: "Folder", color: "#111111", createdAt: now }]
    };

    expect(setSceneFolderColor(campaign, "folder-1", "#abcdef", "later")).toMatchObject({
      sceneFolders: [{ id: "folder-1", name: "Folder", color: "#abcdef", createdAt: now }],
      updatedAt: "later"
    });
  });

  it("renames token assets and rejects blank names", () => {
    const campaign = { ...createDefaultCampaign("Assets"), assets: [tokenAsset()] };
    const renamed = renameCampaignTokenAsset(campaign, "token-1", "  Hero  ", now);

    expect(renamed?.assets[0].name).toBe("Hero");
    expect(renamed?.updatedAt).toBe(now);
    expect(renameCampaignTokenAsset(campaign, "token-1", "   ", now)).toBeNull();
  });

  it("sets token asset defaults", () => {
    const campaign = { ...createDefaultCampaign("Assets"), assets: [tokenAsset()] };
    const tokenDefaults = { borderColor: "#ff0000", footprintVisible: true };

    const updated = setCampaignTokenAssetDefaults(campaign, "token-1", tokenDefaults, now);

    expect(updated.assets[0].tokenDefaults).toEqual(tokenDefaults);
    expect(updated.updatedAt).toBe(now);
  });
});
