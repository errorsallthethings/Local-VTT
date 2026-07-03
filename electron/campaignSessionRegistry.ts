import path from "node:path";

import type { Campaign } from "../src/shared/localvtt.js";
import { getKnownAssetPaths } from "./assetFiles.js";
import { isInsidePath } from "./campaignPathSafety.js";

export class CampaignSessionRegistry {
  private readonly openedCampaignPaths = new Set<string>();
  private readonly knownAssetPaths = new Set<string>();

  registerCampaignPath(campaignPath: string): void {
    this.openedCampaignPaths.add(path.resolve(campaignPath));
  }

  registerAssetPaths(campaign: Campaign): void {
    for (const assetPath of getKnownAssetPaths(campaign)) {
      this.registerAssetPath(assetPath);
    }
  }

  registerAssetPath(assetPath: string): void {
    this.knownAssetPaths.add(path.resolve(assetPath));
  }

  unregisterAssetPath(assetPath: string): void {
    this.knownAssetPaths.delete(path.resolve(assetPath));
  }

  assertKnownCampaignPath(campaignPath: string): void {
    if (!this.openedCampaignPaths.has(path.resolve(campaignPath))) {
      throw new Error("Campaign folder is not open.");
    }
  }

  isInsideOpenedCampaign(candidatePath: string): boolean {
    return [...this.openedCampaignPaths].some((campaignPath) => isInsidePath(campaignPath, candidatePath));
  }

  isKnownAssetPath(candidatePath: string): boolean {
    return this.knownAssetPaths.has(path.resolve(candidatePath));
  }
}
