import type { Campaign, Scene } from "./localvtt.js";

export const CURRENT_CAMPAIGN_SCHEMA_VERSION = 2;
export const CURRENT_SCENE_SCHEMA_VERSION = 2;
export const LEGACY_SCHEMA_VERSION = 0;

export function isSupportedSchemaVersion(value: unknown, currentVersion: number): boolean {
  if (value === undefined) {
    return true;
  }
  return typeof value === "number" && Number.isInteger(value) && value >= LEGACY_SCHEMA_VERSION && value <= currentVersion;
}

export function normalizeSchemaVersion(value: unknown, currentVersion: number): number {
  return isSupportedSchemaVersion(value, currentVersion) && typeof value === "number" ? value : LEGACY_SCHEMA_VERSION;
}

export function migrateCampaignToCurrent(campaign: Campaign): Campaign {
  const schemaVersion = normalizeSchemaVersion(campaign.schemaVersion, CURRENT_CAMPAIGN_SCHEMA_VERSION);
  if (schemaVersion === LEGACY_SCHEMA_VERSION) {
    return {
      ...campaign,
      schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION
    };
  }
  return {
    ...campaign,
    schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION
  };
}

export function migrateSceneToCurrent(scene: Scene): Scene {
  const schemaVersion = normalizeSchemaVersion(scene.schemaVersion, CURRENT_SCENE_SCHEMA_VERSION);
  if (schemaVersion === LEGACY_SCHEMA_VERSION) {
    return {
      ...scene,
      schemaVersion: CURRENT_SCENE_SCHEMA_VERSION
    };
  }
  return {
    ...scene,
    schemaVersion: CURRENT_SCENE_SCHEMA_VERSION
  };
}
