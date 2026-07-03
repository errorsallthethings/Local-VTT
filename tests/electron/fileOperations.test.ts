import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { unlinkIfExists } from "../../electron/fileOperations";

describe("file operations", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-file-ops-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("deletes existing files", async () => {
    const filePath = path.join(tempRoot, "delete-me.txt");
    await writeFile(filePath, "delete me", "utf8");

    await unlinkIfExists(filePath);

    await expect(readFile(filePath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("ignores missing files", async () => {
    await expect(unlinkIfExists(path.join(tempRoot, "missing.txt"))).resolves.toBeUndefined();
  });

  it("surfaces non-missing-file errors", async () => {
    const folderPath = path.join(tempRoot, "folder");
    await mkdir(folderPath);

    await expect(unlinkIfExists(folderPath)).rejects.toBeInstanceOf(Error);
  });
});
