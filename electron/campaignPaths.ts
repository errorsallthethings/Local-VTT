import path from "node:path";

export function campaignFile(campaignPath: string): string {
  return path.join(campaignPath, "campaign.json");
}

export function sceneFile(campaignPath: string, sceneId: string): string {
  assertSafeCampaignPathSegment(sceneId, "scene id");
  return path.join(campaignPath, "scenes", `${sceneId}.scene.json`);
}

export function requiredCampaignFolders(campaignPath: string): string[] {
  return [
    campaignPath,
    path.join(campaignPath, "assets", "maps"),
    path.join(campaignPath, "assets", "tokens"),
    path.join(campaignPath, "assets", "overlays"),
    path.join(campaignPath, "assets", "effects"),
    path.join(campaignPath, "assets", "handouts"),
    path.join(campaignPath, "assets", "thumbnails"),
    path.join(campaignPath, "scenes")
  ];
}

function assertSafeCampaignPathSegment(value: string, label: string): void {
  if (
    value.trim() === "" ||
    value === "." ||
    value === ".." ||
    path.isAbsolute(value) ||
    value.includes("/") ||
    value.includes("\\")
  ) {
    throw new Error(`Unsafe campaign ${label}.`);
  }
}
