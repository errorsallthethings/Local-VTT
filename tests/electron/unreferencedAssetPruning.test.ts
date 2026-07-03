import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pruneUnreferencedAssets } from "../../electron/unreferencedAssetPruning";
import { createDefaultCampaign, type Asset } from "../../src/shared/localvtt";

describe("unreferenced asset pruning", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-prune-assets-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("removes unreferenced assets and their files", async () => {
    const mapPath = await writeAssetFile("assets/maps/orphan.jpg", "map");
    const thumbnailPath = await writeAssetFile("assets/thumbnails/orphan.jpg", "thumb");
    const campaign = createDefaultCampaign("Prune");
    campaign.assets = [
      asset({ id: "map-1", kind: "map", relativePath: "assets/maps/orphan.jpg", thumbnailRelativePath: "assets/thumbnails/orphan.jpg" }),
      asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/hero.jpg", thumbnailRelativePath: "assets/tokens/hero.jpg" })
    ];

    const result = await pruneUnreferencedAssets(tempRoot, campaign, new Set(["map-1"]));

    expect(result.pruned).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.removedFiles).toBe(2);
    expect(result.failed).toEqual([]);
    expect(result.campaign.assets.map((candidate) => candidate.id)).toEqual(["token-1"]);
    await expect(readFile(mapPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(thumbnailPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not remove files still referenced by retained assets", async () => {
    const sharedPath = await writeAssetFile("assets/tokens/shared.jpg", "shared");
    const campaign = createDefaultCampaign("Shared");
    campaign.assets = [
      asset({ id: "unused-token", kind: "token", relativePath: "assets/tokens/shared.jpg", thumbnailRelativePath: "assets/tokens/shared.jpg" }),
      asset({ id: "used-token", kind: "token", relativePath: "assets/tokens/shared.jpg", thumbnailRelativePath: "assets/tokens/shared.jpg" })
    ];

    const result = await pruneUnreferencedAssets(tempRoot, campaign, new Set(["unused-token"]));

    expect(result.pruned).toBe(1);
    expect(result.removedFiles).toBe(0);
    expect(result.campaign.assets.map((candidate) => candidate.id)).toEqual(["used-token"]);
    await expect(readFile(sharedPath, "utf8")).resolves.toBe("shared");
  });

  it("keeps assets in metadata when file removal fails", async () => {
    const campaign = createDefaultCampaign("Failure");
    campaign.assets = [asset({ id: "map-1", kind: "map", relativePath: "assets/maps/orphan.jpg" })];

    const result = await pruneUnreferencedAssets(tempRoot, campaign, new Set(["map-1"]), async () => {
      throw new Error("Access denied");
    });

    expect(result.pruned).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.failed).toEqual([
      {
        assetId: "map-1",
        assetName: "map-1",
        kind: "map",
        relativePath: "assets/maps/orphan.jpg",
        reason: "Access denied"
      }
    ]);
    expect(result.campaign.assets.map((candidate) => candidate.id)).toEqual(["map-1"]);
  });

  async function writeAssetFile(relativePath: string, content: string): Promise<string> {
    const filePath = path.join(tempRoot, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
    return filePath;
  }
});

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.name ?? patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.relativePath,
    thumbnailRelativePath: patch.thumbnailRelativePath,
    originalFileName: patch.originalFileName ?? path.basename(patch.relativePath),
    createdAt: "2026-07-03T00:00:00.000Z"
  };
}
