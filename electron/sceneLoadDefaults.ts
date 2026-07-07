import { DEFAULT_LAYERS, normalizeScene, type Scene } from "../src/shared/localvtt.js";

export function prepareLoadedScene(scene: Scene): Scene {
  return normalizeScene({
    ...scene,
    layers: scene.layers.length > 0 ? scene.layers : DEFAULT_LAYERS.map((layer) => ({ ...layer }))
  });
}
