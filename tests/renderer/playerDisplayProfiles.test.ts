import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createPlayerDisplayProfile, type Campaign, type DisplayCalibration } from "../../src/shared/localvtt";
import {
  estimateDisplayPixelsPerInch,
  formatDisplayAspect,
  formatDisplayPixels,
  getDisplayAspect,
  getDisplayCalibrationForTestGridMode,
  getDisplayCalibrationMetrics,
  getDisplayDetails,
  getDisplayLabel,
  getNextDisplayProfileName,
  getTestPatternCellSize,
  normalizeDisplayCalibrationDraft,
  type PlayerDisplayInfo
} from "../../src/renderer/lib/player-view";
import {
  addCampaignPlayerDisplayProfile,
  applyPlayerDisplayProfileAction,
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

function displayInfo(patch: Partial<PlayerDisplayInfo> = {}): PlayerDisplayInfo {
  return {
    id: 2,
    label: " Table Display ",
    bounds: { x: 1920, y: 0, width: 3840, height: 2160 },
    nativeResolution: { width: 3840, height: 2160 },
    scaleFactor: 1.25,
    ...patch
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

  it("applies player display profile actions through a single command helper", () => {
    const campaign = campaignWithProfiles();
    const created = applyPlayerDisplayProfileAction(
      campaign,
      { type: "create-profile", profileId: "profile-3", name: "Third", calibration: calibration({ selectedDisplayLabel: "Third Display" }) },
      later
    );
    const renamed = applyPlayerDisplayProfileAction(created!, { type: "rename-profile", profileId: "profile-3", name: "  Table  " }, later);
    const selected = applyPlayerDisplayProfileAction(renamed!, { type: "select-profile", profileId: "profile-3" }, later);
    const updated = applyPlayerDisplayProfileAction(
      selected!,
      { type: "update-display", display: calibration({ selectedDisplayLabel: "Updated Table" }) },
      later
    );
    const deleted = applyPlayerDisplayProfileAction(updated!, { type: "delete-profile", profileId: "profile-3" }, later);

    expect(created?.activePlayerDisplayProfileId).toBe("profile-3");
    expect(renamed?.playerDisplayProfiles.find((profile) => profile.id === "profile-3")?.name).toBe("Table");
    expect(selected?.playerDisplay.selectedDisplayLabel).toBe("Third Display");
    expect(updated?.playerDisplay.selectedDisplayLabel).toBe("Updated Table");
    expect(deleted?.playerDisplayProfiles.map((profile) => profile.id)).toEqual([campaign.playerDisplayProfiles[0].id, "profile-2"]);
  });
});

describe("display calibration helpers", () => {
  it("estimates and normalizes screen-size pixel density", () => {
    expect(estimateDisplayPixelsPerInch(3840, 2160, 55)).toBeCloseTo(80.1, 1);
    expect(estimateDisplayPixelsPerInch(3840, 2160, 0, 96)).toBe(96);

    const normalized = normalizeDisplayCalibrationDraft(
      calibration({
        mode: "screen-size",
        pixelsPerInch: 42,
        screenResolutionWidth: 3840,
        screenResolutionHeight: 2160,
        screenDiagonalInches: 55
      })
    );

    expect(normalized.pixelsPerInch).toBe(80);
  });

  it("calculates player grid sizing from calibration and scene grid size", () => {
    const manual = getDisplayCalibrationMetrics(calibration({ pixelsPerInch: 120, inchesPerGridCell: 1.5 }), 60);

    expect(manual.targetPlayerCellSize).toBe(180);
    expect(manual.effectiveTargetCellSize).toBe(180);
    expect(manual.playerScale).toBe(3);

    const screenSize = getDisplayCalibrationMetrics(
      calibration({
        mode: "screen-size",
        pixelsPerInch: 120,
        inchesPerGridCell: 1,
        screenResolutionWidth: 1920,
        screenResolutionHeight: 1080,
        screenDiagonalInches: 55
      }),
      0
    );

    expect(screenSize.effectiveTargetCellSize).toBe(40);
    expect(screenSize.playerScale).toBe(1);
  });

  it("formats display labels, details, aspect ratios, and pixel values consistently", () => {
    const display = displayInfo();

    expect(getDisplayLabel(display)).toBe("Table Display - 3840x2160");
    expect(getDisplayDetails(display)).toBe("Table Display - 3840x2160, bounds 1920,0 3840x2160, scale 1.25");
    expect(getDisplayAspect(display, calibration())).toBeCloseTo(16 / 9);
    expect(getDisplayAspect(null, calibration({ screenResolutionWidth: 2560, screenResolutionHeight: 1600 }))).toBeCloseTo(1.6);
    expect(formatDisplayAspect(16 / 9)).toBe("1.78:1");
    expect(formatDisplayPixels(120)).toBe("120");
    expect(formatDisplayPixels(120.25)).toBe("120.3");
    expect(getDisplayLabel(displayInfo({ id: 5, label: "   " }))).toBe("Display 5 - 3840x2160");
  });

  it("generates non-conflicting display profile names", () => {
    const profiles = [
      createPlayerDisplayProfile("profile-1", "Table", calibration(), now),
      createPlayerDisplayProfile("profile-2", "Table Copy", calibration(), now),
      createPlayerDisplayProfile("profile-3", "Table Copy 2", calibration(), now)
    ];

    expect(getNextDisplayProfileName(" Table ", profiles)).toBe("Table Copy 3");
    expect(getNextDisplayProfileName("Side TV", profiles)).toBe("Side TV");
    expect(getNextDisplayProfileName("   ", profiles)).toBe("Display Profile");
  });

  it("converts test pattern grid modes into display calibration updates", () => {
    const base = calibration({ physicalScaleEnabled: true, mode: "manual", pixelsPerInch: 100, inchesPerGridCell: 1.5 });

    expect(getTestPatternCellSize("square", 72, base)).toBe(72);
    expect(getTestPatternCellSize("physical-square", 72, base)).toBe(150);

    const physical = getDisplayCalibrationForTestGridMode("physical-square", base, 72);
    expect(physical).toMatchObject({
      physicalScaleEnabled: true,
      mode: "grid-cell",
      pixelsPerInch: 150,
      inchesPerGridCell: 1
    });

    expect(getDisplayCalibrationForTestGridMode("hex", base, 72).physicalScaleEnabled).toBe(false);
    expect(getDisplayCalibrationForTestGridMode("none", base, 72).physicalScaleEnabled).toBe(false);
  });
});
