import { describe, expect, it } from "vitest";
import {
  MAX_RECENT_CAMPAIGNS,
  addRecentCampaign,
  parseRecentCampaigns,
  removeRecentCampaign
} from "../../src/renderer/lib/campaign";

describe("recentCampaigns", () => {
  it("returns an empty list for missing or invalid storage values", () => {
    expect(parseRecentCampaigns(null)).toEqual([]);
    expect(parseRecentCampaigns("not json")).toEqual([]);
    expect(parseRecentCampaigns(JSON.stringify({ name: "Nope" }))).toEqual([]);
  });

  it("filters invalid entries from storage", () => {
    const recents = parseRecentCampaigns(
      JSON.stringify([
        { name: "Valid", path: "C:\\Campaigns\\Valid", openedAt: "2026-01-01T00:00:00.000Z" },
        { name: "Missing path", openedAt: "2026-01-01T00:00:00.000Z" }
      ])
    );

    expect(recents).toEqual([{ name: "Valid", path: "C:\\Campaigns\\Valid", openedAt: "2026-01-01T00:00:00.000Z" }]);
  });

  it("adds new campaigns to the top and deduplicates by path", () => {
    const recents = addRecentCampaign(
      [{ name: "Old Name", path: "C:\\Campaigns\\One", openedAt: "2026-01-01T00:00:00.000Z" }],
      { name: "New Name" },
      "C:\\Campaigns\\One",
      "2026-01-02T00:00:00.000Z"
    );

    expect(recents).toEqual([{ name: "New Name", path: "C:\\Campaigns\\One", openedAt: "2026-01-02T00:00:00.000Z" }]);
  });

  it("limits the list to the maximum recent campaign count", () => {
    const seed = Array.from({ length: MAX_RECENT_CAMPAIGNS }, (_, index) => ({
      name: `Campaign ${index}`,
      path: `C:\\Campaigns\\${index}`,
      openedAt: "2026-01-01T00:00:00.000Z"
    }));

    const recents = addRecentCampaign(seed, { name: "Newest" }, "C:\\Campaigns\\Newest", "2026-01-02T00:00:00.000Z");

    expect(recents).toHaveLength(MAX_RECENT_CAMPAIGNS);
    expect(recents[0]?.name).toBe("Newest");
    expect(recents.at(-1)?.name).toBe(`Campaign ${MAX_RECENT_CAMPAIGNS - 2}`);
  });

  it("removes campaigns by path", () => {
    const recents = removeRecentCampaign(
      [
        { name: "Keep", path: "C:\\Campaigns\\Keep", openedAt: "2026-01-01T00:00:00.000Z" },
        { name: "Remove", path: "C:\\Campaigns\\Remove", openedAt: "2026-01-01T00:00:00.000Z" }
      ],
      "C:\\Campaigns\\Remove"
    );

    expect(recents).toEqual([{ name: "Keep", path: "C:\\Campaigns\\Keep", openedAt: "2026-01-01T00:00:00.000Z" }]);
  });

  it("supports removing a stale recent campaign after reopening fails", () => {
    const recents = [
      { name: "Stale", path: "C:\\Campaigns\\Moved", openedAt: "2026-01-02T00:00:00.000Z" },
      { name: "Keep", path: "C:\\Campaigns\\Keep", openedAt: "2026-01-01T00:00:00.000Z" }
    ];

    expect(removeRecentCampaign(recents, "C:\\Campaigns\\Moved")).toEqual([
      { name: "Keep", path: "C:\\Campaigns\\Keep", openedAt: "2026-01-01T00:00:00.000Z" }
    ]);
  });
});
