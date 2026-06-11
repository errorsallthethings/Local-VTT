import { useEffect, useState, type MouseEvent, type PointerEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Box,
  Circle,
  CloudFog,
  CloudSun,
  Crown,
  Eye,
  EyeOff,
  Grid3X3,
  Import,
  Image,
  Layers,
  Lightbulb,
  Pentagon,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Square,
  SquareDashed,
  Trash2,
  User,
  UsersRound
} from "lucide-react";
import type {
  Asset,
  FogSettings,
  GridSettings,
  GridType,
  Layer,
  MapTransform,
  Scene,
  WeatherPatternEffectType,
  WeatherSettings,
  WeatherTuningSettings
} from "../../../shared/localvtt";
import { DEFAULT_WEATHER_EFFECT_SETTINGS, formatDefaultFogShapeName, type Token } from "../../../shared/localvtt";
import { getSnappedTokenPosition } from "../../canvas/tokenGeometry";
import { reorderByDropTarget, type DropPlacement } from "../../lib/reorder";
import {
  WEATHER_CATEGORY_OPTIONS,
  getWeatherCategoryLabel,
  getWeatherEffectOptions,
  type ActiveWeatherCategory
} from "../../lib/weatherCatalog";
import { ColorSettingRow } from "../controls/ColorPickerField";
import { DebouncedNumberInput } from "../controls/DebouncedNumberInput";
import { MeasurementPanel } from "../settings/MeasurementPanel";
import { FogShapeList, type FogShapeDropTarget } from "./FogShapeList";
import { TokenList } from "./TokenList";

type WeatherTuningKey = keyof WeatherTuningSettings;

