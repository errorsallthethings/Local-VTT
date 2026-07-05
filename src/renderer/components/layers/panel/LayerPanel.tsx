import { useMemo, useState, type ComponentProps } from "react";
import type {
  Asset,
  DrawingElement,
  FogSettings,
  GridSettings,
  Layer,
  MapTransform,
  Scene,
  WeatherSettings,
  WeatherTuningSettings
} from "../../../../shared/localvtt";
import { type Token } from "../../../../shared/localvtt";
import { type DropPlacement } from "../../../lib/ui";
import { type ActiveWeatherCategory } from "../../../lib/effects";
import { FogShapeList, type FogShapeDropTarget } from "../lists/FogShapeList";
import { DrawingList, type DrawingDropTarget } from "./DrawingList";
import { EnvironmentEffectList } from "./EnvironmentEffectList";
import { FogSettingsPanel } from "./FogSettingsPanel";
import { LayerPanelRow } from "./LayerPanelRow";
import { MapLayerContent } from "./MapLayerContent";
import { MapLayerSettingsPanel } from "./MapLayerSettingsPanel";
import { TokenLayerContent } from "./TokenLayerContent";
import { WeatherMaskList } from "./WeatherMaskList";
import { WeatherSettingsPanel } from "./WeatherSettingsPanel";
import {
  getLayerItemCount,
  getReservedLayerGuidance,
  isEffectsLayerId
} from "./layerPanelFormat";
import {
  applyLayerPatch,
  getLayerExpandedToggleState,
  getLayerPanelVisibleLayers,
  getLayerSettingsToggleIds,
  getReorderedDrawings,
  getReorderedFogShapes,
  getSceneWithDrawings,
  getSceneWithEnvironmentPatch,
  getSceneWithTokenPatch,
  getSceneWithTokens,
  getSceneWithWeatherPatch,
  hasLayerSettings
} from "./layerPanelState";
import {
  getWeatherWithCategoryToggled,
  getWeatherWithDriftReset,
  getWeatherWithSelectedEffect,
  getWeatherWithTuningPatch,
  getWeatherWithTuningReset,
  type WeatherTuningKey
} from "./layerPanelWeather";

const EMPTY_SELECTED_IDS: string[] = [];

