import path from "node:path";
import { createDefaultCampaign, type Campaign } from "../src/shared/localvtt.js";

export const DEFAULT_CAMPAIGN_NAME = "Local VTT Campaign";

export function createCampaignForFolder(campaignPath: string): Campaign {
  return createDefaultCampaign(path.basename(campaignPath) || DEFAULT_CAMPAIGN_NAME);
}

export function resolveCurrentCampaignPath(campaignPath: string): string {
  return path.resolve(campaignPath);
}
