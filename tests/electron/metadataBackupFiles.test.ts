import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { backupExistingMetadataFile, listMetadataBackupFolder } from "../../electron/metadataBackupFiles";

describe("metadata backup file helpers", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-backups-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("copies an existing metadata file into the backup folder", async () => {
    const sourcePath = path.join(tempRoot, "campaign.json");
    const backupFolder = path.join(tempRoot, "backups", "campaign");
    await writeFile(sourcePath, "{\"name\":\"Campaign\"}\n", "utf8");

    await backupExistingMetadataFile(tempRoot, sourcePath, backupFolder, "campaign.json", {
      createTimestamp: () => "2026-07-02T12-34-56-789Z"
    });

    const entries = await readdir(backupFolder);
    expect(entries).toEqual(["2026-07-02T12-34-56-789Z.campaign.json"]);
    expect(entries.filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });

  it("does not create backups for missing metadata files", async () => {
    const backupFolder = path.join(tempRoot, "backups", "campaign");

    await backupExistingMetadataFile(tempRoot, path.join(tempRoot, "missing.json"), backupFolder, "campaign.json");

    await expect(readdir(backupFolder)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("prunes older backups beyond the configured limit", async () => {
    const sourcePath = path.join(tempRoot, "campaign.json");
    const backupFolder = path.join(tempRoot, "backups", "campaign");
    await writeFile(sourcePath, "{\"name\":\"Campaign\"}\n", "utf8");

    for (const timestamp of ["2026-07-02T12-00-00-000Z", "2026-07-02T12-01-00-000Z", "2026-07-02T12-02-00-000Z"]) {
      await backupExistingMetadataFile(tempRoot, sourcePath, backupFolder, "campaign.json", {
        createTimestamp: () => timestamp,
        maxBackups: 2
      });
    }

    expect(await readdir(backupFolder)).toEqual([
      "2026-07-02T12-01-00-000Z.campaign.json",
      "2026-07-02T12-02-00-000Z.campaign.json"
    ]);
  });

  it("lists JSON backup entries and ignores non-JSON files", async () => {
    const backupFolder = path.join(tempRoot, "backups", "scenes", "scene-1");
    await writeFile(path.join(tempRoot, "campaign.json"), "{}", "utf8");
    await backupExistingMetadataFile(tempRoot, path.join(tempRoot, "campaign.json"), backupFolder, "scene-1.scene.json", {
      createTimestamp: () => "2026-07-02T12-34-56-789Z"
    });
    await writeFile(path.join(backupFolder, "notes.txt"), "ignore me", "utf8");

    expect(await listMetadataBackupFolder(tempRoot, backupFolder, "scene", "scene-1", "Cave")).toMatchObject([
      {
        kind: "scene",
        sceneId: "scene-1",
        fileName: "2026-07-02T12-34-56-789Z.scene-1.scene.json",
        timestamp: "2026-07-02T12:34:56.789Z",
        label: "Scene metadata: Cave"
      }
    ]);
  });

  it("returns an empty list for missing backup folders", async () => {
    expect(await listMetadataBackupFolder(tempRoot, path.join(tempRoot, "backups", "campaign"), "campaign")).toEqual([]);
  });

  it("rejects paths outside the campaign folder", async () => {
    const sourcePath = path.join(tempRoot, "campaign.json");
    await writeFile(sourcePath, "{}", "utf8");

    await expect(backupExistingMetadataFile(tempRoot, sourcePath, path.join(tempRoot, "..", "outside"), "campaign.json")).rejects.toThrow(
      "Path is outside the selected campaign folder."
    );
    await expect(listMetadataBackupFolder(tempRoot, path.join(tempRoot, "..", "outside"), "campaign")).rejects.toThrow(
      "Path is outside the selected campaign folder."
    );
  });
});
