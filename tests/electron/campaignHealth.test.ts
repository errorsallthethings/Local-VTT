import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { inspectCampaignHealth } from "../../electron/campaignHealth";
import { createDefaultCampaign, createDefaultScene, type Asset } from "../../src/shared/localvtt";

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.name ?? patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.relativePath,
    thumbnailRelativePath: patch.thumbnailRelativePath,
    originalFileName: patch.originalFileName ?? path.basename(patch.relativePath),
    createdAt: "2026-06-01T00:00:00.000Z"
  };
}

async function createCampaignFolder(): Promise<string> {
  const campaignPath = await mkdtemp(path.join(os.tmpdir(), "localvtt-health-"));
  await mkdir(path.join(campaignPath, "assets", "maps"), { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "tokens"), { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "thumbnails"), { recursive: true });
  await mkdir(path.join(campaignPath, "scenes"), { recursive: true });
  return campaignPath;
}

describe("campaign health", () => {
  it("reports missing files, stale thumbnails, scene file issues, unknown asset references, and unreferenced assets", async () => {
    const campaignPath = await createCampaignFolder();
    await writeFile(path.join(campaignPath, "assets", "maps", "map.png"), "map");
    await writeFile(path.join(campaignPath, "assets", "tokens", "hero.png"), "hero");
    await writeFile(path.join(campaignPath, "assets", "tokens", "orphan.png"), "orphan");

    const scene = createDefaultScene("Scene One");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";
    scene.tokens = [
      {
        id: "token-1",
        name: "Hero",
        assetId: "token-1",
        position: { x: 10, y: 20 },
        size: { width: 1, height: 1 },
        hidden: false,
        visibleInPlayer: true
      },
      {
        id: "token-2",
        name: "Missing",
        assetId: "missing-token-asset",
        position: { x: 30, y: 40 },
        size: { width: 1, height: 1 },
        hidden: false,
        visibleInPlayer: true
      }
    ];
    await writeFile(path.join(campaignPath, "scenes", "scene-1.scene.json"), JSON.stringify(scene), "utf8");

    const campaign = createDefaultCampaign("Health Campaign");
    campaign.assets = [
      asset({ id: "map-1", kind: "map", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/map.jpg" }),
      asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/hero.png" }),
      asset({ id: "orphan-1", kind: "token", relativePath: "assets/tokens/orphan.png" })
    ];
    campaign.players = [
      {
        id: "player-1",
        name: "Player",
        color: "#ff0000",
        assetId: "missing-player-asset",
        defaultSeatEdge: "bottom",
        defaultSeatPosition: 0.5,
        visibleInPlayer: true
      }
    ];
    campaign.scenes = [
      {
        id: "scene-1",
        name: "Scene One",
        file: "scenes/scene-1.scene.json",
        mapAssetId: "missing-summary-map"
      },
      {
        id: "scene-2",
        name: "Missing Scene",
        file: "scenes/missing.scene.json"
      }
    ];

    const health = await inspectCampaignHealth(campaignPath, campaign);

    expect(health.missingAssetFiles).toEqual([
      { assetId: "map-1", assetName: "map-1", kind: "thumbnail", relativePath: "assets/thumbnails/map.jpg" }
    ]);
    expect(health.staleThumbnailReferences).toEqual(health.missingAssetFiles);
    expect(health.sceneFileIssues).toEqual([
      {
        sceneId: "scene-2",
        sceneName: "Missing Scene",
        file: "scenes/missing.scene.json",
        reason: expect.stringMatching(/ENOENT|no such file|cannot find/i)
      }
    ]);
    expect(health.unknownAssetReferences).toEqual(
      expect.arrayContaining([
        { assetId: "missing-player-asset", owner: "campaign-player" },
        { assetId: "missing-summary-map", owner: "campaign-scene", sceneId: "scene-1", sceneName: "Scene One" },
        { assetId: "missing-token-asset", owner: "scene-token", sceneId: "scene-1", sceneName: "Scene One" }
      ])
    );
    expect(health.unreferencedAssets).toEqual([
      { assetId: "orphan-1", assetName: "orphan-1", kind: "token", relativePath: "assets/tokens/orphan.png" }
    ]);
  });

  it("reports scene files outside the campaign folder as unreadable", async () => {
    const campaignPath = await createCampaignFolder();
    const campaign = createDefaultCampaign("Path Safety");
    campaign.scenes = [{ id: "scene-escape", name: "Escape", file: "../escape.scene.json" }];

    const health = await inspectCampaignHealth(campaignPath, campaign);

    expect(health.sceneFileIssues).toEqual([
      {
        sceneId: "scene-escape",
        sceneName: "Escape",
        file: "../escape.scene.json",
        reason: "Scene file is outside the selected campaign folder."
      }
    ]);
  });
});
