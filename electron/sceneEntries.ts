import type { CampaignSceneEntry, Scene } from "../src/shared/localvtt.js";

export function createCampaignSceneEntry(scene: Scene, folderId?: string): CampaignSceneEntry {
  return {
    id: scene.id,
    name: scene.name,
    file: `scenes/${scene.id}.scene.json`,
    mapAssetId: scene.mapAssetId,
    weather: scene.weather,
    folderId
  };
}

export function insertSceneEntryAfter(
  entries: readonly CampaignSceneEntry[],
  entry: CampaignSceneEntry,
  afterSceneId: string
): CampaignSceneEntry[] {
  const sourceIndex = entries.findIndex((candidate) => candidate.id === afterSceneId);
  const nextEntries = [...entries];
  nextEntries.splice(sourceIndex >= 0 ? sourceIndex + 1 : nextEntries.length, 0, entry);
  return nextEntries;
}

export function updateSceneEntryFromScene(entry: CampaignSceneEntry, scene: Scene): CampaignSceneEntry {
  return {
    ...entry,
    name: scene.name,
    mapAssetId: scene.mapAssetId,
    weather: scene.weather
  };
}
