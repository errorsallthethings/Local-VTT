import { RotateCcw } from "lucide-react";
import type { WeatherPatternEffectType, WeatherSettings, WeatherTuningSettings } from "../../../../shared/localvtt";
import {
  WEATHER_CATEGORY_OPTIONS,
  getWeatherCategoryLabel,
  getWeatherEffectOptions,
  type ActiveWeatherCategory
} from "../../../lib/effects";
import { ColorInput } from "../../controls/ColorPickerField";
import { formatLayerPanelMultiplier, formatLayerPanelPercent } from "./layerPanelFormat";
import {
  getWeatherAdvancedLabels,
  getWeatherColorLabel,
  getWeatherIntensityMax,
  getWeatherOpacityMax,
  type WeatherTuningKey
} from "./layerPanelWeather";
import { WeatherCategoryRow, WeatherDirectionDial, WeatherRangeRow } from "./WeatherControls";

export function WeatherSettingsPanel({
  weather,
  expandedWeatherCategory,
  onExpandedWeatherCategoryChange,
  onToggleWeatherCategory,
  onSelectWeatherEffect,
  onUpdateWeatherTuning,
  onResetWeatherTuning,
  onResetWeatherDrift
}: {
  weather: WeatherSettings;
  expandedWeatherCategory: ActiveWeatherCategory | null;
  onExpandedWeatherCategoryChange: (category: ActiveWeatherCategory | null) => void;
  onToggleWeatherCategory: (category: ActiveWeatherCategory, enabled: boolean) => void;
  onSelectWeatherEffect: (category: ActiveWeatherCategory, effect: WeatherPatternEffectType) => void;
  onUpdateWeatherTuning: (category: ActiveWeatherCategory, patch: Partial<WeatherTuningSettings>) => void;
  onResetWeatherTuning: (category: ActiveWeatherCategory, key: WeatherTuningKey) => void;
  onResetWeatherDrift: (category: ActiveWeatherCategory) => void;
}) {
  const expandedWeatherSlot = expandedWeatherCategory ? weather.effects[expandedWeatherCategory] : null;
  const expandedWeatherSettings = expandedWeatherSlot?.enabled ? expandedWeatherSlot.settings : null;
  const expandedWeatherOptions = expandedWeatherCategory ? getWeatherEffectOptions(expandedWeatherCategory) : [];
  const expandedWeatherAdvancedLabels = expandedWeatherCategory ? getWeatherAdvancedLabels(expandedWeatherCategory) : getWeatherAdvancedLabels("rain");
  const expandedWeatherIntensityMax = expandedWeatherCategory ? getWeatherIntensityMax(expandedWeatherCategory) : 1;
  const expandedWeatherOpacityMax = expandedWeatherCategory ? getWeatherOpacityMax(expandedWeatherCategory) : 1;
  const expandedWeatherColorLabel = expandedWeatherCategory ? getWeatherColorLabel(expandedWeatherCategory) : "Tint";

  return (
    <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
      <div className="weather-category-list">
        {WEATHER_CATEGORY_OPTIONS.map((option) => (
          <WeatherCategoryRow
            key={option.category}
            label={option.label}
            enabled={weather.effects[option.category].enabled}
            expanded={expandedWeatherCategory === option.category}
            onEnabledChange={(enabled) => onToggleWeatherCategory(option.category, enabled)}
            onExpand={() => onExpandedWeatherCategoryChange(expandedWeatherCategory === option.category ? null : option.category)}
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
                  onClick={() => onSelectWeatherEffect(expandedWeatherCategory, option.effect)}
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
                    <input type="range" min={0.1} max={expandedWeatherIntensityMax} step={0.05} value={expandedWeatherSettings.intensity} onChange={(event) => onUpdateWeatherTuning(expandedWeatherCategory, { intensity: Number(event.target.value) })} />
                    <button className="icon-button weather-reset-button" type="button" title="Reset intensity" aria-label="Reset weather intensity" onClick={() => onResetWeatherTuning(expandedWeatherCategory, "intensity")}>
                      <RotateCcw size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="setting-row">
                  <span>Opacity</span>
                  <div className="weather-setting-control">
                    <input type="range" min={0.05} max={expandedWeatherOpacityMax} step={0.05} value={expandedWeatherSettings.opacity} onChange={(event) => onUpdateWeatherTuning(expandedWeatherCategory, { opacity: Number(event.target.value) })} />
                    <button className="icon-button weather-reset-button" type="button" title="Reset opacity" aria-label="Reset weather opacity" onClick={() => onResetWeatherTuning(expandedWeatherCategory, "opacity")}>
                      <RotateCcw size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {(expandedWeatherCategory === "fog" || expandedWeatherCategory === "sand") && (
                  <div className="setting-row">
                    <span>{expandedWeatherColorLabel}</span>
                    <div className="weather-setting-control">
                      <ColorInput value={expandedWeatherSettings.color} onChange={(color) => onUpdateWeatherTuning(expandedWeatherCategory, { color })} />
                      <button className="icon-button weather-reset-button" type="button" title={`Reset ${expandedWeatherColorLabel.toLowerCase()}`} aria-label={`Reset weather ${expandedWeatherColorLabel.toLowerCase()}`} onClick={() => onResetWeatherTuning(expandedWeatherCategory, "color")}>
                        <RotateCcw size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="setting-row">
                  <span>Speed</span>
                  <div className="weather-setting-control">
                    <input type="range" min={0.1} max={2} step={0.05} value={expandedWeatherSettings.speed} onChange={(event) => onUpdateWeatherTuning(expandedWeatherCategory, { speed: Number(event.target.value) })} />
                    <button className="icon-button weather-reset-button" type="button" title="Reset speed" aria-label="Reset weather speed" onClick={() => onResetWeatherTuning(expandedWeatherCategory, "speed")}>
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
                    <WeatherDirectionDial weather={expandedWeatherSettings} onChange={(patch) => onUpdateWeatherTuning(expandedWeatherCategory, patch)} onReset={() => onResetWeatherDrift(expandedWeatherCategory)} />
                  </div>
                  <WeatherRangeRow label={expandedWeatherAdvancedLabels.edgeBias} value={expandedWeatherSettings.edgeBias} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => onUpdateWeatherTuning(expandedWeatherCategory, { edgeBias: value })} onReset={() => onResetWeatherTuning(expandedWeatherCategory, "edgeBias")} />
                  <WeatherRangeRow label={expandedWeatherAdvancedLabels.quietAreaSize} value={expandedWeatherSettings.quietAreaSize} min={0.35} max={0.9} step={0.05} format={formatLayerPanelPercent} onChange={(value) => onUpdateWeatherTuning(expandedWeatherCategory, { quietAreaSize: value })} onReset={() => onResetWeatherTuning(expandedWeatherCategory, "quietAreaSize")} />
                  <WeatherRangeRow label={expandedWeatherAdvancedLabels.centerStrayDrops} value={expandedWeatherSettings.centerStrayDrops} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => onUpdateWeatherTuning(expandedWeatherCategory, { centerStrayDrops: value })} onReset={() => onResetWeatherTuning(expandedWeatherCategory, "centerStrayDrops")} />
                  <WeatherRangeRow label={expandedWeatherAdvancedLabels.streakLength} value={expandedWeatherSettings.streakLength} min={0.4} max={2} step={0.05} format={formatLayerPanelMultiplier} onChange={(value) => onUpdateWeatherTuning(expandedWeatherCategory, { streakLength: value })} onReset={() => onResetWeatherTuning(expandedWeatherCategory, "streakLength")} />
                  {expandedWeatherSlot.pattern === "rain-storm" && (
                    <>
                      <WeatherRangeRow label="Lightning" value={expandedWeatherSettings.lightningFrequency} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => onUpdateWeatherTuning(expandedWeatherCategory, { lightningFrequency: value })} onReset={() => onResetWeatherTuning(expandedWeatherCategory, "lightningFrequency")} />
                      <WeatherRangeRow label="Flash" value={expandedWeatherSettings.flashStrength} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(value) => onUpdateWeatherTuning(expandedWeatherCategory, { flashStrength: value })} onReset={() => onResetWeatherTuning(expandedWeatherCategory, "flashStrength")} />
                    </>
                  )}
                  <div className="setting-row">
                    <span>Quality</span>
                    <div className="weather-setting-control">
                      <select value={expandedWeatherSettings.quality} onChange={(event) => onUpdateWeatherTuning(expandedWeatherCategory, { quality: event.target.value as WeatherTuningSettings["quality"] })}>
                        <option value="low">Low</option>
                        <option value="balanced">Balanced</option>
                        <option value="high">High</option>
                      </select>
                      <button className="icon-button weather-reset-button" type="button" title="Reset quality" aria-label="Reset weather quality" onClick={() => onResetWeatherTuning(expandedWeatherCategory, "quality")}>
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
  );
}
