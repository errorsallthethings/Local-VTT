import {
  assertValidCampaign,
  assertValidScene,
  normalizeCampaign,
  normalizeScene,
  type Campaign,
  type CampaignSceneEntry,
  type Scene
} from "../src/shared/localvtt.js";

const WINDOWS_DRIVE_PATH_PATTERN = /^[a-zA-Z]:/;

export function parseCampaignMetadata(raw: string): Campaign {
  const parsed = JSON.parse(raw) as unknown;
  assertValidCampaign(parsed);
  return parsed;
}

export function parseSceneMetadata(raw: string): Scene {
  const parsed = JSON.parse(raw) as unknown;
  assertValidScene(parsed);
  return parsed;
}

export function toPortableCampaignMetadata(campaign: Campaign): Campaign {
  const normalizedCampaign = normalizeCampaign(campaign);
  return {
    ...normalizedCampaign,
    assets: normalizedCampaign.assets.map(({ absolutePath: _absolutePath, thumbnailAbsolutePath: _thumbnailAbsolutePath, ...asset }) => ({
      ...asset,
      relativePath: normalizePortableAssetPath(asset.relativePath, "Asset path"),
      thumbnailRelativePath: asset.thumbnailRelativePath ? normalizePortableAssetPath(asset.thumbnailRelativePath, "Asset thumbnail path") : undefined
    }))
  };
}

export function toPortableSceneMetadata(scene: Scene): Scene {
  return normalizeScene(scene);
}

export function hydrateCampaignSceneEntry(entry: CampaignSceneEntry, scene: Scene): CampaignSceneEntry {
  const normalizedScene = normalizeScene(scene);
  return {
    ...entry,
    mapAssetId: entry.mapAssetId ?? normalizedScene.mapAssetId,
    weather: entry.weather ?? normalizedScene.weather
  };
}

export function normalizePortableAssetPath(candidatePath: string, label = "Asset path"): string {
  if (typeof candidatePath !== "string") {
    throw new Error(`${label} must be a relative path inside the campaign folder.`);
  }

  const normalizedSlashes = candidatePath.trim().replace(/\\/g, "/");
  const segments = normalizedSlashes.split("/");
  if (
    normalizedSlashes === "" ||
    normalizedSlashes.startsWith("/") ||
    normalizedSlashes.startsWith("//") ||
    WINDOWS_DRIVE_PATH_PATTERN.test(normalizedSlashes) ||
    normalizedSlashes.includes(":") ||
    segments.some((segment) => segment === "" || segment === "..")
  ) {
    throw new Error(`${label} must be a relative path inside the campaign folder.`);
  }

  return segments.filter((segment) => segment !== ".").join("/");
}
