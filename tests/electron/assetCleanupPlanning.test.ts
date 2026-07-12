import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAssetCleanupPlan, removeOrphanedAssetFiles } from "../../electron/assetCleanupPlanning";
import { createDefaultCampaign, type Asset } from "../../src/shared/localvtt";
import type { CampaignHealthReport } from "../../src/shared/campaignHealth";

let tempRoot: string;

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-asset-cleanup-"));
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

describe("asset cleanup planning", () => {
  it("previews unreferenced assets, stale thumbnails, and orphaned files", async () => {
    const campaign = createDefaultCampaign("Cleanup");
    campaign.assets = [
      asset({ id: "used-map", kind: "map", relativePath: "assets/maps/used.png", thumbnailRelativePath: "assets/thumbnails/used.jpg" }),
      asset({ id: "unused-map", kind: "map", relativePath: "assets/maps/unused.png", thumbnailRelativePath: "assets/thumbnails/unused.jpg" })
    ];
    await writeAssetFile("assets/maps/used.png", "used");
    await writeAssetFile("assets/maps/unused.png", "unused");
    await writeAssetFile("assets/thumbnails/unused.jpg", "unused thumb");
    await writeAssetFile("assets/thumbnails/orphan.jpg", "orphan thumb");
    const health: CampaignHealthReport = {
      missingAssetFiles: [],
      staleThumbnailReferences: [{ assetId: "used-map", assetName: "used-map", kind: "thumbnail", relativePath: "assets/thumbnails/used.jpg" }],
      sceneFileIssues: [],
      unknownAssetReferences: [],
      unreferencedAssets: [{ assetId: "unused-map", assetName: "unused-map", kind: "map", relativePath: "assets/maps/unused.png" }]
    };

    const plan = await createAssetCleanupPlan(tempRoot, campaign, health);

    expect(plan.unreferencedAssets).toEqual([
      expect.objectContaining({
        assetId: "unused-map",
        fileRelativePaths: ["assets/maps/unused.png", "assets/thumbnails/unused.jpg"],
        usageCount: 0
      })
    ]);
    expect(plan.staleThumbnailReferences).toEqual([{ assetId: "used-map", assetName: "used-map", relativePath: "assets/thumbnails/used.jpg" }]);
    expect(plan.orphanedFiles).toEqual([expect.objectContaining({ kind: "thumbnail", relativePath: "assets/thumbnails/orphan.jpg" })]);
    expect(plan.retainedAssetCount).toBe(1);
    expect(plan.totalFilesToRemove).toBe(3);
  });

  it("removes only listed orphaned files from campaign asset folders", async () => {
    const orphanPath = await writeAssetFile("assets/maps/orphan.png", "orphan");
    const removeFile = vi.fn(async (filePath: string) => {
      await rm(filePath, { force: true });
    });

    const result = await removeOrphanedAssetFiles(tempRoot, [{ relativePath: "assets/maps/orphan.png", kind: "map", sizeBytes: 6 }], removeFile);

    expect(result).toEqual({ removed: 1, failed: [] });
    expect(removeFile).toHaveBeenCalledWith(orphanPath);
    await expect(readFile(orphanPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reports orphaned files outside cleanup folders without deleting them", async () => {
    const removeFile = vi.fn();

    const result = await removeOrphanedAssetFiles(tempRoot, [{ relativePath: "campaign.json", kind: "map", sizeBytes: 1 }], removeFile);

    expect(result.removed).toBe(0);
    expect(result.failed[0].relativePath).toBe("campaign.json");
    expect(removeFile).not.toHaveBeenCalled();
  });
});

async function writeAssetFile(relativePath: string, contents: string): Promise<string> {
  const absolutePath = path.join(tempRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents, "utf8");
  return absolutePath;
}

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.relativePath,
    originalFileName: `${patch.id}.png`,
    createdAt: "2026-07-12T00:00:00.000Z",
    ...patch
  };
}