export function LayerPanel({
  scene,
  mapAsset,
  tokenAssets,
  selectedFogShapeId,
  selectedWeatherMaskId,
  selectedTokenId,
  onChange,
  onUpdateGrid,
  onUpdateFog,
  onUpdateMapTransform,
  onFitGridToMapDimensions,
  onMoveLayer,
  onImportMap,
  onImportToken,
  onDeleteMap,
  onSelectFogShape,
  onSelectWeatherMask,
  onSelectToken,
  onRenameFogShape,
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
  selectedTokenId: string | null;
  onChange: (scene: Scene) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onFitGridToMapDimensions: () => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
  onImportMap: () => void;
  onImportToken: () => void;
  onDeleteMap: (asset: Asset) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onSelectWeatherMask: (maskId: string | null) => void;
  onSelectToken: (tokenId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onOpenFogColor: () => void;
  onOpenGridColor: () => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const sortedLayers = [...scene.layers].sort((a, b) => b.order - a.order);
  const visualGridEnabled = scene.grid.type !== "gridless";
  const canFitGridToMap = mapAsset?.mediaType === "image";
  const fitModeHelp = getFitModeHelp(scene.mapTransform.fitMode);
  const [expandedLayerIds, setExpandedLayerIds] = useState<Set<string>>(() => new Set());
  const [settingsLayerIds, setSettingsLayerIds] = useState<Set<string>>(() => new Set());
  const [draggedFogShapeId, setDraggedFogShapeId] = useState<string | null>(null);
  const [fogShapeDropTarget, setFogShapeDropTarget] = useState<FogShapeDropTarget>(null);
  const [expandedWeatherCategory, setExpandedWeatherCategory] = useState<ActiveWeatherCategory | null>(null);

  useEffect(() => {
    if (scene.mapAssetId) {
      return;
    }
    setExpandedLayerIds((ids) => {
      if (ids.has("map")) {
        return ids;
      }
      return new Set([...ids, "map"]);
    });
  }, [scene.id, scene.mapAssetId]);

  useEffect(() => {
    if (scene.fog.shapes.length === 0) {
      return;
    }
    setExpandedLayerIds((ids) => {
      if (ids.has("fog")) {
        return ids;
      }
      return new Set([...ids, "fog"]);
    });
  }, [scene.fog.shapes.length]);

  useEffect(() => {
    if (scene.tokens.length === 0) {
      return;
    }
    setExpandedLayerIds((ids) => {
      if (ids.has("token")) {
        return ids;
      }
      return new Set([...ids, "token"]);
    });
  }, [scene.tokens.length]);

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

  const updateFogStartMode = (mode: FogSettings["mode"]) => {
    const opacity = mode === "revealed" ? 0 : mode === "partial" ? 0.5 : 1;
    onUpdateFog({
      mode,
      gmOpacity: mode === "revealed" ? 0 : 0.5,
      playerOpacity: opacity,
      opacity
    });
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
  const expandedWeatherAdvancedLabels = expandedWeatherCategory ? getWeatherAdvancedLabels(expandedWeatherCategory) : WEATHER_ADVANCED_LABELS.rain;
  const expandedWeatherIntensityMax = expandedWeatherCategory ? getWeatherIntensityMax(expandedWeatherCategory) : 1;
  const expandedWeatherOpacityMax = expandedWeatherCategory ? getWeatherOpacityMax(expandedWeatherCategory) : 1;
  const expandedWeatherColorLabel = expandedWeatherCategory ? getWeatherColorLabel(expandedWeatherCategory) : "Tint";

  return (
    <section className="panel">
      <div className="layer-list">
        {sortedLayers.map((layer, index) => {
          const hasLayerSettings =
            (layer.id === "map" && Boolean(mapAsset)) ||
            layer.id === "grid" ||
            layer.id === "fog" ||
            layer.id === "weather";
          const hasLayerContents = true;
          const isExpanded = hasLayerContents && expandedLayerIds.has(layer.id);
          const areSettingsExpanded = settingsLayerIds.has(layer.id);
          const reservedLayerGuidance = getReservedLayerGuidance(layer);
          const layerCount = getLayerItemCount(layer.id, scene);
          return (
            <div
              className={["layer-row", hasLayerContents ? "expandable-layer-row" : ""].filter(Boolean).join(" ")}
              key={layer.id}
              onClick={(event) => onLayerRowClick(event, layer.id, hasLayerContents)}
            >
              <span className="layer-kind-icon" title={layer.name} aria-hidden="true">
                {getLayerIcon(layer)}
              </span>
              <span className="layer-name" title={layer.name}>
                {layer.name}
                {layerCount !== null && <span className="layer-count-badge" aria-label={`${layerCount} ${layerCount === 1 ? "item" : "items"}`}>{layerCount}</span>}
              </span>
              <button
                className={layer.visibleInGm ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
                aria-label={layer.visibleInGm ? `Hide ${layer.name} in GM View` : `Show ${layer.name} in GM View`}
                aria-pressed={layer.visibleInGm}
                title={layer.visibleInGm ? "Hide in GM View" : "Show in GM View"}
                onClick={() => updateLayer(layer.id, { visibleInGm: !layer.visibleInGm })}
              >
                <Crown size={14} aria-hidden="true" />
              </button>
              <button
                className={layer.visibleInPlayer ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
                aria-label={layer.visibleInPlayer ? `Hide ${layer.name} in Player View` : `Show ${layer.name} in Player View`}
                aria-pressed={layer.visibleInPlayer}
                title={layer.visibleInPlayer ? "Hide in Player View" : "Show in Player View"}
                onClick={() => updateLayer(layer.id, { visibleInPlayer: !layer.visibleInPlayer })}
              >
                <User size={14} aria-hidden="true" />
              </button>
              <button
                className={areSettingsExpanded ? "icon-button layer-settings-button layer-settings-active" : "icon-button layer-settings-button"}
                aria-label={hasLayerSettings ? (areSettingsExpanded ? `Hide ${layer.name} settings` : `Show ${layer.name} settings`) : `${layer.name} settings unavailable`}
                title={hasLayerSettings ? (areSettingsExpanded ? "Hide layer settings" : "Show layer settings") : "No layer settings yet"}
                disabled={!hasLayerSettings}
                onClick={() => toggleLayerSettings(layer.id)}
              >
                <Settings size={15} aria-hidden="true" />
              </button>
              {!scene.layerOrderLocked && (
                <div className="layer-order-controls">
                  <button
                    className="icon-button"
                    aria-label={`Move ${layer.name} up`}
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => onMoveLayer(layer.id, "up")}
                  >
                    <ArrowUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Move ${layer.name} down`}
                    title="Move down"
                    disabled={index === sortedLayers.length - 1}
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
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <label className="stacked-control">
                    Mode
                    <select value={scene.fog.mode} onChange={(event) => updateFogStartMode(event.target.value as FogSettings["mode"])}>
                      <option value="revealed">Fully revealed</option>
                      <option value="hidden">Fully hidden</option>
                      <option value="partial">Partially revealed</option>
                    </select>
                  </label>
                  <div className="settings-grid">
                    <label className="setting-row">
                      <span>GM opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={scene.fog.gmOpacity}
                        onChange={(event) => onUpdateFog({ gmOpacity: Number(event.target.value) })}
                      />
                    </label>
                    <label className="setting-row">
                      <span>Player opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={scene.fog.playerOpacity}
                        onChange={(event) => onUpdateFog({ playerOpacity: Number(event.target.value), opacity: Number(event.target.value) })}
                      />
                    </label>
                    <ColorSettingRow label="Color" value={scene.fog.color} onOpen={onOpenFogColor} />
                  </div>
                  <div className="setting-row fog-new-shape-row">
                    <span>New Shapes</span>
                    <div className="fog-new-shape-control">
                      <label className="fog-operation-switch fog-new-shape-switch" title="Player View default for newly drawn fog shapes">
                        <span>Reveal</span>
                        <input
                          aria-label="Player View default for new fog shapes"
                          type="checkbox"
                          checked={!scene.fog.newShapesVisibleInPlayer}
                          onChange={(event) => onUpdateFog({ newShapesVisibleInPlayer: !event.target.checked })}
                        />
                        <span>Hidden</span>
                      </label>
                      <small>Sets the Player View default for newly drawn fog shapes.</small>
                    </div>
                  </div>
                  <div className="inline-help">Fog drawing tools are available from the floating Tools Menu in the GM canvas.</div>
                </div>
              )}
              {layer.id === "fog" && isExpanded && (
                <FogShapeList
                  scene={scene}
                  selectedFogShapeId={selectedFogShapeId}
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
              {layer.id === "weather" && areSettingsExpanded && (
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
                            <input type="color" value={expandedWeatherSettings.color} onChange={(event) => updateWeatherTuning(expandedWeatherCategory, { color: event.target.value })} />
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
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.edgeBias} value={expandedWeatherSettings.edgeBias} min={0} max={1} step={0.05} format={formatPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { edgeBias: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "edgeBias")} />
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.quietAreaSize} value={expandedWeatherSettings.quietAreaSize} min={0.35} max={0.9} step={0.05} format={formatPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { quietAreaSize: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "quietAreaSize")} />
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.centerStrayDrops} value={expandedWeatherSettings.centerStrayDrops} min={0} max={1} step={0.05} format={formatPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { centerStrayDrops: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "centerStrayDrops")} />
                        <WeatherRangeRow label={expandedWeatherAdvancedLabels.streakLength} value={expandedWeatherSettings.streakLength} min={0.4} max={2} step={0.05} format={formatMultiplier} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { streakLength: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "streakLength")} />
                        {expandedWeatherSlot.pattern === "rain-storm" && (
                          <>
                            <WeatherRangeRow label="Lightning" value={expandedWeatherSettings.lightningFrequency} min={0} max={1} step={0.05} format={formatPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { lightningFrequency: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "lightningFrequency")} />
                            <WeatherRangeRow label="Flash" value={expandedWeatherSettings.flashStrength} min={0} max={1} step={0.05} format={formatPercent} onChange={(value) => updateWeatherTuning(expandedWeatherCategory, { flashStrength: value })} onReset={() => resetWeatherTuning(expandedWeatherCategory, "flashStrength")} />
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
                  <div className="inline-help">Weather renders on both GM View and Player View when the layer is visible. Keep drift centered for no directional movement.</div>
                </div>
              )}
              {layer.id === "weather" && isExpanded && !areSettingsExpanded && (
                <WeatherMaskList
                  scene={scene}
                  selectedWeatherMaskId={selectedWeatherMaskId}
                  onSelectWeatherMask={onSelectWeatherMask}
                  onUpdateWeather={updateWeather}
                />
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
                  onSelectToken={onSelectToken}
                  onRenameToken={onRenameToken}
                  onUpdateToken={updateToken}
                  onUpdateTokens={updateTokens}
                  onOpenTokenColor={onOpenTokenColor}
                />
              )}
              {layer.id === "grid" && isExpanded && !areSettingsExpanded && (
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <div className="layer-empty-state">
                    <strong>Grid Settings</strong>
                    <span>Use the gear button to configure grid mode, cell size, visibility, colors, and measurement.</span>
                  </div>
                </div>
              )}
              {layer.id === "grid" && areSettingsExpanded && (
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <label className="stacked-control">
                    Mode
                    <select value={scene.grid.type} onChange={(event) => onUpdateGrid({ type: event.target.value as GridType })}>
                      <option value="gridless">Gridless</option>
                      <option value="square">Square</option>
                      <option value="hex">Hex</option>
                    </select>
                  </label>
                  {visualGridEnabled && (
                    <>
                      <div className="control-divider" />
                      <div className="settings-grid">
                        <label className="setting-row">
                          <span>Cell size</span>
                          <DebouncedNumberInput
                            value={scene.grid.sizePx}
                            min={8}
                            max={1000}
                            delayMs={450}
                            onCommit={(value) => onUpdateGrid({ sizePx: value })}
                          />
                        </label>
                        <label className="setting-row">
                          <span>Opacity</span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={scene.grid.opacity}
                            onChange={(event) => onUpdateGrid({ opacity: Number(event.target.value) })}
                          />
                        </label>
                        <div className="setting-row">
                          <span>Offset</span>
                          <div className="xy-inputs">
                            <label>
                              X
                              <input type="number" value={scene.grid.offsetX} onChange={(event) => onUpdateGrid({ offsetX: Number(event.target.value) })} />
                            </label>
                            <label>
                              Y
                              <input type="number" value={scene.grid.offsetY} onChange={(event) => onUpdateGrid({ offsetY: Number(event.target.value) })} />
                            </label>
                          </div>
                        </div>
                        <label className="setting-row">
                          <span>Thickness</span>
                          <input
                            type="number"
                            min={0.5}
                            max={10}
                            step={0.5}
                            value={scene.grid.lineThickness}
                            onChange={(event) => onUpdateGrid({ lineThickness: Number(event.target.value) })}
                          />
                        </label>
                        <ColorSettingRow label="Color" value={scene.grid.color} onOpen={onOpenGridColor} />
                      </div>
                      <div className="control-divider" />
                      <div className="settings-grid">
                        <div className="setting-row">
                          <span>Map grid</span>
                          <div className="xy-inputs">
                            <label>
                              W
                              <input
                                type="number"
                                min={1}
                                value={scene.grid.mapGridColumns}
                                onChange={(event) => onUpdateGrid({ mapGridColumns: Number(event.target.value) })}
                              />
                            </label>
                            <label>
                              H
                              <input
                                type="number"
                                min={1}
                                value={scene.grid.mapGridRows}
                                onChange={(event) => onUpdateGrid({ mapGridRows: Number(event.target.value) })}
                              />
                            </label>
                          </div>
                        </div>
                        <button disabled={!canFitGridToMap} onClick={onFitGridToMapDimensions}>
                          Fit grid to map dimensions
                        </button>
                        {!canFitGridToMap && <div className="inline-help">Grid fitting currently supports static image maps.</div>}
                      </div>
                      <div className="control-divider" />
                      <MeasurementPanel
                        embedded
                        measurement={scene.grid.measurement}
                        onChange={(measurementPatch) => onUpdateGrid({ measurement: { ...scene.grid.measurement, ...measurementPatch } })}
                      />
                    </>
                  )}
                </div>
              )}
              {layer.id === "map" && !mapAsset && (isExpanded || areSettingsExpanded) && (
                <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
                  <div className="layer-empty-state">
                    <strong>Map Settings</strong>
                    <span>Import a map asset here, then use the gear button for map fit and transform settings.</span>
                  </div>
                  <button className="import-map-next-step" onClick={onImportMap}>
                    <Import size={16} aria-hidden="true" />
                    Import Map
                  </button>
                </div>
              )}
              {layer.id === "map" && mapAsset && isExpanded && (
                <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
                  <div className="layer-empty-state">
                    <strong>Map Settings</strong>
                    <span>Use the gear button to adjust map fit, transform, and asset actions.</span>
                  </div>
                </div>
              )}
              {layer.id === "map" && areSettingsExpanded && (
                <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
                  {mapAsset ? (
                    <>
                      <div className="map-asset-summary">
                        <span title={mapAsset.name}>{mapAsset.name}</span>
                        <small>{mapAsset.mediaType}</small>
                      </div>
                      <button className="icon-button danger" aria-label="Delete map asset" title="Delete map asset" onClick={() => onDeleteMap(mapAsset)}>
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                      <label className="stacked-control">
                        Fit mode
                        <select value={scene.mapTransform.fitMode} onChange={(event) => onUpdateMapTransform({ fitMode: event.target.value as MapTransform["fitMode"] })}>
                          <option value="manual">Manual</option>
                          <option value="contain">Fit contain</option>
                          <option value="cover">Fit cover</option>
                          <option value="actual-size">Actual size</option>
                        </select>
                      </label>
                      <div className="inline-help">{fitModeHelp}</div>
                      <div className="control-divider" />
                      <div className="settings-grid">
                        <div className="setting-row">
                          <span>Position</span>
                          <div className="xy-inputs">
                            <label>
                              X
                              <input
                                type="number"
                                value={scene.mapTransform.x}
                                disabled={scene.mapTransform.fitMode !== "manual"}
                                onChange={(event) => onUpdateMapTransform({ x: Number(event.target.value), fitMode: "manual" })}
                              />
                            </label>
                            <label>
                              Y
                              <input
                                type="number"
                                value={scene.mapTransform.y}
                                disabled={scene.mapTransform.fitMode !== "manual"}
                                onChange={(event) => onUpdateMapTransform({ y: Number(event.target.value), fitMode: "manual" })}
                              />
                            </label>
                          </div>
                        </div>
                        <label className="setting-row">
                          <span>Scale</span>
                          <input
                            type="number"
                            min={0.01}
                            step={0.05}
                            value={scene.mapTransform.scale}
                            disabled={scene.mapTransform.fitMode !== "manual"}
                            onChange={(event) => onUpdateMapTransform({ scale: Number(event.target.value), fitMode: "manual" })}
                          />
                        </label>
                        <label className="setting-row">
                          <span>Rotation</span>
                          <input
                            type="number"
                            step={1}
                            value={scene.mapTransform.rotation}
                            onChange={(event) => onUpdateMapTransform({ rotation: Number(event.target.value) })}
                          />
                        </label>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WeatherCategoryRow({
  label,
  enabled,
  expanded,
  onEnabledChange,
  onExpand
}: {
  label: string;
  enabled: boolean;
  expanded: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onExpand: () => void;
}) {
  return (
    <div className={expanded ? "weather-category-row weather-category-row-active" : "weather-category-row"}>
      <span>{label}</span>
      <label className="fog-operation-switch weather-category-switch" title={`${enabled ? "Disable" : "Enable"} ${label}`}>
        <span>Off</span>
        <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        <span>On</span>
      </label>
      <button className={expanded ? "icon-button layer-settings-button layer-settings-active" : "icon-button layer-settings-button"} type="button" title={`${label} settings`} aria-label={`${label} settings`} onClick={onExpand}>
        <Settings size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function getLegacyWeatherEffect(weather: WeatherSettings): WeatherSettings["effect"] {
  if (weather.effects.rain.enabled) {
    return weather.effects.rain.pattern;
  }
  if (weather.effects.fog.enabled) {
    return weather.effects.fog.pattern;
  }
  if (weather.effects.snow.enabled) {
    return weather.effects.snow.pattern;
  }
  if (weather.effects.sand.enabled) {
    return weather.effects.sand.pattern;
  }
  return "none";
}

function getDefaultWeatherSlot(category: "rain"): WeatherSettings["effects"]["rain"];
function getDefaultWeatherSlot(category: "fog"): WeatherSettings["effects"]["fog"];
function getDefaultWeatherSlot(category: "snow"): WeatherSettings["effects"]["snow"];
function getDefaultWeatherSlot(category: "sand"): WeatherSettings["effects"]["sand"];
function getDefaultWeatherSlot(category: ActiveWeatherCategory): WeatherSettings["effects"][ActiveWeatherCategory];
function getDefaultWeatherSlot(category: ActiveWeatherCategory): WeatherSettings["effects"][ActiveWeatherCategory] {
  if (category === "rain") {
    return {
      enabled: false,
      pattern: "rain",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.rain }
    };
  }
  if (category === "snow") {
    return {
      enabled: false,
      pattern: "snow",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.snow }
    };
  }
  if (category === "sand") {
    return {
      enabled: false,
      pattern: "sand",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.sand }
    };
  }
  return {
    enabled: false,
    pattern: "fog",
    settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.fog }
  };
}

function WeatherRangeRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onReset
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <div className="weather-setting-control weather-setting-control-with-value">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <output>{format(value)}</output>
        <button className="icon-button weather-reset-button" type="button" title={`Reset ${label.toLowerCase()}`} aria-label={`Reset weather ${label.toLowerCase()}`} onClick={onReset}>
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

function WeatherMaskList({
  scene,
  selectedWeatherMaskId,
  onSelectWeatherMask,
  onUpdateWeather
}: {
  scene: Scene;
  selectedWeatherMaskId: string | null;
  onSelectWeatherMask: (maskId: string | null) => void;
  onUpdateWeather: (patch: Partial<WeatherSettings>) => void;
}) {
  return (
    <div className="layer-detail-controls weather-mask-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Weather Masks</span>
      </div>
      {scene.weather.masks.length > 0 ? (
        scene.weather.masks.map((mask) => {
          const label = mask.name?.trim() || "Weather Mask";
          const isVisible = mask.visible ?? true;
          const isSelected = selectedWeatherMaskId === mask.id;
          return (
            <div
              className={["fog-shape-row", "weather-mask-row", isVisible ? "" : "fog-shape-row-muted", isSelected ? "fog-shape-row-selected" : ""]
                .filter(Boolean)
                .join(" ")}
              key={mask.id}
            >
              <span className="fog-shape-kind-icon" title={`${mask.kind} mask`} aria-hidden="true">
                {mask.kind === "circle" ? <Circle size={13} /> : mask.kind === "polygon" ? <Pentagon size={13} /> : <Square size={13} />}
              </span>
              <span className="fog-shape-name" title={label}>
                {label}
              </span>
              <button
                className={isVisible ? "icon-button fog-shape-action-button fog-shape-action-active" : "icon-button fog-shape-action-button"}
                aria-label={isVisible ? `Disable ${label}` : `Enable ${label}`}
                title={isVisible ? "Disable mask" : "Enable mask"}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectWeatherMask(mask.id);
                  onUpdateWeather({
                    masks: scene.weather.masks.map((candidate) => (candidate.id === mask.id ? { ...candidate, visible: !isVisible } : candidate))
                  });
                }}
              >
                {isVisible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
              </button>
              <button
                className={isSelected ? "icon-button fog-shape-action-button fog-shape-action-active" : "icon-button fog-shape-action-button"}
                aria-label={isSelected ? `Hide ${label} highlight` : `Highlight ${label}`}
                title={isSelected ? "Hide mask highlight" : "Highlight mask"}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectWeatherMask(isSelected ? null : mask.id);
                }}
              >
                <SquareDashed size={14} aria-hidden="true" />
              </button>
              <button
                className="icon-button fog-shape-action-button danger"
                aria-label={`Delete ${label}`}
                title="Delete weather mask"
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateWeather({ masks: scene.weather.masks.filter((candidate) => candidate.id !== mask.id) });
                  if (selectedWeatherMaskId === mask.id) {
                    onSelectWeatherMask(null);
                  }
                }}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })
      ) : (
        <div className="layer-empty-state">
          <strong>No Weather Masks</strong>
          <span>
            {scene.weather.enabled && hasEnabledWeatherEffect(scene.weather.effects)
              ? "Draw masks from Weather Tools to keep weather out of interiors."
              : "Choose a weather pattern in settings to enable Weather Tools, then draw masks from the canvas."}
          </span>
        </div>
      )}
    </div>
  );
}

function getWeatherEffectSettingsWithCurrent(weather: WeatherSettings): WeatherSettings["effectSettings"] {
  return {
    ...weather.effectSettings,
    [weather.effects.rain.pattern]: weather.effects.rain.settings,
    [weather.effects.fog.pattern]: weather.effects.fog.settings,
    [weather.effects.snow.pattern]: weather.effects.snow.settings,
    [weather.effects.sand.pattern]: weather.effects.sand.settings
  };
}

function getWeatherEffectSettingsWithCategoryReset(
  weather: WeatherSettings,
  effects: WeatherSettings["effects"],
  category: ActiveWeatherCategory
): WeatherSettings["effectSettings"] {
  const effectSettings = getWeatherEffectSettingsWithCurrent({ ...weather, effects });
  const options = getWeatherEffectOptions(category);
  for (const option of options) {
    effectSettings[option.effect] = DEFAULT_WEATHER_EFFECT_SETTINGS[option.effect];
  }
  return effectSettings;
}

function hasEnabledWeatherEffect(effects: WeatherSettings["effects"]): boolean {
  return effects.rain.enabled || effects.fog.enabled || effects.snow.enabled || effects.sand.enabled;
}

const WEATHER_ADVANCED_LABELS: Record<
  ActiveWeatherCategory,
  Pick<Record<WeatherTuningKey, string>, "edgeBias" | "quietAreaSize" | "centerStrayDrops" | "streakLength">
> = {
  rain: {
    edgeBias: "Edge Bias",
    quietAreaSize: "Quiet Area",
    centerStrayDrops: "Stray Drops",
    streakLength: "Streak Length"
  },
  fog: {
    edgeBias: "Edge Spawn",
    quietAreaSize: "Interior Area",
    centerStrayDrops: "Interior Wisps",
    streakLength: "Bank Scale"
  },
  snow: {
    edgeBias: "Edge Frost",
    quietAreaSize: "Clear Center",
    centerStrayDrops: "Center Flurries",
    streakLength: "Flake Size"
  },
  sand: {
    edgeBias: "Edge Density",
    quietAreaSize: "Clear Center",
    centerStrayDrops: "Interior Dust",
    streakLength: "Grain Size"
  }
};

function getWeatherAdvancedLabels(category: ActiveWeatherCategory) {
  return WEATHER_ADVANCED_LABELS[category];
}

function getWeatherIntensityMax(category: ActiveWeatherCategory): number {
  if (category === "sand") {
    return 1.5;
  }
  if (category === "snow") {
    return 1.25;
  }
  return 1;
}

function getWeatherOpacityMax(category: ActiveWeatherCategory): number {
  if (category === "sand") {
    return 1.25;
  }
  return 1;
}

function getWeatherColorLabel(category: ActiveWeatherCategory): string {
  if (category === "sand") {
    return "Dust Color";
  }
  return "Tint";
}

function WeatherDirectionDial({
  weather,
  onChange,
  onReset
}: {
  weather: WeatherTuningSettings;
  onChange: (patch: Partial<WeatherTuningSettings>) => void;
  onReset: () => void;
}) {
  const directionDegrees = Number.isFinite(weather.directionDegrees) ? weather.directionDegrees : 0;
  const strength = Number.isFinite(weather.driftStrength) ? Math.max(0, Math.min(1, weather.driftStrength)) : 0;
  const radians = (directionDegrees * Math.PI) / 180;
  const knobX = 50 + Math.cos(radians) * strength * 34;
  const knobY = 50 + Math.sin(radians) * strength * 34;
  const label = strength <= 0.02 ? "No drift" : `${Math.round(directionDegrees)} deg, ${Math.round(strength * 100)}%`;

  const updateFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    const distance = Math.hypot(x, y);
    const radius = rect.width / 2;
    const nextStrength = distance < radius * 0.16 ? 0 : Math.min(1, distance / (radius * 0.78));
    const nextDegrees = nextStrength === 0 ? directionDegrees : (Math.atan2(y, x) * 180) / Math.PI;
    onChange({
      driftStrength: nextStrength,
      directionDegrees: nextStrength === 0 ? directionDegrees : Math.round((nextDegrees + 360) % 360)
    });
  };

  return (
    <div className="weather-drift-control">
      <button
        type="button"
        className="weather-direction-dial"
        aria-label={`Weather drift: ${label}`}
        title="Drag the point to set weather drift. Click the center for no drift."
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event);
          }
        }}
      >
        <span className="weather-direction-ring" aria-hidden="true" />
        <span className="weather-direction-center" aria-hidden="true" />
        <span className="weather-direction-knob" style={{ left: `${knobX}%`, top: `${knobY}%` }} aria-hidden="true" />
      </button>
      <div className="weather-drift-meta">
        <span className="weather-drift-label">{label}</span>
        <button className="icon-button weather-reset-button" type="button" title="Reset drift" aria-label="Reset weather drift" onClick={onReset}>
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function getLayerIcon(layer: Layer) {
  switch (layer.kind) {
    case "map":
      return <Image size={16} />;
    case "grid":
      return <Grid3X3 size={16} />;
    case "fog":
      return <CloudFog size={16} />;
    case "weather":
      return <CloudSun size={16} />;
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

function getLayerItemCount(layerId: Layer["id"], scene: Scene): number | null {
  if (layerId === "fog") {
    return scene.fog.shapes.length;
  }
  if (layerId === "token") {
    return scene.tokens.length;
  }
  if (layerId === "weather") {
    return scene.weather.masks.length;
  }
  return null;
}

function getReservedLayerGuidance(layer: Layer): string | null {
  switch (layer.id) {
    case "gm":
      return "Reserved for future GM-only notes, markers, and private scene tools.";
    case "foreground":
      return "Reserved for future foreground overlays that sit above tokens.";
    case "object":
      return "Reserved for future placed scene objects and props.";
    case "lighting":
      return "Reserved for future walls, lights, and line-of-sight tools.";
    default:
      return null;
  }
}

function getFitModeHelp(fitMode: MapTransform["fitMode"]): string {
  switch (fitMode) {
    case "manual":
      return "Manual uses the X/Y position, scale, and rotation values directly.";
    case "contain":
      return "Fit contain scales the whole map into view without cropping.";
    case "cover":
      return "Fit cover fills the view and may crop map edges.";
    case "actual-size":
      return "Actual size draws the map at native pixel size and centers it.";
  }
}
