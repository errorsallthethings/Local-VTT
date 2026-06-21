import {
  DEFAULT_ACID_EFFECT_TUNING_SETTINGS,
  DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS,
  DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS,
  DEFAULT_COLD_EFFECT_TUNING_SETTINGS,
  DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS,
  DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS,
  DEFAULT_FIRE_EFFECT_TUNING_SETTINGS,
  DEFAULT_FOG_EFFECT_TUNING_SETTINGS,
  DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS,
  DEFAULT_LAVA_EFFECT_TUNING_SETTINGS,
  DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS,
  DEFAULT_NATURE_EFFECT_TUNING_SETTINGS,
  DEFAULT_POISON_EFFECT_TUNING_SETTINGS,
  DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS,
  DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS,
  DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS,
  DEFAULT_VOID_EFFECT_TUNING_SETTINGS,
  DEFAULT_WATER_EFFECT_TUNING_SETTINGS,
  DEFAULT_VIDEO_PLAYBACK,
  type DrawingElement,
  type EnvironmentEffectMask,
  type EnvironmentEffectType,
  type FogShape,
  type GridSettings,
  type Layer,
  type MapTransform,
  type Point,
  type Scene,
  type Token,
  type WeatherMask
} from "../../../shared/localvtt";
import { duplicateDrawingElement } from "../drawings";
import { duplicateToken } from "../tokens";

export type LayerMoveDirection = "up" | "down";

export type DuplicateSceneDrawingResult = {
  scene: Scene;
  duplicatedDrawingId?: string;
};

export type DuplicateSceneFogShapeResult = {
  scene: Scene;
  duplicatedFogShapeId?: string;
};

export type DuplicateSceneWeatherMaskResult = {
  scene: Scene;
  duplicatedWeatherMaskId?: string;
};

export type DuplicateEnvironmentEffectResult = {
  scene: Scene;
  duplicatedEnvironmentEffectId?: string;
};

export type DuplicateSceneTokenResult = {
  scene: Scene;
  duplicatedTokenId?: string;
};

const DUPLICATE_SCENE_ITEM_OFFSET_PX = 24;

export type SceneSelectionIds = {
  tokenIds?: string[];
  drawingIds?: string[];
  fogShapeIds?: string[];
  weatherMaskIds?: string[];
  environmentEffectId?: string | null;
};

export function patchSceneVideoPlayback(scene: Scene, patch: Partial<Scene["videoPlayback"]>): Scene {
  return {
    ...scene,
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK, ...(scene.videoPlayback ?? {}), ...patch },
    updatedAt: new Date().toISOString()
  };
}

export function setSelectedSceneItemsPlayerVisibility(
  scene: Scene,
  selection: SceneSelectionIds,
  visibleInPlayer: boolean,
  updatedAt = new Date().toISOString()
): Scene {
  const selectedTokenIds = new Set(selection.tokenIds ?? []);
  const selectedDrawingIds = new Set(selection.drawingIds ?? []);
  const selectedFogShapeIds = new Set(selection.fogShapeIds ?? []);
  const selectedWeatherMaskIds = new Set(selection.weatherMaskIds ?? []);

  return {
    ...scene,
    updatedAt,
    tokens: scene.tokens.map((token) => (selectedTokenIds.has(token.id) ? { ...token, visibleInPlayer } : token)),
    drawings: scene.drawings.map((drawing) => (selectedDrawingIds.has(drawing.id) ? { ...drawing, visibleInPlayer } : drawing)),
    fog: {
      ...scene.fog,
      shapes: scene.fog.shapes.map((shape) =>
        selectedFogShapeIds.has(shape.id)
          ? { ...shape, visibleInPlayer, visible: (shape.visibleInGm ?? shape.visible ?? true) || visibleInPlayer }
          : shape
      )
    },
    weather: {
      ...scene.weather,
      masks: scene.weather.masks.map((mask) => (selectedWeatherMaskIds.has(mask.id) ? { ...mask, visibleInPlayer } : mask))
    },
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.map((effect) =>
        effect.id === selection.environmentEffectId ? { ...effect, visibleInPlayer } : effect
      )
    }
  };
}

