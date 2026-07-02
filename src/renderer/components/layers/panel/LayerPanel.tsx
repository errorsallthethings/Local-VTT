import { useMemo, useState, type MouseEvent } from "react";
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
  WeatherPatternEffectType,
  WeatherSettings,
  WeatherTuningSettings
} from "../../../../shared/localvtt";
import { DEFAULT_WEATHER_EFFECT_SETTINGS, formatDefaultFogShapeName, type Token } from "../../../../shared/localvtt";
import { getSnappedTokenPosition } from "../../../canvas/tokens";
import { reorderByDropTarget, type DropPlacement } from "../../../lib/ui";
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
  getDefaultWeatherSlot,
  getLegacyWeatherEffect,
  getWeatherEffectSettingsWithCategoryReset,
  getWeatherEffectSettingsWithCurrent,
  hasEnabledWeatherEffect,
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
  const sortedLayers = useMemo(() => [...scene.layers].sort((a, b) => b.order - a.order), [scene.layers]);
  const visibleLayers = useMemo(() => sortedLayers.filter((layer) => layer.id !== "grid"), [sortedLayers]);
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
    onChange({
      ...scene,
      grid: nextGrid,
      layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
      tokens: nextTokens,
      updatedAt: new Date().toISOString()
    });
  };

  const toggleLayerExpanded = (layerId: string) => {
    if (settingsLayerIds.has(layerId)) {
      setSettingsLayerIds((ids) => {
        const nextIds = new Set(ids);
        nextIds.delete(layerId);
        return nextIds;
      });
      setExpandedLayerIds((ids) => new Set([...ids, layerId]));
      return;
    }
    if (expandedLayerIds.has(layerId)) {
      setExpandedLayerIds((ids) => {
        const nextIds = new Set(ids);
        nextIds.delete(layerId);
        return nextIds;
      });
      return;
    }
    setExpandedLayerIds((ids) => new Set([...ids, layerId]));
  };

  const toggleLayerSettings = (layerId: string) => {
    setSettingsLayerIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(layerId)) {
        nextIds.delete(layerId);
      } else {
        nextIds.clear();
        nextIds.add(layerId);
      }
      return nextIds;
    });
  };

  const moveFogShape = (sourceShapeId: string, targetShapeId: string, placement: DropPlacement) => {
    if (sourceShapeId === targetShapeId) {
      return;
    }
    const namedShapes = scene.fog.shapes.map((shape, index) => ({
      ...shape,
      name: shape.name?.trim() || formatDefaultFogShapeName(shape.operation, shape.kind, index)
    }));
    const shapes = reorderByDropTarget(namedShapes, (shape) => shape.id, sourceShapeId, targetShapeId, placement);
    onUpdateFog({ shapes });
  };

  const updateDrawings = (drawings: DrawingElement[]) => {
    onChange({ ...scene, drawings, updatedAt: new Date().toISOString() });
  };

  const moveDrawing = (sourceDrawingId: string, targetDrawingId: string, placement: DropPlacement) => {
    if (sourceDrawingId === targetDrawingId) {
      return;
    }
    const drawings = reorderByDropTarget(scene.drawings, (drawing) => drawing.id, sourceDrawingId, targetDrawingId, placement);
    updateDrawings(drawings);
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
    const nextWeather = {
      ...scene.weather,
      ...patch
    };
    const hasEnabledEffect = hasEnabledWeatherEffect(nextWeather.effects);
    onChange({
      ...scene,
      weather: {
        ...nextWeather,
        enabled: hasEnabledEffect,
        effect: getLegacyWeatherEffect(nextWeather)
      },
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
    const slot = enabled ? scene.weather.effects[category] : getDefaultWeatherSlot(category);
    const effects = {
      ...scene.weather.effects,
      [category]: {
        ...slot,
        enabled
      }
    };
    updateWeather({
      effects,
      enabled: hasEnabledWeatherEffect(effects),
      effectSettings: enabled
        ? getWeatherEffectSettingsWithCurrent({ ...scene.weather, effects })
        : getWeatherEffectSettingsWithCategoryReset(scene.weather, effects, category)
    });
    if (!enabled && expandedWeatherCategory === category) {
      setExpandedWeatherCategory(null);
    }
  };

  const selectWeatherEffect = (category: ActiveWeatherCategory, effect: WeatherPatternEffectType) => {
    const currentSlot = scene.weather.effects[category];
    if (currentSlot.enabled && currentSlot.pattern === effect) {
      toggleWeatherCategory(category, false);
      return;
    }
    const effectSettings = getWeatherEffectSettingsWithCurrent(scene.weather);
    const nextTuning = effectSettings[effect] ?? DEFAULT_WEATHER_EFFECT_SETTINGS[effect];
    effectSettings[effect] = nextTuning;
    updateWeather({
      enabled: true,
      effects: {
        ...scene.weather.effects,
        [category]: {
          enabled: true,
          pattern: effect,
          settings: nextTuning
        }
      },
      effectSettings
    });
  };

  const updateWeatherTuning = (category: ActiveWeatherCategory, patch: Partial<WeatherTuningSettings>) => {
    const slot = scene.weather.effects[category];
    const nextTuning = {
      ...slot.settings,
      ...patch
    };
    updateWeather({
      effects: {
        ...scene.weather.effects,
        [category]: {
          ...slot,
          settings: nextTuning
        }
      },
      effectSettings: {
        ...scene.weather.effectSettings,
        [slot.pattern]: nextTuning
      }
    });
  };

  const resetWeatherTuning = (category: ActiveWeatherCategory, key: WeatherTuningKey) => {
    const pattern = scene.weather.effects[category].pattern;
    updateWeatherTuning(category, { [key]: DEFAULT_WEATHER_EFFECT_SETTINGS[pattern][key] });
  };

  const resetWeatherDrift = (category: ActiveWeatherCategory) => {
    const pattern = scene.weather.effects[category].pattern;
    const defaults = DEFAULT_WEATHER_EFFECT_SETTINGS[pattern];
    updateWeatherTuning(category, {
      directionDegrees: defaults.directionDegrees,
      driftStrength: defaults.driftStrength
    });
  };

  return (
    <section className="panel">
      <div className="layer-list">
        {visibleLayers.map((layer, index) => {
          const hasLayerSettings =
            layer.id === "map" ||
            layer.id === "fog" ||
            isEffectsLayerId(layer.id);
          const hasLayerContents = true;
          const isExpanded = hasLayerContents && expandedLayerIds.has(layer.id);
          const areSettingsExpanded = settingsLayerIds.has(layer.id);
          const reservedLayerGuidance = getReservedLayerGuidance(layer);
          const layerCount = getLayerItemCount(layer.id, scene);
          const layerName = layer.id === "map" ? "Grid & Maps" : layer.name;
          return (
            <div
              className={["layer-row", hasLayerContents ? "expandable-layer-row" : ""].filter(Boolean).join(" ")}
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
                className={layer.visibleInGm ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
                aria-label={layer.visibleInGm ? `Hide ${layerName} in GM View` : `Show ${layerName} in GM View`}
                aria-pressed={layer.visibleInGm}
                title={layer.visibleInGm ? "Hide in GM View" : "Show in GM View"}
                onClick={() => updateLayer(layer.id, { visibleInGm: !layer.visibleInGm })}
              >
                <Crown size={14} aria-hidden="true" />
              </button>
              <button
                className={layer.visibleInPlayer ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
                aria-label={layer.visibleInPlayer ? `Hide ${layerName} in Player View` : `Show ${layerName} in Player View`}
                aria-pressed={layer.visibleInPlayer}
                title={layer.visibleInPlayer ? "Hide in Player View" : "Show in Player View"}
                onClick={() => updateLayer(layer.id, { visibleInPlayer: !layer.visibleInPlayer })}
              >
                <User size={14} aria-hidden="true" />
              </button>
              <button
                className={areSettingsExpanded ? "icon-button layer-settings-button layer-settings-active" : "icon-button layer-settings-button"}
                aria-label={hasLayerSettings ? (areSettingsExpanded ? `Hide ${layerName} settings` : `Show ${layerName} settings`) : `${layerName} settings unavailable`}
                title={hasLayerSettings ? (areSettingsExpanded ? "Hide layer settings" : "Show layer settings") : "No layer settings yet"}
                disabled={!hasLayerSettings}
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