export function LayerPanel({
  scene,
  mapAsset,
  tokenAssets,
  selectedFogShapeId,
  selectedWeatherMaskId,
  selectedEnvironmentEffectId,
  selectedDrawingId,
  selectedTokenId,
  selectedFogShapeIds = EMPTY_SELECTED_IDS,
  selectedWeatherMaskIds = EMPTY_SELECTED_IDS,
  selectedDrawingIds = EMPTY_SELECTED_IDS,
  selectedTokenIds = EMPTY_SELECTED_IDS,
  onChange,
  onUpdateGrid,
  onUpdateFog,
  onUpdateMapTransform,
  onApplyMapFitPreset,
  onMoveLayer,
  onImportMap,
  onReplaceMap,
  onImportToken,
  onDeleteMap,
  onSelectFogShape,
  onSelectWeatherMask,
  onSelectEnvironmentEffect,
  onEditEnvironmentEffect,
  onSelectDrawing,
  onSelectToken,
  onRenameFogShape,
  onRenameEnvironmentEffect,
  onRenameToken,
  onOpenFogColor,
  onOpenGridColor,
  onOpenTokenColor
}: {
  scene: Scene;
  mapAsset: Asset | null;
  tokenAssets: Map<string, Asset>;
  selectedFogShapeId: string | null;
  selectedWeatherMaskId: string | null;
  selectedEnvironmentEffectId: string | null;
  selectedDrawingId: string | null;
  selectedTokenId: string | null;
  selectedFogShapeIds?: string[];
  selectedWeatherMaskIds?: string[];
  selectedDrawingIds?: string[];
  selectedTokenIds?: string[];
  onChange: (scene: Scene) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onApplyMapFitPreset: (fitMode: Exclude<MapTransform["fitMode"], "manual">, gridPatch?: Partial<GridSettings>) => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
  onImportMap: () => void;
  onReplaceMap: (asset: Asset) => void;
  onImportToken: () => void;
  onDeleteMap: (asset: Asset) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onSelectWeatherMask: (maskId: string | null) => void;
  onSelectEnvironmentEffect: (effectId: string | null) => void;
  onEditEnvironmentEffect: (effectId: string) => void;
  onSelectDrawing: (drawingId: string | null) => void;
  onSelectToken: (tokenId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onRenameEnvironmentEffect: (effectId: string, fallbackName: string) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onOpenFogColor: () => void;
  onOpenGridColor: () => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const visibleLayers = useMemo(() => getLayerPanelVisibleLayers(scene.layers), [scene.layers]);
  const [expandedLayerIds, setExpandedLayerIds] = useState<Set<string>>(() => new Set());
  const [settingsLayerIds, setSettingsLayerIds] = useState<Set<string>>(() => new Set());
  const [draggedFogShapeId, setDraggedFogShapeId] = useState<string | null>(null);
  const [fogShapeDropTarget, setFogShapeDropTarget] = useState<FogShapeDropTarget>(null);
  const [draggedDrawingId, setDraggedDrawingId] = useState<string | null>(null);
  const [drawingDropTarget, setDrawingDropTarget] = useState<DrawingDropTarget>(null);
  const [expandedWeatherCategory, setExpandedWeatherCategory] = useState<ActiveWeatherCategory | null>(null);
  const [fogPlayerDefaultHelpOpen, setFogPlayerDefaultHelpOpen] = useState(false);
  const [mapFitHelpOpen, setMapFitHelpOpen] = useState(false);
  const [mapAdvancedOpen, setMapAdvancedOpen] = useState(false);

  const updateLayer = (layerId: string, patch: Partial<Layer>) => {
    onChange(applyLayerPatch(scene, layerId, patch));
  };

  const toggleLayerExpanded = (layerId: string) => {
    const nextState = getLayerExpandedToggleState(layerId, expandedLayerIds, settingsLayerIds);
    setExpandedLayerIds(nextState.expandedLayerIds);
    setSettingsLayerIds(nextState.settingsLayerIds);
  };

  const toggleLayerSettings = (layerId: string) => {
    setSettingsLayerIds((ids) => getLayerSettingsToggleIds(layerId, ids));
  };

  const moveFogShape = (sourceShapeId: string, targetShapeId: string, placement: DropPlacement) => {
    if (sourceShapeId === targetShapeId) {
      return;
    }
    onUpdateFog({ shapes: getReorderedFogShapes(scene.fog.shapes, sourceShapeId, targetShapeId, placement) });
  };

  const updateDrawings = (drawings: DrawingElement[]) => onChange(getSceneWithDrawings(scene, drawings));

  const moveDrawing = (sourceDrawingId: string, targetDrawingId: string, placement: DropPlacement) => {
    if (sourceDrawingId === targetDrawingId) {
      return;
    }
    updateDrawings(getReorderedDrawings(scene.drawings, sourceDrawingId, targetDrawingId, placement));
  };

  const updateTokens = (tokens: Token[]) => onChange(getSceneWithTokens(scene, tokens));

  const updateToken = (tokenId: string, patch: Partial<Token>) => {
    onChange(getSceneWithTokenPatch(scene, tokenId, patch));
  };

  const updateWeather = (patch: Partial<WeatherSettings>) => {
    onChange(getSceneWithWeatherPatch(scene, patch));
  };

  const updateEnvironment = (patch: Partial<Scene["environment"]>) => {
    onChange(getSceneWithEnvironmentPatch(scene, patch));
  };

  const toggleWeatherCategory = (category: ActiveWeatherCategory, enabled: boolean) => {
    updateWeather(getWeatherWithCategoryToggled(scene.weather, category, enabled));
    if (!enabled && expandedWeatherCategory === category) {
      setExpandedWeatherCategory(null);
    }
  };

  const selectWeatherEffect: ComponentProps<typeof WeatherSettingsPanel>["onSelectWeatherEffect"] = (category, effect) => {
    updateWeather(getWeatherWithSelectedEffect(scene.weather, category, effect));
  };

  const updateWeatherTuning = (category: ActiveWeatherCategory, patch: Partial<WeatherTuningSettings>) => {
    updateWeather(getWeatherWithTuningPatch(scene.weather, category, patch));
  };

  const resetWeatherTuning = (category: ActiveWeatherCategory, key: WeatherTuningKey) => {
    updateWeather(getWeatherWithTuningReset(scene.weather, category, key));
  };

  const resetWeatherDrift = (category: ActiveWeatherCategory) => {
    updateWeather(getWeatherWithDriftReset(scene.weather, category));
  };

  return (
    <section className="panel">
      <div className="layer-list">
        {visibleLayers.map((layer, index) => {
          const hasLayerSettingsAvailable = hasLayerSettings(layer.id);
          const hasLayerContents = true;
          const isExpanded = hasLayerContents && expandedLayerIds.has(layer.id);
          const areSettingsExpanded = settingsLayerIds.has(layer.id);
          const reservedLayerGuidance = getReservedLayerGuidance(layer);
          const layerCount = getLayerItemCount(layer.id, scene);
          return (
            <LayerPanelRow
              key={layer.id}
              layer={layer}
              index={index}
              layerCount={layerCount}
              layerOrderLocked={scene.layerOrderLocked}
              totalLayers={visibleLayers.length}
              hasContents={hasLayerContents}
              hasSettings={hasLayerSettingsAvailable}
              settingsExpanded={areSettingsExpanded}
              onMoveLayer={onMoveLayer}
              onToggleExpanded={toggleLayerExpanded}
              onToggleGmVisibility={(layerId, visibleInGm) => updateLayer(layerId, { visibleInGm })}
              onTogglePlayerVisibility={(layerId, visibleInPlayer) => updateLayer(layerId, { visibleInPlayer })}
              onToggleSettings={toggleLayerSettings}
            >
              {reservedLayerGuidance && isExpanded && (
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <div className="layer-empty-state">
                    <strong>{layer.name}</strong>
                    <span>{reservedLayerGuidance}</span>
                  </div>
                </div>
              )}
              {layer.id === "fog" && areSettingsExpanded && (
                <FogSettingsPanel
                  fog={scene.fog}
                  isNewShapeHelpOpen={fogPlayerDefaultHelpOpen}
                  onToggleNewShapeHelp={() => setFogPlayerDefaultHelpOpen((open) => !open)}
                  onUpdateFog={onUpdateFog}
                  onOpenFogColor={onOpenFogColor}
                />
              )}
              {layer.id === "fog" && isExpanded && (
                <FogShapeList
                  scene={scene}
                  selectedFogShapeId={selectedFogShapeId}
                  selectedFogShapeIds={selectedFogShapeIds}
                  draggedFogShapeId={draggedFogShapeId}
                  fogShapeDropTarget={fogShapeDropTarget}
                  onDraggedFogShapeIdChange={setDraggedFogShapeId}
                  onFogShapeDropTargetChange={setFogShapeDropTarget}
                  onMoveFogShape={moveFogShape}
                  onSelectFogShape={onSelectFogShape}
                  onRenameFogShape={onRenameFogShape}
                  onUpdateFog={onUpdateFog}
                />
              )}
              {layer.id === "drawing" && isExpanded && (
                <DrawingList
                  drawings={scene.drawings}
                  selectedDrawingId={selectedDrawingId}
                  selectedDrawingIds={selectedDrawingIds}
                  draggedDrawingId={draggedDrawingId}
                  drawingDropTarget={drawingDropTarget}
                  onDraggedDrawingIdChange={setDraggedDrawingId}
                  onDrawingDropTargetChange={setDrawingDropTarget}
                  onMoveDrawing={moveDrawing}
                  onSelectDrawing={onSelectDrawing}
                  onUpdateDrawings={updateDrawings}
                />
              )}
              {isEffectsLayerId(layer.id) && areSettingsExpanded && (
                <WeatherSettingsPanel
                  weather={scene.weather}
                  expandedWeatherCategory={expandedWeatherCategory}
                  onExpandedWeatherCategoryChange={setExpandedWeatherCategory}
                  onToggleWeatherCategory={toggleWeatherCategory}
                  onSelectWeatherEffect={selectWeatherEffect}
                  onUpdateWeatherTuning={updateWeatherTuning}
                  onResetWeatherTuning={resetWeatherTuning}
                  onResetWeatherDrift={resetWeatherDrift}
                />
              )}
              {isEffectsLayerId(layer.id) && isExpanded && !areSettingsExpanded && (
                <>
                  <EnvironmentEffectList
                    scene={scene}
                    selectedEnvironmentEffectId={selectedEnvironmentEffectId}
                    onSelectEnvironmentEffect={onSelectEnvironmentEffect}
                    onEditEnvironmentEffect={onEditEnvironmentEffect}
                    onRenameEnvironmentEffect={onRenameEnvironmentEffect}
                    onUpdateEnvironment={updateEnvironment}
                  />
                  <WeatherMaskList
                    scene={scene}
                    selectedWeatherMaskId={selectedWeatherMaskId}
                    selectedWeatherMaskIds={selectedWeatherMaskIds}
                    onSelectWeatherMask={onSelectWeatherMask}
                    onUpdateWeather={updateWeather}
                  />
                </>
              )}
              {layer.id === "token" && isExpanded && (
                <TokenLayerContent
                  scene={scene}
                  tokenAssets={tokenAssets}
                  selectedTokenId={selectedTokenId}
                  selectedTokenIds={selectedTokenIds}
                  onImportToken={onImportToken}
                  onSelectToken={onSelectToken}
                  onRenameToken={onRenameToken}
                  onUpdateToken={updateToken}
                  onUpdateTokens={updateTokens}
                  onOpenTokenColor={onOpenTokenColor}
                />
              )}
              {layer.id === "map" && isExpanded && !areSettingsExpanded && (
                <MapLayerContent
                  scene={scene}
                  mapAsset={mapAsset}
                  onUpdateGrid={onUpdateGrid}
                  onImportMap={onImportMap}
                  onReplaceMap={onReplaceMap}
                  onDeleteMap={onDeleteMap}
                />
              )}
              {layer.id === "map" && areSettingsExpanded && (
                <MapLayerSettingsPanel
                  scene={scene}
                  mapAsset={mapAsset}
                  mapFitHelpOpen={mapFitHelpOpen}
                  mapAdvancedOpen={mapAdvancedOpen}
                  onToggleMapFitHelp={() => setMapFitHelpOpen((open) => !open)}
                  onToggleMapAdvanced={() => setMapAdvancedOpen((open) => !open)}
                  onUpdateGrid={onUpdateGrid}
                  onUpdateMapTransform={onUpdateMapTransform}
                  onApplyMapFitPreset={onApplyMapFitPreset}
                  onOpenGridColor={onOpenGridColor}
                  onImportMap={onImportMap}
                />
              )}
            </LayerPanelRow>
          );
        })}
      </div>
    </section>
  );
}


