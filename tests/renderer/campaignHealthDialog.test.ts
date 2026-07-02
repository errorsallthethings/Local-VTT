import { describe, expect, it } from "vitest";
import { getCampaignHealthIssueCount } from "../../src/renderer/components/modals/CampaignHealthDialog";
import { createEmptyCampaignHealthReport, type CampaignHealthReport } from "../../src/shared/campaignHealth";

describe("campaign health dialog", () => {
  it("counts diagnostic items without double-counting stale thumbnails", () => {
    const health: CampaignHealthReport = {
      ...createEmptyCampaignHealthReport(),
      missingAssetFiles: [
        {
          assetId: "map-1",
          assetName: "Map",
          kind: "thumbnail",
          relativePath: "assets/thumbnails/map.jpg"
        }
      ],
      staleThumbnailReferences: [
        {
          assetId: "map-1",
          assetName: "Map",
          kind: "thumbnail",
          relativePath: "assets/thumbnails/map.jpg"
        }
      ],
      sceneFileIssues: [
        {
          sceneId: "scene-1",
          sceneName: "Scene",
          file: "scenes/scene-1.scene.json",
          reason: "Missing"
        }
      ],
      unknownAssetReferences: [
        {
          assetId: "missing-token",
          owner: "scene-token",
          sceneId: "scene-1",
          sceneName: "Scene"
        }
      ],
      unreferencedAssets: [
        {
          assetId: "orphan",
          assetName: "Orphan",
          kind: "token",
          relativePath: "assets/tokens/orphan.png"
        }
      ]
    };

    expect(getCampaignHealthIssueCount(health)).toBe(4);
  });
});
