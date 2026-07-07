import { useMemo } from "react";
import type {
  Asset,
  FogSettings,
  GridSettings,
  Layer,
  MapTransform,
  Scene,
  WeatherSettings
} from "../../../../shared/localvtt";
import { type Token } from "../../../../shared/localvtt";
import { LayerPanelLayerContent } from "./LayerPanelLayerContent";
import { LayerPanelRow } from "./LayerPanelRow";
import {
  getLayerItemCount,
  getReservedLayerGuidance,
} from "./layerPanelFormat";
import {
  applyLayerPatch,
  getLayerPanelVisibleLayers,
  getSceneWithDrawings,
  getSceneWithEnvironmentPatch,
  getSceneWithTokenPatch,
  getSceneWithTokens,
  getSceneWithWeatherPatch,
  hasLayerSettings
} from "./layerPanelState";
import { useLayerPanelExpansionState } from "./useLayerPanelExpansionState";

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
  const {
    expandedLayerIds,
    settingsLayerIds,
    toggleLayerExpanded,
    toggleLayerSettings
  } = useLayerPanelExpansionState();

  const updateLayer = (layerId: string, patch: Partial<Layer>) => {
    onChange(applyLayerPatch(scene, layerId, patch));
  };

  const updateDrawings = (drawings: typeof scene.drawings) => onChange(getSceneWithDrawings(scene, drawings));

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
              <LayerPanelLayerContent
                areSettingsExpanded={areSettingsExpanded}
                isExpanded={isExpanded}
                layer={layer}
                mapAsset={mapAsset}
                reservedLayerGuidance={reservedLayerGuidance}
                scene={scene}
                selectedDrawingId={selectedDrawingId}
                selectedDrawingIds={selectedDrawingIds}
                selectedEnvironmentEffectId={selectedEnvironmentEffectId}
                selectedFogShapeId={selectedFogShapeId}
                selectedFogShapeIds={selectedFogShapeIds}
                selectedTokenId={selectedTokenId}
                selectedTokenIds={selectedTokenIds}
                selectedWeatherMaskId={selectedWeatherMaskId}
                selectedWeatherMaskIds={selectedWeatherMaskIds}
                tokenAssets={tokenAssets}
                onApplyMapFitPreset={onApplyMapFitPreset}
                onDeleteMap={onDeleteMap}
                onEditEnvironmentEffect={onEditEnvironmentEffect}
                onImportMap={onImportMap}
                onImportToken={onImportToken}
                onOpenFogColor={onOpenFogColor}
                onOpenGridColor={onOpenGridColor}
                onOpenTokenColor={onOpenTokenColor}
                onRenameEnvironmentEffect={onRenameEnvironmentEffect}
                onRenameFogShape={onRenameFogShape}
                onRenameToken={onRenameToken}
                onReplaceMap={onReplaceMap}
                onSelectDrawing={onSelectDrawing}
                onSelectEnvironmentEffect={onSelectEnvironmentEffect}
                onSelectFogShape={onSelectFogShape}
                onSelectToken={onSelectToken}
                onSelectWeatherMask={onSelectWeatherMask}
                onUpdateDrawings={updateDrawings}
                onUpdateEnvironment={updateEnvironment}
                onUpdateFog={onUpdateFog}
                onUpdateGrid={onUpdateGrid}
                onUpdateMapTransform={onUpdateMapTransform}
                onUpdateToken={updateToken}
                onUpdateTokens={updateTokens}
                onUpdateWeather={updateWeather}
              />
            </LayerPanelRow>
          );
        })}
      </div>
    </section>
  );
}


