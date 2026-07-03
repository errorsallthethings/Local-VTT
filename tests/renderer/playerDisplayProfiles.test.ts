import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createPlayerDisplayProfile, type Campaign, type DisplayCalibration } from "../../src/shared/localvtt";
import {
  addCampaignPlayerDisplayProfile,
  deleteCampaignPlayerDisplayProfile,
  getCalibrationFromProfile,
  renameCampaignPlayerDisplayProfile,
  selectCampaignPlayerDisplayProfile,
  updateCampaignPlayerDisplay
} from "../../src/renderer/lib/player-display/playerDisplayProfiles";

const now = "2026-07-03T12:00:00.000Z";
const later = "2026-07-03T13:00:00.000Z";

function calibration(patch: Partial<DisplayCalibration> = {}): DisplayCalibration {
  return {
    physicalScaleEnabled: true,
    mode: "grid-cell",
    selectedDisplayId: 2,
    selectedDisplayLabel: "Table Display",
    openPlayerViewFullscreen: true,
    pixelsPerInch: 110,
    inchesPerGridCell: 1,
    screenDiagonalInches: 55,
    screenAspectRatio: "16:9",
    screenResolutionWidth: 3840,
    screenResolutionHeight: 2160,
    defaultScaleLabel: "55in TV",
    ...patch
  };
}

function campaignWithProfiles(): Campaign {
  const campaign = createDefaultCampaign("Profiles");
  const secondProfile = createPlayerDisplayProfile("profile-2", "Second", calibration({ selectedDisplayLabel: "Second Display" }), now);
  return {
    ...campaign,
    updatedAt: now,
    playerDisplayProfiles: [...campaign.playerDisplayProfiles, secondProfile]
  };
}

describe("player display profile helpers", () => {
  it("copies calibration fields from profiles without profile metadata", () => {
    const profile = createPlayerDisplayProfile("profile-1", "Profile", calibration({ pixelsPerInch: 144 }), now);

    expect(getCalibrationFromProfile(profile)).toEqual(calibration({ pixelsPerInch: 144 }));
  });

  it("updates the active display profile when display settings change", () => {
    const campaign = campaignWithProfiles();
    const nextDisplay = calibration({ pixelsPerInch: 96, selectedDisplayLabel: "Updated Display" });
    const next = updateCampaignPlayerDisplay(campaign, nextDisplay, later);

    expect(next.playerDisplay).toEqual(nextDisplay);
    expect(next.updatedAt).toBe(later);
    expect(next.playerDisplayProfiles.find((profile) => profile.id === campaign.activePlayerDisplayProfileId)).toMatchObject({
      pixelsPerInch: 96,
      selectedDisplayLabel: "Updated Display",
      updatedAt: later
    });
    expect(next.playerDisplayProfiles.find((profile) => profile.id === "profile-2")?.updatedAt).toBe(now);
  });

  it("selects an existing profile and ignores missing profiles", () => {
    const campaign = campaignWithProfiles();
    const next = selectCampaignPlayerDisplayProfile(campaign, "profile-2", later);

    expect(next?.activePlayerDisplayProfileId).toBe("profile-2");
    expect(next?.playerDisplay.selectedDisplayLabel).toBe("Second Display");
    expect(next?.updatedAt).toBe(later);
    expect(selectCampaignPlayerDisplayProfile(campaign, "missing", later)).toBeNull();
  });

  it("adds a profile and makes it active", () => {
    const campaign = campaignWithProfiles();
    const next = addCampaignPlayerDisplayProfile(campaign, "profile-3", "Third", calibration({ selectedDisplayLabel: "Third Display" }), later);

    expect(next.activePlayerDisplayProfileId).toBe("profile-3");
    expect(next.playerDisplay.selectedDisplayLabel).toBe("Third Display");
    expect(next.playerDisplayProfiles.map((profile) => profile.id)).toEqual([campaign.playerDisplayProfiles[0].id, "profile-2", "profile-3"]);
    expect(next.updatedAt).toBe(later);
  });

  it("renames profiles with trimmed names and rejects blank names", () => {
    const campaign = campaignWithProfiles();
    const next = renameCampaignPlayerDisplayProfile(campaign, "profile-2", "  Table TV  ", later);

    expect(next?.playerDisplayProfiles.find((profile) => profile.id === "profile-2")).toMatchObject({
      name: "Table TV",
      updatedAt: later
    });
    expect(next?.updatedAt).toBe(later);
    expect(renameCampaignPlayerDisplayProfile(campaign, "profile-2", "   ", later)).toBeNull();
  });

  it("deletes profiles and falls back to a remaining profile", () => {
    const campaign = {
      ...campaignWithProfiles(),
      activePlayerDisplayProfileId: "profile-2",
      playerDisplay: calibration({ selectedDisplayLabel: "Second Display" })
    };
    const next = deleteCampaignPlayerDisplayProfile(campaign, "profile-2", later);

    expect(next?.activePlayerDisplayProfileId).toBe(campaign.playerDisplayProfiles[0].id);
    expect(next?.playerDisplay).toEqual(getCalibrationFromProfile(campaign.playerDisplayProfiles[0]));
    expect(next?.playerDisplayProfiles.map((profile) => profile.id)).toEqual([campaign.playerDisplayProfiles[0].id]);
    expect(next?.updatedAt).toBe(later);
    expect(deleteCampaignPlayerDisplayProfile(next!, next!.activePlayerDisplayProfileId, later)).toBeNull();
  });
});
