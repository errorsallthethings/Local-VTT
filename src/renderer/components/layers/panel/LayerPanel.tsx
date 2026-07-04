import { useMemo, useState, type ComponentProps, type MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Box,
  CloudFog,
  Crown,
  Grid3X3,
  Image,
  Layers,
  Lightbulb,
  Paintbrush,
  Shield,
  Settings2,
  Sparkles,
  User,
  UsersRound
} from "lucide-react";
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
import { getSnappedTokenPosition } from "../../../canvas/tokens";
import { type DropPlacement } from "../../../lib/ui";
import { type ActiveWeatherCategory } from "../../../lib/effects";
import { FogShapeList, type FogShapeDropTarget } from "../lists/FogShapeList";
import { DrawingList, type DrawingDropTarget } from "./DrawingList";
import { EnvironmentEffectList } from "./EnvironmentEffectList";
import { FogSettingsPanel } from "./FogSettingsPanel";
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
  getLayerDisplayName,
  getLayerExpandedToggleState,
  getLayerPanelVisibleLayers,
  getLayerRowClassName,
  getLayerSettingsButtonClassName,
  getLayerSettingsLabel,
  getLayerSettingsTitle,
  getLayerSettingsToggleIds,
  getLayerVisibilityButtonClassName,
  getLayerVisibilityLabel,
  getLayerVisibilityTitle,
  getReorderedDrawings,
  getReorderedFogShapes,
  hasLayerSettings
} from "./layerPanelState";
import {
  getWeatherWithCategoryToggled,
  getWeatherWithDriftReset,
  getWeatherWithPatch,
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

  const updateDrawings = (drawings: DrawingElement[]) => {
    onChange({ ...scene, drawings, updatedAt: new Date().toISOString() });
  };

  const moveDrawing = (sourceDrawingId: string, targetDrawingId: string, placement: DropPlacement) => {
    if (sourceDrawingId === targetDrawingId) {
      return;
    }
    updateDrawings(getReorderedDrawings(scene.drawings, sourceDrawingId, targetDrawingId, placement));
  };

  const updateTokens = (tokens: Token[]) => {
    onChange({ ...scene, tokens, updatedAt: new Date().toISOString() });
  };

  const updateToken = (tokenId: string, patch: Partial<Token>) => {
    updateTokens(
      scene.tokens.map((token) => {
        if (token.id !== tokenId) {
          return token;
        }
        const nextToken = { ...token, ...patch };
        return patch.size ? { ...nextToken, position: getSnappedTokenPosition(nextToken.position, nextToken, scene) } : nextToken;
      })
    );
  };

  const onLayerRowClick = (event: MouseEvent<HTMLDivElement>, layerId: string, isExpandable: boolean) => {
    if (!isExpandable || (event.target as HTMLElement).closest("button,input,select,label,a")) {
      return;
    }
    toggleLayerExpanded(layerId);
  };

  const updateWeather = (patch: Partial<WeatherSettings>) => {
    onChange({
      ...scene,
      weather: getWeatherWithPatch(scene.weather, patch),
      updatedAt: new Date().toISOString()
    });
  };

  const updateEnvironment = (patch: Partial<Scene["environment"]>) => {
    onChange({
      ...scene,
      environment: {
        ...scene.environment,
        ...patch
      },
      updatedAt: new Date().toISOString()
    });
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
          const layerName = getLayerDisplayName(layer);
          return (
            <div
              className={getLayerRowClassName(hasLayerContents)}
              key={layer.id}
              onClick={(event) => onLayerRowClick(event, layer.id, hasLayerContents)}
            >
              <span className="layer-kind-icon" title={layerName} aria-hidden="true">
                {getLayerIcon(layer)}
              </span>
              <span className="layer-name" title={layerName}>
                {layerName}
                {layerCount !== null && <span className="layer-count-badge" aria-label={`${layerCount} ${layerCount === 1 ? "item" : "items"}`}>{layerCount}</span>}
              </span>
              <button
                className={getLayerVisibilityButtonClassName(layer.visibleInGm)}
                aria-label={getLayerVisibilityLabel(layerName, "GM", layer.visibleInGm)}
                aria-pressed={layer.visibleInGm}
                title={getLayerVisibilityTitle(layer.visibleInGm, "GM")}
                onClick={() => updateLayer(layer.id, { visibleInGm: !layer.visibleInGm })}
              >
                <Crown size={14} aria-hidden="true" />
              </button>
              <button
                className={getLayerVisibilityButtonClassName(layer.visibleInPlayer)}
                aria-label={getLayerVisibilityLabel(layerName, "Player", layer.visibleInPlayer)}
                aria-pressed={layer.visibleInPlayer}
                title={getLayerVisibilityTitle(layer.visibleInPlayer, "Player")}
                onClick={() => updateLayer(layer.id, { visibleInPlayer: !layer.visibleInPlayer })}
              >
                <User size={14} aria-hidden="true" />
              </button>
              <button
                className={getLayerSettingsButtonClassName(areSettingsExpanded)}
                aria-label={getLayerSettingsLabel(layerName, hasLayerSettingsAvailable, areSettingsExpanded)}
                title={getLayerSettingsTitle(hasLayerSettingsAvailable, areSettingsExpanded)}
                disabled={!hasLayerSettingsAvailable}
                onClick={() => toggleLayerSettings(layer.id)}
              >
                <Settings2 size={15} aria-hidden="true" />
              </button>
              {!scene.layerOrderLocked && (
                <div className="layer-order-controls">
                  <button
                    className="icon-button"
                    aria-label={`Move ${layerName} up`}
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => onMoveLayer(layer.id, "up")}
                  >
                    <ArrowUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Move ${layerName} down`}
                    title="Move down"
                    disabled={index === visibleLayers.length - 1}
                    onClick={() => onMoveLayer(layer.id, "down")}
                  >
                    <ArrowDown size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
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
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getLayerIcon(layer: Layer) {
  if ((layer.kind as string) === "weather") {
    return <Sparkles size={16} aria-hidden="true" />;
  }

  switch (layer.kind) {
    case "map":
      return <Image size={16} />;
    case "grid":
      return <Grid3X3 size={16} />;
    case "fog":
      return <CloudFog size={16} />;
    case "effects":
      return <Sparkles size={16} />;
    case "drawing":
      return <Paintbrush size={16} />;
    case "token":
      return <UsersRound size={16} />;
    case "foreground":
      return <Layers size={16} />;
    case "object":
      return <Box size={16} />;
    case "lighting":
      return <Lightbulb size={16} />;
    case "gm":
      return <Shield size={16} />;
    default:
      return <Sparkles size={16} />;
  }
}


