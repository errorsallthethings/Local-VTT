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
  const parsed = parseMetadataJson(raw, "Campaign");
  try {
    assertValidCampaign(parsed);
    return parsed;
  } catch (caught) {
    throw formatMetadataValidationError("Campaign", caught);
  }
}

export function parseSceneMetadata(raw: string): Scene {
  const parsed = parseMetadataJson(raw, "Scene");
  try {
    assertValidScene(parsed);
    return parsed;
  } catch (caught) {
    throw formatMetadataValidationError("Scene", caught);
  }
}

export function toPortableCampaignMetadata(campaign: Campaign): Campaign {
  const normalizedCampaign = normalizeCampaign(campaign);
  return {
    ...normalizedCampaign,
    scenes: normalizedCampaign.scenes.map((entry) => ({
      ...entry,
      file: normalizePortableCampaignPath(entry.file, "Scene file path")
    })),
    assets: normalizedCampaign.assets.map(({ absolutePath: _absolutePath, thumbnailAbsolutePath: _thumbnailAbsolutePath, ...asset }) => ({
      ...asset,
      relativePath: normalizePortableCampaignPath(asset.relativePath, "Asset path"),
      thumbnailRelativePath: asset.thumbnailRelativePath ? normalizePortableCampaignPath(asset.thumbnailRelativePath, "Asset thumbnail path") : undefined
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

export function normalizePortableCampaignPath(candidatePath: string, label = "Campaign path"): string {
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

  const portablePath = segments.filter((segment) => segment !== ".").join("/");
  if (portablePath === "") {
    throw new Error(`${label} must be a relative path inside the campaign folder.`);
  }

  return portablePath;
}

function parseMetadataJson(raw: string, label: "Campaign" | "Scene"): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Invalid JSON.";
    throw new Error(`${label} metadata file is not valid JSON. ${message}`, { cause: caught });
  }
}

function formatMetadataValidationError(label: "Campaign" | "Scene", caught: unknown): Error {
  const message = caught instanceof Error ? caught.message : "Unknown metadata validation error.";
  if (message.includes("Unsupported campaign schema version") || message.includes("Unsupported scene schema version")) {
    return new Error(`${label} metadata was created by a newer version of Local VTT. ${message}`, { cause: caught });
  }
  return new Error(`${label} metadata structure is invalid. ${message}`, { cause: caught });
}
