import { mkdir } from "node:fs/promises";
import { assertInsidePath } from "./campaignPathSafety.js";
import { metadataBackupsRootFolder } from "./metadataBackups.js";

export type OpenPath = (folderPath: string) => Promise<string>;

export async function openMetadataBackupsFolder(campaignPath: string, openPath: OpenPath): Promise<boolean> {
  const backupsPath = metadataBackupsRootFolder(campaignPath);
  assertInsidePath(campaignPath, backupsPath);
  await mkdir(backupsPath, { recursive: true });
  const errorMessage = await openPath(backupsPath);
  if (errorMessage) {
    throw new Error(`Could not open backups folder. ${errorMessage}`);
  }
  return true;
}