export function removeSelectedSceneItems(scene: Scene, selection: SceneSelectionIds, updatedAt = new Date().toISOString()): Scene {
  const selectedTokenIds = new Set(selection.tokenIds ?? []);
  const selectedDrawingIds = new Set(selection.drawingIds ?? []);
  const selectedFogShapeIds = new Set(selection.fogShapeIds ?? []);
  const selectedWeatherMaskIds = new Set(selection.weatherMaskIds ?? []);

  return {
    ...scene,
    updatedAt,
    tokens: scene.tokens.filter((token) => !selectedTokenIds.has(token.id)),
    drawings: scene.drawings.filter((drawing) => !selectedDrawingIds.has(drawing.id)),
    fog: {
      ...scene.fog,
      shapes: scene.fog.shapes.filter((shape) => !selectedFogShapeIds.has(shape.id))
    },
    weather: {
      ...scene.weather,
      masks: scene.weather.masks.filter((mask) => !selectedWeatherMaskIds.has(mask.id))
    },
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.filter((effect) => effect.id !== selection.environmentEffectId)
    }
  };
}

export function patchSceneEnvironmentEffect(
  scene: Scene,
  effectId: string,
  updateEffect: (effect: EnvironmentEffectMask) => EnvironmentEffectMask,
  updatedAt = new Date().toISOString()
): Scene {
  return {
    ...scene,
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.map((effect) => (effect.id === effectId ? updateEffect(effect) : effect))
    },
    updatedAt
  };
}

export function setSceneEnvironmentEffectType(
  scene: Scene,
  effectId: string,
  effectType: EnvironmentEffectType,
  updatedAt = new Date().toISOString()
): Scene {
  return patchSceneEnvironmentEffect(scene, effectId, (effect) => ({
    ...effect,
    effect: effectType,
    acidTuning: effectType === "acid" ? (effect.acidTuning ?? { ...DEFAULT_ACID_EFFECT_TUNING_SETTINGS }) : undefined,
    coldTuning: effectType === "cold" ? (effect.coldTuning ?? { ...DEFAULT_COLD_EFFECT_TUNING_SETTINGS }) : undefined,
    darknessTuning: effectType === "darkness" ? (effect.darknessTuning ?? { ...DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS }) : undefined,
    poisonTuning: effectType === "poison" ? (effect.poisonTuning ?? { ...DEFAULT_POISON_EFFECT_TUNING_SETTINGS }) : undefined,
    waterTuning: effectType === "water" ? (effect.waterTuning ?? { ...DEFAULT_WATER_EFFECT_TUNING_SETTINGS }) : undefined,
    lavaTuning: effectType === "lava" ? (effect.lavaTuning ?? { ...DEFAULT_LAVA_EFFECT_TUNING_SETTINGS }) : undefined,
    fireTuning: effectType === "fire" ? (effect.fireTuning ?? { ...DEFAULT_FIRE_EFFECT_TUNING_SETTINGS }) : undefined,
    lightningTuning: effectType === "electric" ? (effect.lightningTuning ?? { ...DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS }) : undefined,
    arcaneTuning: effectType === "arcane" ? (effect.arcaneTuning ?? { ...DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS }) : undefined,
    chaosTuning: effectType === "chaos" ? (effect.chaosTuning ?? { ...DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS }) : undefined,
    voidTuning: effectType === "void" ? (effect.voidTuning ?? { ...DEFAULT_VOID_EFFECT_TUNING_SETTINGS }) : undefined,
    natureTuning: effectType === "nature" ? (effect.natureTuning ?? { ...DEFAULT_NATURE_EFFECT_TUNING_SETTINGS }) : undefined,
    distortionTuning: effectType === "distortion" ? (effect.distortionTuning ?? { ...DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS }) : undefined,
    radiantTuning: effectType === "radiant" ? (effect.radiantTuning ?? { ...DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS }) : undefined,
    fieldTuning: effectType === "field" ? (effect.fieldTuning ?? { ...DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS }) : undefined,
    shockwaveTuning: effectType === "shockwave" ? (effect.shockwaveTuning ?? { ...DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS }) : undefined,
    smokeTuning: effectType === "smoke" ? (effect.smokeTuning ?? { ...DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS }) : undefined,
    fogTuning: effectType === "fog" ? (effect.fogTuning ?? { ...DEFAULT_FOG_EFFECT_TUNING_SETTINGS }) : undefined
  }), updatedAt);
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

export function addSceneFogShape(scene: Scene, shape: FogShape, fogPatch: Partial<Scene["fog"]> = {}, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    fog: {
      ...scene.fog,
      ...fogPatch,
      shapes: [...scene.fog.shapes, shape]
    },
    updatedAt
  };
}

export function patchSceneToken(scene: Scene, tokenId: string, patch: Partial<Token>, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    tokens: scene.tokens.map((token) => (token.id === tokenId ? { ...token, ...patch } : token)),
    updatedAt
  };
}

export function updateSceneTokenPositions(scene: Scene, startPositions: ReadonlyMap<string, Point>, delta: Point, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    tokens: scene.tokens.map((token) => {
      const startPosition = startPositions.get(token.id);
      if (!startPosition) {
        return token;
      }
      return {
        ...token,
        position: {
          x: startPosition.x + delta.x,
          y: startPosition.y + delta.y
        }
      };
    }),
    updatedAt
  };
}

