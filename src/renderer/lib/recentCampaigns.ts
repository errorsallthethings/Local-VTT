export const RECENT_CAMPAIGNS_STORAGE_KEY = "localvtt.recentCampaigns";
export const MAX_RECENT_CAMPAIGNS = 6;

export interface RecentCampaign {
  name: string;
  path: string;
  openedAt: string;
}

export function parseRecentCampaigns(rawValue: string | null): RecentCampaign[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isRecentCampaign).slice(0, MAX_RECENT_CAMPAIGNS);
  } catch {
    return [];
  }
}

export function addRecentCampaign(
  recents: RecentCampaign[],
  campaign: { name: string },
  campaignPath: string,
  openedAt = new Date().toISOString()
): RecentCampaign[] {
  const nextRecent = { name: campaign.name, path: campaignPath, openedAt };
  const deduped = recents.filter((recent) => recent.path !== campaignPath);
  return [nextRecent, ...deduped].slice(0, MAX_RECENT_CAMPAIGNS);
}

export function removeRecentCampaign(recents: RecentCampaign[], campaignPath: string): RecentCampaign[] {
  return recents.filter((recent) => recent.path !== campaignPath);
}

function isRecentCampaign(candidate: unknown): candidate is RecentCampaign {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const recent = candidate as Partial<RecentCampaign>;
  return typeof recent.name === "string" && typeof recent.path === "string" && typeof recent.openedAt === "string";
}
