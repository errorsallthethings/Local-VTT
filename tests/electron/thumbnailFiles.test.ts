import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { removeThumbnailIfUnused, writeAssetThumbnail } from "../../electron/thumbnailFiles";

describe("thumbnail file helpers", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-thumbnails-"));
    await mkdir(path.join(tempRoot, "assets", "thumbnails"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("writes thumbnails to portable thumbnail paths", async () => {
    const relativePath = await writeAssetThumbnail(tempRoot, "asset-1", Buffer.from("thumbnail"));

    expect(relativePath).toBe("assets/thumbnails/asset-1.jpg");
    await expect(readFile(path.join(tempRoot, "assets", "thumbnails", "asset-1.jpg"), "utf8")).resolves.toBe("thumbnail");
  });

  it("writes variant thumbnails with sanitized variant names", async () => {
    const relativePath = await writeAssetThumbnail(tempRoot, "asset-1", Buffer.from("crop"), "crop-1:../bad");

    expect(relativePath).toBe("assets/thumbnails/asset-1-crop-1bad.jpg");
  });

  it("recreates the thumbnail folder before writing thumbnails", async () => {
    await rm(path.join(tempRoot, "assets", "thumbnails"), { recursive: true, force: true });

    const relativePath = await writeAssetThumbnail(tempRoot, "asset-1", Buffer.from("thumbnail"));

    expect(relativePath).toBe("assets/thumbnails/asset-1.jpg");
    await expect(readFile(path.join(tempRoot, relativePath), "utf8")).resolves.toBe("thumbnail");
  });

  it("removes thumbnails that are no longer referenced", async () => {
    const relativePath = "assets/thumbnails/asset-1.jpg";
    const absolutePath = path.join(tempRoot, relativePath);
    await writeFile(absolutePath, "old thumbnail", "utf8");

    await removeThumbnailIfUnused(tempRoot, relativePath, [{ thumbnailRelativePath: "assets/thumbnails/asset-2.jpg" }]);

    await expect(readFile(absolutePath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps thumbnails that are still referenced", async () => {
    const relativePath = "assets/thumbnails/asset-1.jpg";
    const absolutePath = path.join(tempRoot, relativePath);
    await writeFile(absolutePath, "old thumbnail", "utf8");

    await removeThumbnailIfUnused(tempRoot, relativePath, [{ thumbnailRelativePath: relativePath }]);

    await expect(readFile(absolutePath, "utf8")).resolves.toBe("old thumbnail");
  });

  it("ignores missing thumbnail paths", async () => {
    await expect(removeThumbnailIfUnused(tempRoot, undefined, [])).resolves.toBeUndefined();
  });

  it("rejects thumbnail paths outside the campaign", async () => {
    await expect(removeThumbnailIfUnused(tempRoot, "../outside.jpg", [])).rejects.toThrow("Path is outside the selected campaign folder.");
  });
});
