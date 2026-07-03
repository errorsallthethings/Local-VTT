import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openMetadataBackupsFolder } from "../../electron/metadataBackupsFolder";

describe("metadata backups folder opener", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-open-backups-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("creates and opens the campaign backups folder", async () => {
    const openedPaths: string[] = [];

    await expect(
      openMetadataBackupsFolder(tempRoot, async (folderPath) => {
        openedPaths.push(folderPath);
        return "";
      })
    ).resolves.toBe(true);

    expect(openedPaths).toEqual([path.join(tempRoot, "backups")]);
    await expect(readdir(path.join(tempRoot, "backups"))).resolves.toEqual([]);
  });

  it("surfaces shell open failures", async () => {
    await expect(openMetadataBackupsFolder(tempRoot, async () => "Shell could not open the folder.")).rejects.toThrow(
      "Could not open backups folder. Shell could not open the folder."
    );
  });
});
