import { useMemo, useState, type MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Box,
  CloudFog,
  Crown,
  Grid3X3,
  Import,
  Image,
  Layers,
  Lightbulb,
  Paintbrush,
  RotateCcw,
  Shield,
  Settings2,
  Sparkles,
  Trash2,
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
import { getAssetThumbnailPreviewMessage } from "../../../lib/assets";
import { reorderByDropTarget, type DropPlacement } from "../../../lib/ui";
import {
  WEATHER_CATEGORY_OPTIONS,
  getWeatherCategoryLabel,
  getWeatherEffectOptions,
  type ActiveWeatherCategory
} from "../../../lib/effects";
import { ColorInput } from "../../controls/ColorPickerField";
import { FogShapeList, type FogShapeDropTarget } from "../lists/FogShapeList";
import { TokenList } from "../lists/TokenList";
import { DrawingList, type DrawingDropTarget } from "./DrawingList";
import { EnvironmentEffectList } from "./EnvironmentEffectList";
import { FogSettingsPanel } from "./FogSettingsPanel";
import { MapLayerSettingsPanel } from "./MapLayerSettingsPanel";
import { WeatherCategoryRow, WeatherDirectionDial, WeatherRangeRow } from "./WeatherControls";
import { WeatherMaskList } from "./WeatherMaskList";
import {
  getGridTypeLabel,
  getLayerItemCount,
  getReservedLayerGuidance,
  isEffectsLayerId,
  formatLayerPanelMultiplier,
  formatLayerPanelNumber,
  formatLayerPanelPercent
} from "./layerPanelFormat";
import {
  getDefaultWeatherSlot,
  getLegacyWeatherEffect,
  getWeatherAdvancedLabels,
  getWeatherColorLabel,
  getWeatherEffectSettingsWithCategoryReset,
  getWeatherEffectSettingsWithCurrent,
  getWeatherIntensityMax,
  getWeatherOpacityMax,
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

  const expandedWeatherSlot = expandedWeatherCategory ? scene.weather.effects[expandedWeatherCategory] : null;
  const expandedWeatherSettings = expandedWeatherSlot?.enabled ? expandedWeatherSlot.settings : null;
  const expandedWeatherOptions = expandedWeatherCategory ? getWeatherEffectOptions(expandedWeatherCategory) : [];
  const expandedWeatherAdvancedLabels = expandedWeatherCategory ? getWeatherAdvancedLabels(expandedWeatherCategory) : getWeatherAdvancedLabels("rain");
  const expandedWeatherIntensityMax = expandedWeatherCategory ? getWeatherIntensityMax(expandedWeatherCategory) : 1;
  const expandedWeatherOpacityMax = expandedWeatherCategory ? getWeatherOpacityMax(expandedWeatherCategory) : 1;
  const expandedWeatherColorLabel = expandedWeatherCategory ? getWeatherColorLabel(expandedWeatherCategory) : "Tint";
  const renderGridSubLayerRow = () => (
    <div className="map-sub-layer-row">
      <span className="map-sub-layer-icon" aria-hidden="true">
        <Grid3X3 size={14} />
      </span>
      <div className="map-sub-layer-summary">
        <strong>Grid</strong>
        <small>
          {scene.grid.type === "gridless"
            ? "Gridless"
            : `${getGridTypeLabel(scene.grid.type)} - ${scene.grid.mapGridColumns} x ${scene.grid.mapGridRows} at ${formatLayerPanelNumber(scene.grid.sizePx)}px`}
        </small>
      </div>
      <div className="grid-visibility-controls" aria-label="Grid visibility">
        <button
          type="button"
          className={scene.grid.showOnGm ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
          aria-label={scene.grid.showOnGm ? "Hide grid on GM View" : "Show grid on GM View"}
          aria-pressed={scene.grid.showOnGm}
          title={scene.grid.showOnGm ? "Hide grid on GM View" : "Show grid on GM View"}
          onClick={() => onUpdateGrid({ showOnGm: !scene.grid.showOnGm })}
        >
          <Crown size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={scene.grid.showOnPlayer ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
          aria-label={scene.grid.showOnPlayer ? "Hide grid on Player View" : "Show grid on Player View"}
          aria-pressed={scene.grid.showOnPlayer}
          title={scene.grid.showOnPlayer ? "Hide grid on Player View" : "Show grid on Player View"}
          onClick={() => onUpdateGrid({ showOnPlayer: !scene.grid.showOnPlayer })}
        >
          <User size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

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
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <div className="weather-category-list">
                    {WEATHER_CATEGORY_OPTIONS.map((option) => (
                      <WeatherCategoryRow
                        key={option.category}
                        label={option.label}
                        enabled={scene.weather.effects[option.category].enabled}
                        expanded={expandedWeatherCategory === option.category}
                        onEnabledChange={(enabled) => toggleWeatherCategory(option.category, enabled)}
                        onExpand={() => setExpandedWeatherCategory((category) => (category === option.category ? null : option.category))}
                      />
                    ))}
                  </div>
                  {expandedWeatherCategory && expandedWeatherSlot && (
                  <div className="weather-category-settings">
                    <div className="weather-settings-heading">
                      <span>{getWeatherCategoryLabel(expandedWeatherCategory)} Settings</span>
                    </div>
                    <div className="weather-preset-group" role="group" aria-label={`${expandedWeatherCategory} type`}>
                      {expandedWeatherOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = expandedWeatherSlot.enabled && expandedWeatherSlot.pattern === option.effect;
                        return (
                          <button
                            key={option.effect}
                            type="button"
                            className={isActive ? "weather-preset-button weather-preset-active" : "weather-preset-button"}
                            aria-pressed={isActive}
                            title={option.label}
                            onClick={() => selectWeatherEffect(expandedWeatherCategory, option.effect)}
                          >
                            <Icon size={16} aria-hidden="true" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {expandedWeatherSettings ? (
                      <>
                    <div className="settings-grid">
                      <div className="setting-row">
                        <span>Intensity</span>
                        <div className="weather-setting-control">
                          <input type="range" min={0.1} max={expandedWeatherIntensityMax} step={0.05} value={expandedWeatherSettings.intensity} onChange={(event) => updateWeatherTuning(expandedWeatherCategory, { intensity: Number(event.target.value) })} />
                          <button className="icon-button weather-reset-button" type="button" title="Reset intensity" aria-label="Reset weather intensity" onClick={() => resetWeatherTuning(expandedWeatherCategory, "intensity")}>
                            <RotateCcw size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="setting-row">
                        <span>Opacity</span>
                        <div className="weather-setting-control">
                          <input type="range" min={0.05} max={expandedWeatherOpacityMax} step={0.05} value={expandedWeatherSettings.opacity} onChange={(event) => updateWeatherTuning(expandedWeatherCategory, { opacity: Number(event.target.value) })} />
                          <button className="icon-button weather-reset-button" type="button" title="Reset opacity" aria-label="Reset weather opacity" onClick={() => resetWeatherTuning(expandedWeatherCategory, "opacity")}>
                            <RotateCcw size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {(expandedWeatherCategory === "fog" || expandedWeatherCategory === "sand") && (
                        <div className="setting-row">
                          <span>{expandedWeatherColorLabel}</span>
                          <div className="weather-setting-control">
                            <ColorInput value={expandedWeatherSettings.color} onChange={(color) => updateWeatherTuning(expandedWeatherCategory, { color })} />
                            <button className="icon-button weather-reset-button" type="button" title={`Reset ${expandedWeatherColorLabel.toLowerCase()}`} aria-label={`Reset weather ${expandedWeatherColorLabel.toLowerCase()}`} onClick={() => resetWeatherTuning(expandedWeatherCategory, "color")}>
                              <RotateCcw size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="setting-row">
                        <span>Speed</span>
                        <div className="weather-setting-control">
                          <input type="range" min={0.1} max={2} step={0.05} value={expandedWeatherSettings.speed} onChange={(event) => updateWeatherTuning(expandedWeatherCategory, { speed: Number(event.target.value) })} />
                          <button className="icon-button weather-reset-button" type="button" title="Reset speed" aria-label="Reset weather speed" onClick={() => resetWeatherTuning(expandedWeatherCategory, "speed")}>
                            <RotateCcw size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <details className="weather-advanced-panel">
                      <summary>Advanced</summary>
                      <div className="settings-grid">
                        <div className="setting-row weather-drift-row">
                          <span>{expandedWeatherCategory === "sand" ? "Wind" : "Drift"}</span>
                          <WeatherDirectionDial weather={expandedWeatherSettings} onChange={(patch) => updateWeatherTuning(expandedWeatherCategory, patch)} onReset={() => resetWeatherDrift(expandedWeatherCategory)} />
                        </div>
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.edgeBias} value={expandedWeatherSettings.edgeBias} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { edgeBias: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "edgeBias")} />
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.quietAreaSize} value={expandedWeatherSettings.quietAreaSize} min={0.35} max={0.9} step={0.05} format={formatLayerPanelPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { quietAreaSize: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "quietAreaSize")} />
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.centerStrayDrops} value={expandedWeatherSettings.centerStrayDrops} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { centerStrayDrops: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "centerStrayDrops")} />
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.streakLength} value={expandedWeatherSettings.streakLength} min={0.4} max={2} step={0.05} format={formatLayerPanelMultiplier} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { streakLength: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "streakLength")} />
                        {expandedWeatherSlot.pattern === "rain-storm" && (
                          <>
                            <WeatherRangeRow label="Lightning" value={expandedWeatherSettings.lightningFrequency} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { lightningFrequency: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "lightningFrequency")} />
                            <WeatherRangeRow label="Flash" value={expandedWeatherSettings.flashStrength} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { flashStrength: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "flashStrength")} />
                          </>
                        )}
                        <div className="setting-row">
                          <span>Quality</span>
                          <div className="weather-setting-control">
                            <select value={expandedWeatherSettings.quality} onChange={(event) => updateWeatherTuning(expandedWeatherCategory, { quality: event.target.value as WeatherTuningSettings["quality"] })}>
                              <option value="low">Low</option>
                              <option value="balanced">Balanced</option>
                              <option value="high">High</option>
                            </select>
                            <button className="icon-button weather-reset-button" type="button" title="Reset quality" aria-label="Reset weather quality" onClick={() => resetWeatherTuning(expandedWeatherCategory, "quality")}>
                              <RotateCcw size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                      </>
                    ) : (
                      <div className="inline-help">Choose a weather pattern to enable this category and show its controls.</div>
                    )}
                  </div>
                  )}
                  <div className="control-divider" />
                  <div className="inline-help">Scene weather renders on both GM View and Player View when this layer is visible. Keep weather drift centered for no directional movement.</div>
                </div>
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
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <button className={scene.tokens.length === 0 ? "import-map-next-step" : "token-import-button"} onClick={onImportToken}>
                    <Import size={16} aria-hidden="true" />
                    Import Token
                  </button>
                </div>
              )}
              {layer.id === "token" && isExpanded && (
                <TokenList
                  scene={scene}
                  tokenAssets={tokenAssets}
                  selectedTokenId={selectedTokenId}
                  selectedTokenIds={selectedTokenIds}
                  onSelectToken={onSelectToken}
                  onRenameToken={onRenameToken}
                  onUpdateToken={updateToken}
                  onUpdateTokens={updateTokens}
                  onOpenTokenColor={onOpenTokenColor}
                />
              )}
              {layer.id === "map" && !mapAsset && isExpanded && !areSettingsExpanded && (
                <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
                  {renderGridSubLayerRow()}
                  <div className="layer-empty-state">
                    <strong>Map Asset</strong>
                    <span>Import a map asset here, or open settings to configure the grid before adding a map.</span>
                  </div>
                  <button className="import-map-next-step" onClick={onImportMap}>
                    <Import size={16} aria-hidden="true" />
                    Import Map
                  </button>
                </div>
              )}
              {layer.id === "map" && mapAsset && isExpanded && !areSettingsExpanded && (
                <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
                  {renderGridSubLayerRow()}
                  <div className="map-asset-header">
                    <span>Map</span>
                    <small>1</small>
                  </div>
                  <div className="map-asset-row">
                    <span className="map-asset-thumbnail" title={getAssetThumbnailPreviewMessage(mapAsset) ?? mapAsset.name} aria-hidden="true">
                      {mapAsset.thumbnailAbsolutePath ? (
                        <img src={window.localVtt.toAssetUrl(mapAsset.thumbnailAbsolutePath)} alt="" draggable={false} />
                      ) : (
                        <Image size={14} />
                      )}
                    </span>
                    <div className="map-asset-summary">
                      <span title={mapAsset.name}>{mapAsset.name}</span>
                      <small>{mapAsset.mediaType}</small>
                    </div>
                    <div className="map-asset-actions" aria-label="Map asset actions">
                      <button className="icon-button" aria-label="Replace map asset" title="Replace map asset" onClick={() => onReplaceMap(mapAsset)}>
                        <RotateCcw size={15} aria-hidden="true" />
                      </button>
                      <button className="icon-button danger" aria-label="Delete map asset" title="Delete map asset" onClick={() => onDeleteMap(mapAsset)}>
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
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


