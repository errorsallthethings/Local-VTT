import { DEFAULT_VIDEO_PLAYBACK, type GridSettings, type Layer, type MapTransform, type Scene } from "../../shared/localvtt";

export type LayerMoveDirection = "up" | "down";

export function patchSceneVideoPlayback(scene: Scene, patch: Partial<Scene["videoPlayback"]>): Scene {
  return {
    ...scene,
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK, ...(scene.videoPlayback ?? {}), ...patch },
    updatedAt: new Date().toISOString()
  };
}

export function patchSceneGrid(scene: Scene, patch: Partial<GridSettings>): Scene {
  return {
    ...scene,
    grid: { ...scene.grid, ...patch },
    updatedAt: new Date().toISOString()
  };
}

export function patchSceneFog(scene: Scene, patch: Partial<Scene["fog"]>): Scene {
  return {
    ...scene,
    fog: { ...scene.fog, ...patch },
    updatedAt: new Date().toISOString()
  };
}

export function setFogShapePlayerVisibility(scene: Scene, shapeId: string, visibleInPlayer: boolean, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    fog: {
      ...scene.fog,
      shapes: scene.fog.shapes.map((shape) =>
        shape.id === shapeId
          ? {
              ...shape,
              visibleInPlayer,
              visible: (shape.visibleInGm ?? shape.visible ?? true) || visibleInPlayer
            }
          : shape
      )
    },
    updatedAt
  };
}

export function setWeatherMaskVisibility(scene: Scene, maskId: string, visible: boolean, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    weather: {
      ...scene.weather,
      masks: scene.weather.masks.map((mask) => (mask.id === maskId ? { ...mask, visible } : mask))
    },
    updatedAt
  };
}

export function patchSceneMapTransform(scene: Scene, patch: Partial<MapTransform>): Scene {
  return {
    ...scene,
    mapTransform: { ...scene.mapTransform, ...patch },
    updatedAt: new Date().toISOString()
  };
}

export function setSceneLayerOrderLocked(scene: Scene, locked: boolean): Scene {
  return {
    ...scene,
    layerOrderLocked: locked,
    updatedAt: new Date().toISOString()
  };
}

export function moveSceneLayer(scene: Scene, layerId: string, direction: LayerMoveDirection): Scene {
  const nextLayers = moveLayerOrder(scene.layers, layerId, direction);
  return nextLayers === scene.layers
    ? scene
    : {
        ...scene,
        layers: nextLayers,
        updatedAt: new Date().toISOString()
      };
}

export function moveLayerOrder(layers: readonly Layer[], layerId: string, direction: LayerMoveDirection): Layer[] {
  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);
  const currentIndex = sortedLayers.findIndex((layer) => layer.id === layerId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedLayers.length) {
    return [...layers];
  }

  const nextSortedLayers = [...sortedLayers];
  [nextSortedLayers[currentIndex], nextSortedLayers[targetIndex]] = [nextSortedLayers[targetIndex], nextSortedLayers[currentIndex]];
  return nextSortedLayers.map((layer, index) => ({
    ...layer,
    order: (nextSortedLayers.length - index) * 10
  }));
}

export function getFitGridPatch(scene: Scene, dimensions: { width: number; height: number }): Pick<GridSettings, "sizePx" | "offsetX" | "offsetY"> {
  const columns = Math.max(1, scene.grid.mapGridColumns);
  const rows = Math.max(1, scene.grid.mapGridRows);
  const cellWidth = dimensions.width / columns;
  const cellHeight = dimensions.height / rows;
  return {
    sizePx: Math.max(1, Math.round(((cellWidth + cellHeight) / 2) * 100) / 100),
    offsetX: scene.mapTransform.fitMode === "manual" ? scene.mapTransform.x : 0,
    offsetY: scene.mapTransform.fitMode === "manual" ? scene.mapTransform.y : 0
  };
}
