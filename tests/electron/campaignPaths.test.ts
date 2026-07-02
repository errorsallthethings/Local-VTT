import path from "node:path";
import { describe, expect, it } from "vitest";
import { campaignFile, requiredCampaignFolders, sceneFile } from "../../electron/campaignPaths";

describe("campaign path helpers", () => {
  it("builds campaign and scene metadata paths", () => {
    expect(campaignFile("campaign-root")).toBe(path.join("campaign-root", "campaign.json"));
    expect(sceneFile("campaign-root", "scene-1")).toBe(path.join("campaign-root", "scenes", "scene-1.scene.json"));
  });

  it("lists required campaign folders", () => {
    expect(requiredCampaignFolders("campaign-root")).toEqual([
      "campaign-root",
      path.join("campaign-root", "assets", "maps"),
      path.join("campaign-root", "assets", "tokens"),
      path.join("campaign-root", "assets", "overlays"),
      path.join("campaign-root", "assets", "effects"),
      path.join("campaign-root", "assets", "handouts"),
      path.join("campaign-root", "assets", "thumbnails"),
      path.join("campaign-root", "scenes")
    ]);
  });
});
