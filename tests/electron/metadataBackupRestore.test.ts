import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CampaignSummary } from "../../src/shared/localvtt";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";
import { campaignFile, sceneFile } from "../../electron/campaignPaths";
import { campaignBackupFolder, sceneBackupFolder } from "../../electron/metadataBackups";
import { previewMetadataBackup, restoreMetadataBackup } from "../../electron/metadataBackupRestore";

describe("metadata backup preview and restore", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-backup-restore-"));
    await mkdir(campaignBackupFolder(tempRoot), { recursive: true });
    await mkdir(sceneBackupFolder(tempRoot, "scene-1"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("previews campaign backups with a portable JSON summary", async () => {
    const campaign = createDefaultCampaign("Preview Campaign");
    const fileName = "2026-07-02T12-34-56-789Z.campaign.json";
    await writeFile(path.join(campaignBackupFolder(tempRoot), fileName), `${JSON.stringify(campaign, null, 2)}\n`, "utf8");

    const preview = await previewMetadataBackup(tempRoot, { kind: "campaign", fileName });

    expect(preview).toMatchObject({
      kind: "campaign",
      fileName,
      summary: "Preview Campaign - 0 scenes, 0 assets",
      label: "Campaign metadata"
    });
    expect(JSON.parse(preview.json)).toMatchObject({ id: campaign.id, name: "Preview Campaign" });
  });

  it("previews scene backups and rejects mismatched scene ids", async () => {
    const scene = { ...createDefaultScene("Cave"), id: "scene-1" };
    const mismatchedScene = { ...createDefaultScene("Wrong Cave"), id: "scene-2" };
    const fileName = "2026-07-02T12-34-56-789Z.scene-1.scene.json";
    const mismatchedFileName = "2026-07-02T12-35-56-789Z.scene-1.scene.json";
    await writeFile(path.join(sceneBackupFolder(tempRoot, "scene-1"), fileName), `${JSON.stringify(scene, null, 2)}\n`, "utf8");
    await writeFile(path.join(sceneBackupFolder(tempRoot, "scene-1"), mismatchedFileName), `${JSON.stringify(mismatchedScene, null, 2)}\n`, "utf8");

    await expect(previewMetadataBackup(tempRoot, { kind: "scene", sceneId: "scene-1", fileName })).resolves.toMatchObject({
      kind: "scene",
      sceneId: "scene-1",
      summary: "Cave - 0 tokens, 10 layers"
    });
    await expect(previewMetadataBackup(tempRoot, { kind: "scene", sceneId: "scene-1", fileName: mismatchedFileName })).rejects.toThrow(
      "Scene backup does not match the selected scene."
    );
  });

  it("restores campaign backups and reloads the campaign summary", async () => {
    const currentCampaign = createDefaultCampaign("Current Campaign");
    const backupCampaign = createDefaultCampaign("Restored Campaign");
    const fileName = "2026-07-02T12-34-56-789Z.campaign.json";
    await writeFile(campaignFile(tempRoot), `${JSON.stringify(currentCampaign, null, 2)}\n`, "utf8");
    await writeFile(path.join(campaignBackupFolder(tempRoot), fileName), `${JSON.stringify(backupCampaign, null, 2)}\n`, "utf8");

    const result = await restoreMetadataBackup(tempRoot, { kind: "campaign", fileName }, loadSummary);

    expect(JSON.parse(await readFile(campaignFile(tempRoot), "utf8"))).toMatchObject({ name: "Restored Campaign" });
    expect(result.campaignSummary.campaign.name).toBe("Restored Campaign");
    expect(result.restored.label).toBe("Campaign metadata");
  });

  it("restores scene backups and returns the restored scene", async () => {
    const currentScene = { ...createDefaultScene("Current Scene"), id: "scene-1" };
    const backupScene = { ...createDefaultScene("Restored Scene"), id: "scene-1" };
    const fileName = "2026-07-02T12-34-56-789Z.scene-1.scene.json";
    await writeFile(campaignFile(tempRoot), `${JSON.stringify(createDefaultCampaign("Scene Restore Campaign"), null, 2)}\n`, "utf8");
    await mkdir(path.dirname(sceneFile(tempRoot, "scene-1")), { recursive: true });
    await writeFile(sceneFile(tempRoot, "scene-1"), `${JSON.stringify(currentScene, null, 2)}\n`, "utf8");
    await writeFile(path.join(sceneBackupFolder(tempRoot, "scene-1"), fileName), `${JSON.stringify(backupScene, null, 2)}\n`, "utf8");

    const result = await restoreMetadataBackup(tempRoot, { kind: "scene", sceneId: "scene-1", fileName }, loadSummary);

    expect(JSON.parse(await readFile(sceneFile(tempRoot, "scene-1"), "utf8"))).toMatchObject({ name: "Restored Scene" });
    expect(result.scene).toMatchObject({ id: "scene-1", name: "Restored Scene" });
  });

  it("restores scene backups even when the current scene file is missing", async () => {
    const backupScene = { ...createDefaultScene("Recovered Missing Scene"), id: "scene-1" };
    const campaign = createDefaultCampaign("Missing Scene Restore Campaign");
    campaign.scenes = [{ id: "scene-1", name: "Missing Scene", file: "scenes/scene-1.scene.json" }];
    const fileName = "2026-07-02T12-34-56-789Z.scene-1.scene.json";
    await writeFile(campaignFile(tempRoot), `${JSON.stringify(campaign, null, 2)}\n`, "utf8");
    await writeFile(path.join(sceneBackupFolder(tempRoot, "scene-1"), fileName), `${JSON.stringify(backupScene, null, 2)}\n`, "utf8");

    const result = await restoreMetadataBackup(tempRoot, { kind: "scene", sceneId: "scene-1", fileName }, loadSummary);

    expect(JSON.parse(await readFile(sceneFile(tempRoot, "scene-1"), "utf8"))).toMatchObject({ id: "scene-1", name: "Recovered Missing Scene" });
    expect(result.scene).toMatchObject({ id: "scene-1", name: "Recovered Missing Scene" });
  });

  it("does not replace current campaign metadata when a backup is malformed", async () => {
    const currentCampaign = createDefaultCampaign("Current Campaign");
    const fileName = "2026-07-02T12-34-56-789Z.campaign.json";
    await writeFile(campaignFile(tempRoot), `${JSON.stringify(currentCampaign, null, 2)}\n`, "utf8");
    await writeFile(path.join(campaignBackupFolder(tempRoot), fileName), "{", "utf8");

    await expect(restoreMetadataBackup(tempRoot, { kind: "campaign", fileName }, loadSummary)).rejects.toThrow("Campaign metadata file is not valid JSON.");

    expect(JSON.parse(await readFile(campaignFile(tempRoot), "utf8"))).toMatchObject({ name: "Current Campaign" });
    expect(await readdir(campaignBackupFolder(tempRoot))).toEqual([fileName]);
  });

  it("does not replace current campaign metadata when a backup contains unsafe portable paths", async () => {
    const currentCampaign = createDefaultCampaign("Current Campaign");
    const unsafeBackup = createDefaultCampaign("Unsafe Backup Campaign");
    unsafeBackup.assets = [
      {
        id: "asset-1",
        name: "Unsafe Asset",
        kind: "map",
        mediaType: "image",
        relativePath: "../outside.png",
        originalFileName: "outside.png",
        createdAt: "2026-07-02T00:00:00.000Z"
      }
    ];
    const fileName = "2026-07-02T12-35-56-789Z.campaign.json";
    await writeFile(campaignFile(tempRoot), `${JSON.stringify(currentCampaign, null, 2)}\n`, "utf8");
    await writeFile(path.join(campaignBackupFolder(tempRoot), fileName), `${JSON.stringify(unsafeBackup, null, 2)}\n`, "utf8");

    await expect(restoreMetadataBackup(tempRoot, { kind: "campaign", fileName }, loadSummary)).rejects.toThrow(
      "Asset path must be a relative path inside the campaign folder."
    );

    expect(JSON.parse(await readFile(campaignFile(tempRoot), "utf8"))).toMatchObject({ name: "Current Campaign" });
    expect(await readdir(campaignBackupFolder(tempRoot))).toEqual([fileName]);
  });

  it("rejects backup refs outside the campaign folder", async () => {
    await expect(previewMetadataBackup(tempRoot, { kind: "campaign", fileName: "..\\outside.json" })).rejects.toThrow("Unsafe backup file name.");
    await expect(previewMetadataBackup(tempRoot, { kind: "scene", sceneId: "../campaign", fileName: "backup.scene.json" })).rejects.toThrow(
      "Unsafe backup scene id."
    );
  });

  async function loadSummary(campaignPath: string): Promise<CampaignSummary> {
    const campaign = JSON.parse(await readFile(campaignFile(campaignPath), "utf8")) as CampaignSummary["campaign"];
    return {
      campaignPath,
      campaign,
      missingAssets: [],
      health: {
        missingAssetFiles: [],
        missingSceneFiles: [],
        corruptSceneFiles: [],
        orphanedAssetFiles: [],
        totalAssetFiles: 0,
        totalReferencedAssets: 0
      }
    };
  }
});
