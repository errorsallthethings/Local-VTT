import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { removeCampaignAssetFiles } from "../../electron/assetFileRemoval";
import type { Asset } from "../../src/shared/localvtt";

describe("asset file removal", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-asset-removal-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("removes asset and thumbnail files", async () => {
    const assetPath = path.join(tempRoot, "assets", "tokens", "hero.png");
    const thumbnailPath = path.join(tempRoot, "assets", "thumbnails", "hero.jpg");
    await mkdir(path.dirname(assetPath), { recursive: true });
    await mkdir(path.dirname(thumbnailPath), { recursive: true });
    await writeFile(assetPath, "asset", "utf8");
    await writeFile(thumbnailPath, "thumbnail", "utf8");

    await removeCampaignAssetFiles(tempRoot, asset({ relativePath: "assets/tokens/hero.png", thumbnailRelativePath: "assets/thumbnails/hero.jpg" }));

    await expect(readFile(assetPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(thumbnailPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("ignores missing asset files", async () => {
    await expect(removeCampaignAssetFiles(tempRoot, asset({ relativePath: "assets/tokens/missing.png" }))).resolves.toBeUndefined();
  });

  it("rejects asset paths outside the campaign folder", async () => {
    await expect(removeCampaignAssetFiles(tempRoot, asset({ absolutePath: path.resolve(tempRoot, "..", "outside.png") }))).rejects.toThrow(
      "Path is outside the selected campaign folder."
    );
  });

  it("deduplicates matching asset and thumbnail paths", async () => {
    const assetPath = path.join(tempRoot, "assets", "tokens", "shared.png");
    await mkdir(path.dirname(assetPath), { recursive: true });
    await writeFile(assetPath, "asset", "utf8");

    await removeCampaignAssetFiles(
      tempRoot,
      asset({
        relativePath: "assets/tokens/shared.png",
        thumbnailRelativePath: "assets/tokens/shared.png"
      })
    );

    await expect(readFile(assetPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
});

function asset(patch: Partial<Asset>): Asset {
  return {
    id: "asset-1",
    name: "asset-1",
    kind: "token",
    mediaType: "image",
    relativePath: "assets/tokens/asset-1.png",
    originalFileName: "asset-1.png",
    createdAt: "2026-07-02T00:00:00.000Z",
    ...patch
  };
}
