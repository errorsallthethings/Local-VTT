import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureCampaignFolders,
  readCampaignMetadata,
  readSceneMetadata,
  writeCampaign,
  writeScene
} from "../../electron/campaignMetadataFiles";
import { campaignFile, requiredCampaignFolders } from "../../electron/campaignPaths";
import { campaignBackupFolder, sceneBackupFolder } from "../../electron/metadataBackups";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";

describe("campaign metadata file helpers", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-metadata-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("creates the required campaign folder structure", async () => {
    await ensureCampaignFolders(tempRoot);

    for (const folder of requiredCampaignFolders(tempRoot)) {
      await expect(readdir(folder)).resolves.toBeDefined();
    }
  });

  it("writes and reads campaign metadata", async () => {
    const campaign = createDefaultCampaign("Test Campaign");

    await writeCampaign(tempRoot, campaign);

    expect(await readCampaignMetadata(tempRoot)).toMatchObject({
      id: campaign.id,
      name: "Test Campaign"
    });
  });

  it("writes and reads scene metadata", async () => {
    const scene = { ...createDefaultScene("Cave"), id: "scene-1" };

    await writeScene(tempRoot, scene);

    expect(await readSceneMetadata(tempRoot, "scene-1")).toMatchObject({
      id: "scene-1",
      name: "Cave"
    });
  });

  it("backs up existing campaign and scene metadata before overwriting", async () => {
    const campaign = createDefaultCampaign("Original Campaign");
    await writeCampaign(tempRoot, campaign);
    await writeCampaign(tempRoot, { ...campaign, name: "Updated Campaign" });

    const scene = { ...createDefaultScene("Original Scene"), id: "scene-1" };
    await writeScene(tempRoot, scene);
    await writeScene(tempRoot, { ...scene, name: "Updated Scene" });

    expect((await readdir(campaignBackupFolder(tempRoot))).filter((entry) => entry.endsWith(".campaign.json"))).toHaveLength(1);
    expect((await readdir(sceneBackupFolder(tempRoot, "scene-1"))).filter((entry) => entry.endsWith(".scene-1.scene.json"))).toHaveLength(1);
  });

  it("keeps metadata JSON portable", async () => {
    const campaign = createDefaultCampaign("Portable Campaign");
    campaign.assets = [
      {
        id: "asset-1",
        name: "Map",
        kind: "map",
        mediaType: "image",
        relativePath: "assets/maps/map.png",
        absolutePath: path.join(tempRoot, "assets", "maps", "map.png"),
        originalFileName: "map.png",
        createdAt: "2026-07-02T00:00:00.000Z"
      }
    ];

    await writeCampaign(tempRoot, campaign);

    const saved = JSON.parse(await readFile(campaignFile(tempRoot), "utf8")) as { assets: Array<{ absolutePath?: string; relativePath: string }> };
    expect(saved.assets[0]).toMatchObject({ relativePath: "assets/maps/map.png" });
    expect(saved.assets[0].absolutePath).toBeUndefined();
  });

  it("surfaces read errors with backup guidance", async () => {
    await writeFile(campaignFile(tempRoot), "{", "utf8");

    await expect(readCampaignMetadata(tempRoot)).rejects.toThrow("Campaign metadata could not be read.");
    await expect(readCampaignMetadata(tempRoot)).rejects.toThrow(campaignBackupFolder(tempRoot));
  });

  it("rejects unsafe scene ids", async () => {
    await expect(readSceneMetadata(tempRoot, "../campaign")).rejects.toThrow("Unsafe campaign scene id.");
  });

  it("wraps scene write failures with a user-facing message", async () => {
    await expect(writeScene(tempRoot, { ...createDefaultScene("Bad Scene"), id: "../campaign" })).rejects.toThrow(
      "Scene metadata could not be saved."
    );
  });
});
