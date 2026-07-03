import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertAssetImportCandidate, copyAssetImportToCampaign } from "../../electron/assetImportFiles";

describe("asset import file helpers", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-asset-import-"));
    await mkdir(path.join(tempRoot, "campaign", "assets", "maps"), { recursive: true });
    await mkdir(path.join(tempRoot, "campaign", "assets", "tokens"), { recursive: true });
    await mkdir(path.join(tempRoot, "source"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("validates readable map and token import candidates", async () => {
    const mapPath = path.join(tempRoot, "source", "map.png");
    const tokenPath = path.join(tempRoot, "source", "hero.webp");
    await writeFile(mapPath, "map", "utf8");
    await writeFile(tokenPath, "token", "utf8");

    await expect(assertAssetImportCandidate(mapPath, "map")).resolves.toBeUndefined();
    await expect(assertAssetImportCandidate(tokenPath, "token")).resolves.toBeUndefined();
  });

  it("reports missing selected import files with a stable user-facing message", async () => {
    await expect(assertAssetImportCandidate(path.join(tempRoot, "source", "missing.png"), "map")).rejects.toThrow(
      "Selected asset file could not be read. It may have been moved or deleted."
    );
  });

  it("copies map imports into a safe campaign asset path", async () => {
    const sourcePath = path.join(tempRoot, "source", "Ancient Tomb!!.PNG");
    await writeFile(sourcePath, "map data", "utf8");

    const imported = await copyAssetImportToCampaign(path.join(tempRoot, "campaign"), sourcePath, "map");

    expect(imported.fileName).toMatch(/^Ancient-Tomb-\d+-[a-f0-9-]+\.png$/);
    expect(imported.relativePath).toBe(`assets/maps/${imported.fileName}`);
    await expect(readFile(imported.destination, "utf8")).resolves.toBe("map data");
  });

  it("copies token imports into a safe campaign asset path", async () => {
    const sourcePath = path.join(tempRoot, "source", "Hero Token.webp");
    await writeFile(sourcePath, "token data", "utf8");

    const imported = await copyAssetImportToCampaign(path.join(tempRoot, "campaign"), sourcePath, "token");

    expect(imported.relativePath).toBe(`assets/tokens/${imported.fileName}`);
    await expect(readFile(imported.destination, "utf8")).resolves.toBe("token data");
  });
});
