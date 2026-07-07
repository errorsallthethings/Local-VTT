import { loadLocalStorageJson, saveLocalStorageJson } from "../storage/localStorageJson";

export const RECENT_CAMPAIGNS_STORAGE_KEY = "localvtt.recentCampaigns";
export const MAX_RECENT_CAMPAIGNS = 6;

export interface RecentCampaign {
  name: string;
  path: string;
  openedAt: string;
}

export function parseRecentCampaigns(rawValue: string | null): RecentCampaign[] {
  const parsed = loadRecentCampaignsFromValue(parseStorageValue(rawValue));
  return parsed;
}

export function loadRecentCampaigns(storage: Pick<Storage, "getItem"> = window.localStorage): RecentCampaign[] {
  return loadRecentCampaignsFromValue(loadLocalStorageJson(storage, RECENT_CAMPAIGNS_STORAGE_KEY, []));
}

export function saveRecentCampaigns(recents: RecentCampaign[], storage: Pick<Storage, "setItem"> = window.localStorage): void {
  saveLocalStorageJson(storage, RECENT_CAMPAIGNS_STORAGE_KEY, recents);
}

function parseStorageValue(rawValue: string | null): unknown {
  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    return [];
  }
}

function loadRecentCampaignsFromValue(value: unknown): RecentCampaign[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecentCampaign).slice(0, MAX_RECENT_CAMPAIGNS);
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
