import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listCampaignMetadataBackups } from "../../electron/metadataBackupListing";
import { createDefaultCampaign, type CampaignSummary } from "../../src/shared/localvtt";

describe("metadata backup listing", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-backup-listing-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("lists campaign and scene metadata backups newest first", async () => {
    await writeBackup("backups/campaign/2026-07-02T12-00-00-000Z.campaign.json");
    await writeBackup("backups/scenes/scene-1/2026-07-02T12-02-00-000Z.scene-1.scene.json");
    await writeBackup("backups/scenes/scene-2/2026-07-02T12-01-00-000Z.scene-2.scene.json");
    await writeBackup("backups/scenes/scene-2/notes.txt");

    const entries = await listCampaignMetadataBackups(tempRoot, async () => summary(["scene-1", "scene-2"]));

    expect(entries.map((entry) => entry.fileName)).toEqual([
      "2026-07-02T12-02-00-000Z.scene-1.scene.json",
      "2026-07-02T12-01-00-000Z.scene-2.scene.json",
      "2026-07-02T12-00-00-000Z.campaign.json"
    ]);
    expect(entries.find((entry) => entry.sceneId === "scene-1")?.label).toBe("Scene metadata: Scene 1");
  });

  it("returns campaign backups when the scene backups root is missing", async () => {
    await writeBackup("backups/campaign/2026-07-02T12-00-00-000Z.campaign.json");

    const entries = await listCampaignMetadataBackups(tempRoot, async () => summary([]));

    expect(entries.map((entry) => entry.kind)).toEqual(["campaign"]);
  });

  it("throws unexpected scene root read errors", async () => {
    await writeBackup("backups/campaign/2026-07-02T12-00-00-000Z.campaign.json");
    await writeFile(path.join(tempRoot, "backups", "scenes"), "not a folder", "utf8");

    await expect(listCampaignMetadataBackups(tempRoot, async () => summary([]))).rejects.toBeInstanceOf(Error);
  });

  async function writeBackup(relativePath: string): Promise<void> {
    const absolutePath = path.join(tempRoot, ...relativePath.split("/"));
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, "{}", "utf8");
  }
});

function summary(sceneIds: string[]): CampaignSummary {
  const campaign = createDefaultCampaign("Backup Listing");
  campaign.scenes = sceneIds.map((id, index) => ({
    id,
    name: `Scene ${index + 1}`,
    file: `scenes/${id}.scene.json`
  }));
  return {
    campaignPath: "campaign-root",
    campaign,
    missingAssets: [],
    health: {
      missingAssetFiles: [],
      staleAssetReferences: [],
      missingSceneFiles: [],
      invalidSceneFiles: [],
      unknownSceneMapAssets: [],
      unknownTokenAssets: [],
      unreferencedAssets: []
    }
  };
}
