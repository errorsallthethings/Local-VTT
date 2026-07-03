import {
  createDefaultScene,
  duplicateScene,
  normalizeScene,
  type Campaign,
  type Scene
} from "../src/shared/localvtt.js";
import { createCampaignSceneEntry, insertSceneEntryAfter, updateSceneEntryFromScene } from "./sceneEntries.js";

export interface SceneCampaignUpdate {
  campaign: Campaign;
  scene: Scene;
}

export function createSceneForCampaign(campaign: Campaign, sceneName: string, timestamp = new Date().toISOString()): SceneCampaignUpdate {
  const scene = createDefaultScene(sceneName || "Untitled Scene");
  return {
    scene,
    campaign: {
      ...campaign,
      scenes: [...campaign.scenes, createCampaignSceneEntry(scene)],
      updatedAt: timestamp
    }
  };
}

export function duplicateSceneForCampaign(
  campaign: Campaign,
  sourceScene: Scene,
  sceneName: string,
  afterSceneId: string,
  folderId: string | undefined,
  timestamp = new Date().toISOString()
): SceneCampaignUpdate {
  const scene = duplicateScene(sourceScene, sceneName || `${sourceScene.name} Copy`);
  return {
    scene,
    campaign: {
      ...campaign,
      scenes: insertSceneEntryAfter(campaign.scenes, createCampaignSceneEntry(scene, folderId), afterSceneId),
      updatedAt: timestamp
    }
  };
}

export function saveSceneInCampaign(campaign: Campaign, scene: Scene, timestamp = new Date().toISOString()): SceneCampaignUpdate {
  const updatedScene = normalizeScene({ ...scene, updatedAt: timestamp });
  return {
    scene: updatedScene,
    campaign: {
      ...campaign,
      scenes: campaign.scenes.map((entry) => (entry.id === scene.id ? updateSceneEntryFromScene(entry, updatedScene) : entry)),
      updatedAt: timestamp
    }
  };
}

export function renameSceneInCampaign(campaign: Campaign, scene: Scene, sceneId: string, sceneName: string, timestamp = new Date().toISOString()): SceneCampaignUpdate {
  const name = sceneName.trim();
  if (!name) {
    throw new Error("Scene name cannot be empty.");
  }
  if (scene.id !== sceneId) {
    throw new Error("Invalid scene file.");
  }

  const updatedScene = normalizeScene({ ...scene, name, updatedAt: timestamp });
  return {
    scene: updatedScene,
    campaign: {
      ...campaign,
      scenes: campaign.scenes.map((entry) => (entry.id === sceneId ? { ...entry, name } : entry)),
      updatedAt: timestamp
    }
  };
}

export function deleteSceneFromCampaign(campaign: Campaign, sceneId: string, timestamp = new Date().toISOString()): Campaign {
  return {
    ...campaign,
    scenes: campaign.scenes.filter((entry) => entry.id !== sceneId),
    updatedAt: timestamp
  };
}