export function duplicateSceneToken(scene: Scene, tokenId: string, duplicateId: string, updatedAt = new Date().toISOString()): DuplicateSceneTokenResult {
  const tokens = duplicateToken(scene.tokens, tokenId, duplicateId);
  if (tokens.length === scene.tokens.length) {
    return { scene };
  }

  return {
    scene: {
      ...scene,
      tokens,
      updatedAt
    },
    duplicatedTokenId: duplicateId
  };
}

export function removeSceneToken(scene: Scene, tokenId: string, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    tokens: scene.tokens.filter((token) => token.id !== tokenId),
    updatedAt
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

export function setFogShapeGmVisibility(scene: Scene, shapeId: string, visibleInGm: boolean, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    fog: {
      ...scene.fog,
      shapes: scene.fog.shapes.map((shape) =>
        shape.id === shapeId
          ? {
              ...shape,
              visibleInGm,
              visible: visibleInGm || (shape.visibleInPlayer ?? shape.visible ?? true)
            }
          : shape
      )
    },
    updatedAt
  };
}

export function duplicateSceneFogShape(
  scene: Scene,
  shapeId: string,
  duplicateId: string,
  sourceLabel?: string,
  updatedAt = new Date().toISOString()
): DuplicateSceneFogShapeResult {
  const sourceShape = scene.fog.shapes.find((shape) => shape.id === shapeId);
  if (!sourceShape) {
    return { scene };
  }

  const duplicatedShape: FogShape = {
    ...sourceShape,
    id: duplicateId,
    name: getDuplicateSceneItemName(sourceShape.name?.trim() || sourceLabel || "Fog Shape", scene.fog.shapes),
    points: offsetPoints(sourceShape.points)
  };

  return {
    scene: {
      ...scene,
      fog: {
        ...scene.fog,
        shapes: [...scene.fog.shapes, duplicatedShape]
      },
      updatedAt
    },
    duplicatedFogShapeId: duplicatedShape.id
  };
}

export function removeSceneFogShape(scene: Scene, shapeId: string, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    fog: {
      ...scene.fog,
      shapes: scene.fog.shapes.filter((shape) => shape.id !== shapeId)
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

export function setWeatherMaskPlayerVisibility(scene: Scene, maskId: string, visibleInPlayer: boolean, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    weather: {
      ...scene.weather,
      masks: scene.weather.masks.map((mask) => (mask.id === maskId ? { ...mask, visibleInPlayer } : mask))
    },
    updatedAt
  };
}

export function duplicateSceneWeatherMask(
  scene: Scene,
  maskId: string,
  duplicateId: string,
  sourceLabel?: string,
  updatedAt = new Date().toISOString()
): DuplicateSceneWeatherMaskResult {
  const sourceMask = scene.weather.masks.find((mask) => mask.id === maskId);
  if (!sourceMask) {
    return { scene };
  }

  const duplicatedMask: WeatherMask = {
    ...sourceMask,
    id: duplicateId,
    name: getDuplicateSceneItemName(sourceMask.name?.trim() || sourceLabel || "Weather Mask", scene.weather.masks),
    points: offsetPoints(sourceMask.points)
  };

  return {
    scene: {
      ...scene,
      weather: {
        ...scene.weather,
        masks: [...scene.weather.masks, duplicatedMask]
      },
      updatedAt
    },
    duplicatedWeatherMaskId: duplicatedMask.id
  };
}

export function removeSceneWeatherMask(scene: Scene, maskId: string, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    weather: {
      ...scene.weather,
      masks: scene.weather.masks.filter((mask) => mask.id !== maskId)
    },
    updatedAt
  };
}

export function updateSceneWeatherMaskPoints(scene: Scene, weatherMaskPoints: ReadonlyMap<string, Point[]>, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    weather: {
      ...scene.weather,
      masks: scene.weather.masks.map((mask) => {
        const points = weatherMaskPoints.get(mask.id);
        return points ? { ...mask, points } : mask;
      })
    },
    updatedAt
  };
}

export function addSceneWeatherMask(scene: Scene, mask: WeatherMask, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    weather: {
      ...scene.weather,
      masks: [...scene.weather.masks, mask]
    },
    updatedAt
  };
}

export function patchSceneDrawing(scene: Scene, drawingId: string, patch: Partial<Scene["drawings"][number]>, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    drawings: scene.drawings.map((drawing) => (drawing.id === drawingId ? { ...drawing, ...patch } : drawing)),
    updatedAt
  };
}

