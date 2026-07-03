import path from "node:path";
import { describe, expect, it } from "vitest";
import { createCampaignForFolder, DEFAULT_CAMPAIGN_NAME, resolveCurrentCampaignPath } from "../../electron/campaignOpenState";

describe("campaign open state", () => {
  it("creates default campaign metadata from folder names", () => {
    expect(createCampaignForFolder(path.join("Campaigns", "Dragon Heist")).name).toBe("Dragon Heist");
  });

  it("uses a fallback name when the folder has no basename", () => {
    expect(createCampaignForFolder("").name).toBe(DEFAULT_CAMPAIGN_NAME);
  });

  it("resolves the current campaign path", () => {
    expect(resolveCurrentCampaignPath(path.join("Campaigns", "Dragon Heist"))).toBe(path.resolve("Campaigns", "Dragon Heist"));
  });
});
