import type { Asset } from "../src/shared/localvtt.js";
import { getAssetFileRemovalPaths } from "./assetFiles.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import { unlinkIfExists } from "./fileOperations.js";

export async function removeCampaignAssetFiles(campaignPath: string, asset: Asset): Promise<void> {
  for (const assetPath of getAssetFileRemovalPaths(campaignPath, asset)) {
    assertInsidePath(campaignPath, assetPath);
    await unlinkIfExists(assetPath);
  }
}
