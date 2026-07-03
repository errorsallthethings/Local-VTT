import { unlink } from "node:fs/promises";

export async function unlinkIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
