import type { Scene } from "../../shared/localvtt";

export function removeLastWeatherMask(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    weather: {
      ...scene.weather,
      masks: scene.weather.masks.slice(0, -1)
    },
    updatedAt
  };
}

export function removeLastEnvironmentEffect(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.slice(0, -1)
    },
    updatedAt
  };
}

export function removeLastDrawing(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    drawings: scene.drawings.slice(0, -1),
    updatedAt
  };
}
