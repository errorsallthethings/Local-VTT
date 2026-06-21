import { describe, expect, it } from "vitest";
import {
  RECENT_CAMPAIGNS_STORAGE_KEY,
  type RecentCampaign,
  loadRecentCampaigns,
  saveRecentCampaigns
} from "../../src/renderer/lib/recentCampaigns";

function createStorage(initialValues: Record<string, string | null> = {}) {
  const values = new Map(Object.entries(initialValues).filter((entry): entry is [string, string] => entry[1] !== null));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}

describe("recent campaign storage", () => {
  it("loads an empty recent campaign list when stored data is missing", () => {
    expect(loadRecentCampaigns(createStorage())).toEqual([]);
  });

  it("saves and reloads recent campaign values", () => {
    const storage = createStorage();
    const recents: RecentCampaign[] = [
      { name: "Session Night", path: "C:/campaigns/session.localvtt", openedAt: "2026-06-20T00:00:00.000Z" }
    ];

    saveRecentCampaigns(recents, storage);

    expect(storage.getItem(RECENT_CAMPAIGNS_STORAGE_KEY)).toBe(JSON.stringify(recents));
    expect(loadRecentCampaigns(storage)).toEqual(recents);
  });
});
