import {
  assertValidCampaign,
  assertValidScene,
  normalizeCampaign,
  normalizeScene,
  type Campaign,
  type Scene
} from "../src/shared/localvtt.js";

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
    assets: normalizedCampaign.assets.map(({ absolutePath: _absolutePath, thumbnailAbsolutePath: _thumbnailAbsolutePath, ...asset }) => asset)
  };
}

export function toPortableSceneMetadata(scene: Scene): Scene {
  return normalizeScene(scene);
}
