import {
  createPlayerDisplayProfile,
  type Campaign,
  type DisplayCalibration,
  type PlayerDisplayProfile
} from "../../../shared/localvtt";

export type PlayerDisplayProfileAction =
  | { type: "update-display"; display: DisplayCalibration }
  | { type: "select-profile"; profileId: string }
  | { type: "create-profile"; profileId: string; name: string; calibration: DisplayCalibration }
  | { type: "rename-profile"; profileId: string; name: string }
  | { type: "delete-profile"; profileId: string };

export function getCalibrationFromProfile(profile: PlayerDisplayProfile): DisplayCalibration {
  return {
    physicalScaleEnabled: profile.physicalScaleEnabled,
    mode: profile.mode,
    selectedDisplayId: profile.selectedDisplayId,
    selectedDisplayLabel: profile.selectedDisplayLabel,
    openPlayerViewFullscreen: profile.openPlayerViewFullscreen,
    pixelsPerInch: profile.pixelsPerInch,
    inchesPerGridCell: profile.inchesPerGridCell,
    screenDiagonalInches: profile.screenDiagonalInches,
    screenAspectRatio: profile.screenAspectRatio,
    screenResolutionWidth: profile.screenResolutionWidth,
    screenResolutionHeight: profile.screenResolutionHeight,
    defaultScaleLabel: profile.defaultScaleLabel
  };
}

export function updateCampaignPlayerDisplay(campaign: Campaign, nextDisplay: DisplayCalibration, updatedAt: string): Campaign {
  return {
    ...campaign,
    playerDisplay: nextDisplay,
    playerDisplayProfiles: campaign.playerDisplayProfiles.map((profile) =>
      profile.id === campaign.activePlayerDisplayProfileId
        ? {
            ...profile,
            ...nextDisplay,
            updatedAt
          }
        : profile
    ),
    updatedAt
  };
}

export function selectCampaignPlayerDisplayProfile(campaign: Campaign, profileId: string, updatedAt: string): Campaign | null {
  const selectedProfile = campaign.playerDisplayProfiles.find((profile) => profile.id === profileId);
  if (!selectedProfile) {
    return null;
  }

  return {
    ...campaign,
    activePlayerDisplayProfileId: selectedProfile.id,
    playerDisplay: getCalibrationFromProfile(selectedProfile),
    updatedAt
  };
}

export function addCampaignPlayerDisplayProfile(
  campaign: Campaign,
  profileId: string,
  name: string,
  calibration: DisplayCalibration,
  createdAt: string
): Campaign {
  const profile = createPlayerDisplayProfile(profileId, name, calibration, createdAt);
  return {
    ...campaign,
    activePlayerDisplayProfileId: profile.id,
    playerDisplay: getCalibrationFromProfile(profile),
    playerDisplayProfiles: [...campaign.playerDisplayProfiles, profile],
    updatedAt: createdAt
  };
}

export function renameCampaignPlayerDisplayProfile(campaign: Campaign, profileId: string, name: string, updatedAt: string): Campaign | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...campaign,
    playerDisplayProfiles: campaign.playerDisplayProfiles.map((profile) =>
      profile.id === profileId ? { ...profile, name: trimmedName, updatedAt } : profile
    ),
    updatedAt
  };
}

export function deleteCampaignPlayerDisplayProfile(campaign: Campaign, profileId: string, updatedAt: string): Campaign | null {
  if (campaign.playerDisplayProfiles.length <= 1) {
    return null;
  }

  const remainingProfiles = campaign.playerDisplayProfiles.filter((profile) => profile.id !== profileId);
  const fallbackProfile = remainingProfiles.find((profile) => profile.id === campaign.activePlayerDisplayProfileId) ?? remainingProfiles[0];
  return {
    ...campaign,
    activePlayerDisplayProfileId: fallbackProfile.id,
    playerDisplay: getCalibrationFromProfile(fallbackProfile),
    playerDisplayProfiles: remainingProfiles,
    updatedAt
  };
}

export function applyPlayerDisplayProfileAction(
  campaign: Campaign,
  action: PlayerDisplayProfileAction,
  updatedAt: string
): Campaign | null {
  switch (action.type) {
    case "update-display":
      return updateCampaignPlayerDisplay(campaign, action.display, updatedAt);
    case "select-profile":
      return selectCampaignPlayerDisplayProfile(campaign, action.profileId, updatedAt);
    case "create-profile":
      return addCampaignPlayerDisplayProfile(campaign, action.profileId, action.name, action.calibration, updatedAt);
    case "rename-profile":
      return renameCampaignPlayerDisplayProfile(campaign, action.profileId, action.name, updatedAt);
    case "delete-profile":
      return deleteCampaignPlayerDisplayProfile(campaign, action.profileId, updatedAt);
  }
}