export function addSceneDrawing(scene: Scene, drawing: DrawingElement, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    drawings: [...scene.drawings, drawing],
    updatedAt
  };
}

export function updateSceneDrawingPoints(scene: Scene, drawingPoints: ReadonlyMap<string, Point[]>, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    drawings: scene.drawings.map((drawing) => {
      const points = drawingPoints.get(drawing.id);
      return points ? { ...drawing, points } : drawing;
    }),
    updatedAt
  };
}

export function setDrawingTemplateFootprintVisibility(scene: Scene, drawingId: string, templateFootprintVisible: boolean, updatedAt = new Date().toISOString()): Scene {
  return patchSceneDrawing(scene, drawingId, { templateFootprintVisible }, updatedAt);
}

export function setDrawingPlayerVisibility(scene: Scene, drawingId: string, visibleInPlayer: boolean, updatedAt = new Date().toISOString()): Scene {
  return patchSceneDrawing(scene, drawingId, { visibleInPlayer }, updatedAt);
}

export function setDrawingGmVisibility(scene: Scene, drawingId: string, visibleInGm: boolean, updatedAt = new Date().toISOString()): Scene {
  return patchSceneDrawing(scene, drawingId, { visibleInGm }, updatedAt);
}

export function duplicateSceneDrawing(
  scene: Scene,
  drawingId: string,
  duplicateId: string,
  sourceLabel?: string,
  updatedAt = new Date().toISOString()
): DuplicateSceneDrawingResult {
  const sourceDrawing = scene.drawings.find((drawing) => drawing.id === drawingId);
  if (!sourceDrawing) {
    return { scene };
  }

  const duplicatedDrawing = duplicateDrawingElement(sourceDrawing, scene.drawings, duplicateId, sourceLabel);
  return {
    scene: {
      ...scene,
      drawings: [...scene.drawings, duplicatedDrawing],
      updatedAt
    },
    duplicatedDrawingId: duplicatedDrawing.id
  };
}

export function removeSceneDrawing(scene: Scene, drawingId: string, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    drawings: scene.drawings.filter((drawing) => drawing.id !== drawingId),
    updatedAt
  };
}

export function removeEnvironmentEffect(scene: Scene, effectId: string, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.filter((effect) => effect.id !== effectId)
    },
    updatedAt
  };
}

export function duplicateEnvironmentEffect(
  scene: Scene,
  effectId: string,
  duplicateId: string,
  sourceLabel?: string,
  updatedAt = new Date().toISOString()
): DuplicateEnvironmentEffectResult {
  const sourceEffect = scene.environment.effects.find((effect) => effect.id === effectId);
  if (!sourceEffect) {
    return { scene };
  }

  const duplicatedEffect: EnvironmentEffectMask = {
    ...sourceEffect,
    id: duplicateId,
    name: getDuplicateSceneItemName(sourceEffect.name?.trim() || sourceLabel || "Animated Effect", scene.environment.effects),
    points: offsetPoints(sourceEffect.points)
  };

  return {
    scene: {
      ...scene,
      environment: {
        ...scene.environment,
        effects: [...scene.environment.effects, duplicatedEffect]
      },
      updatedAt
    },
    duplicatedEnvironmentEffectId: duplicatedEffect.id
  };
}

export function updateSceneEnvironmentEffectPoints(scene: Scene, environmentEffectPoints: ReadonlyMap<string, Point[]>, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.map((effect) => {
        const points = environmentEffectPoints.get(effect.id);
        return points ? { ...effect, points } : effect;
      })
    },
    updatedAt
  };
}

export function addEnvironmentEffect(scene: Scene, effect: EnvironmentEffectMask, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    environment: {
      ...scene.environment,
      effects: [...scene.environment.effects, effect]
    },
    updatedAt
  };
}

function offsetPoints(points: Point[]): Point[] {
  return points.map((point) => ({
    x: point.x + DUPLICATE_SCENE_ITEM_OFFSET_PX,
    y: point.y + DUPLICATE_SCENE_ITEM_OFFSET_PX
  }));
}

function getDuplicateSceneItemName(sourceName: string, items: Array<{ name?: string }>): string {
  const baseName = sourceName.replace(/\sCopy(?:\s\d+)?$/i, "").trim() || "Item";
  const existingNames = new Set(items.map((item) => (item.name ?? "").trim().toLowerCase()).filter(Boolean));
  let candidate = `${baseName} Copy`;
  let index = 2;
  while (existingNames.has(candidate.toLowerCase())) {
    candidate = `${baseName} Copy ${index}`;
    index += 1;
  }
  return candidate;
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
