import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { writeMetadataFileAtomically } from "../../electron/metadataAtomicWrite";

describe("atomic metadata writes", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-atomic-write-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("writes metadata through a temporary file and leaves only the final file", async () => {
    const metadataPath = path.join(tempRoot, "campaign.json");

    await writeMetadataFileAtomically(metadataPath, "{\n  \"name\": \"Campaign\"\n}\n");

    await expect(readFile(metadataPath, "utf8")).resolves.toBe("{\n  \"name\": \"Campaign\"\n}\n");
    expect((await readdir(tempRoot)).filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });

  it("replaces existing metadata contents", async () => {
    const metadataPath = path.join(tempRoot, "scene.json");
    await writeMetadataFileAtomically(metadataPath, "old");

    await writeMetadataFileAtomically(metadataPath, "new");

    await expect(readFile(metadataPath, "utf8")).resolves.toBe("new");
    expect((await readdir(tempRoot)).filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });
});
