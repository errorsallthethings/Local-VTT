import { formatDefaultFogShapeName, type DrawingElement, type FogShape, type Layer, type Scene } from "../../../../shared/localvtt";
import { reorderByDropTarget, type DropPlacement } from "../../../lib/ui";
import { isEffectsLayerId } from "./layerPanelFormat";

export interface LayerExpandedToggleState {
  expandedLayerIds: Set<string>;
  settingsLayerIds: Set<string>;
}

export function getLayerPanelVisibleLayers(layers: readonly Layer[]): Layer[] {
  return [...layers].sort((a, b) => b.order - a.order).filter((layer) => layer.id !== "grid");
}

export function getLayerDisplayName(layer: Layer): string {
  return layer.id === "map" ? "Grid & Maps" : layer.name;
}

export function hasLayerSettings(layerId: string): boolean {
  return layerId === "map" || layerId === "fog" || isEffectsLayerId(layerId);
}

export function getLayerRowClassName(expandable: boolean): string {
  return ["layer-row", expandable ? "expandable-layer-row" : ""].filter(Boolean).join(" ");
}

export function getLayerVisibilityButtonClassName(visible: boolean): string {
  return visible ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button";
}

export function getLayerSettingsButtonClassName(expanded: boolean): string {
  return expanded ? "icon-button layer-settings-button layer-settings-active" : "icon-button layer-settings-button";
}

export function getLayerVisibilityLabel(layerName: string, view: "GM" | "Player", visible: boolean): string {
  return visible ? `Hide ${layerName} in ${view} View` : `Show ${layerName} in ${view} View`;
}

export function getLayerVisibilityTitle(visible: boolean, view: "GM" | "Player"): string {
  return visible ? `Hide in ${view} View` : `Show in ${view} View`;
}

export function getLayerSettingsLabel(layerName: string, available: boolean, expanded: boolean): string {
  if (!available) {
    return `${layerName} settings unavailable`;
  }
  return expanded ? `Hide ${layerName} settings` : `Show ${layerName} settings`;
}

export function getLayerSettingsTitle(available: boolean, expanded: boolean): string {
  if (!available) {
    return "No layer settings yet";
  }
  return expanded ? "Hide layer settings" : "Show layer settings";
}

export function getLayerExpandedToggleState(
  layerId: string,
  expandedLayerIds: ReadonlySet<string>,
  settingsLayerIds: ReadonlySet<string>
): LayerExpandedToggleState {
  const nextExpandedLayerIds = new Set(expandedLayerIds);
  const nextSettingsLayerIds = new Set(settingsLayerIds);
  if (nextSettingsLayerIds.has(layerId)) {
    nextSettingsLayerIds.delete(layerId);
    nextExpandedLayerIds.add(layerId);
    return {
      expandedLayerIds: nextExpandedLayerIds,
      settingsLayerIds: nextSettingsLayerIds
    };
  }
  if (nextExpandedLayerIds.has(layerId)) {
    nextExpandedLayerIds.delete(layerId);
  } else {
    nextExpandedLayerIds.add(layerId);
  }
  return {
    expandedLayerIds: nextExpandedLayerIds,
    settingsLayerIds: nextSettingsLayerIds
  };
}

export function getLayerSettingsToggleIds(layerId: string, settingsLayerIds: ReadonlySet<string>): Set<string> {
  const nextIds = new Set(settingsLayerIds);
  if (nextIds.has(layerId)) {
    nextIds.delete(layerId);
  } else {
    nextIds.clear();
    nextIds.add(layerId);
  }
  return nextIds;
}

export function applyLayerPatch(scene: Scene, layerId: string, patch: Partial<Layer>, updatedAt = new Date().toISOString()): Scene {
  const nextGrid =
    layerId === "grid"
      ? {
          ...scene.grid,
          showOnGm: patch.visibleInGm ?? scene.grid.showOnGm,
          showOnPlayer: patch.visibleInPlayer ?? scene.grid.showOnPlayer
        }
      : scene.grid;
  const nextTokens =
    layerId === "token" && (typeof patch.visibleInGm === "boolean" || typeof patch.visibleInPlayer === "boolean")
      ? scene.tokens.map((token) => ({
          ...token,
          visibleInGm: patch.visibleInGm ?? token.visibleInGm,
          visibleInPlayer: patch.visibleInPlayer ?? token.visibleInPlayer
        }))
      : scene.tokens;
  return {
    ...scene,
    grid: nextGrid,
    layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
    tokens: nextTokens,
    updatedAt
  };
}

export function getReorderedFogShapes(
  shapes: readonly FogShape[],
  sourceShapeId: string,
  targetShapeId: string,
  placement: DropPlacement
): FogShape[] {
  if (sourceShapeId === targetShapeId) {
    return [...shapes];
  }
  const namedShapes = shapes.map((shape, index) => ({
    ...shape,
    name: shape.name?.trim() || formatDefaultFogShapeName(shape.operation, shape.kind, index)
  }));
  return reorderByDropTarget(namedShapes, (shape) => shape.id, sourceShapeId, targetShapeId, placement);
}

export function getReorderedDrawings(
  drawings: readonly DrawingElement[],
  sourceDrawingId: string,
  targetDrawingId: string,
  placement: DropPlacement
): DrawingElement[] {
  if (sourceDrawingId === targetDrawingId) {
    return [...drawings];
  }
  return reorderByDropTarget(drawings, (drawing) => drawing.id, sourceDrawingId, targetDrawingId, placement);
}
