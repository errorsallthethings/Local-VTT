import { RotateCcw } from "lucide-react";
import type { WeatherSettings, WeatherTuningSettings } from "../../../../shared/localvtt";
import {
  getWeatherCategoryLabel,
  getWeatherPatternLabel,
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
import { WeatherDirectionDial, WeatherRangeRow } from "./WeatherControls";

export function WeatherCategorySettingsPanel({
  category,
  slot,
  onUpdateWeatherTuning,
  onResetWeatherTuning,
  onResetWeatherDrift
}: {
  category: ActiveWeatherCategory;
  slot: WeatherSettings["effects"][ActiveWeatherCategory];
  onUpdateWeatherTuning: (category: ActiveWeatherCategory, patch: Partial<WeatherTuningSettings>) => void;
  onResetWeatherTuning: (category: ActiveWeatherCategory, key: WeatherTuningKey) => void;
  onResetWeatherDrift: (category: ActiveWeatherCategory) => void;
}) {
  const settings = slot.enabled ? slot.settings : null;
  const advancedLabels = getWeatherAdvancedLabels(category);
  const intensityMax = getWeatherIntensityMax(category);
  const opacityMax = getWeatherOpacityMax(category);
  const colorLabel = getWeatherColorLabel(category);

  return (
    <div className="weather-category-settings">
      <div className="weather-settings-heading">
        <span>{getWeatherCategoryLabel(category)} Settings</span>
        <small>{getWeatherPatternLabel(slot.pattern)}</small>
      </div>
      {settings ? (
        <>
          <div className="settings-grid">
            <WeatherBasicRangeRow
              label="Intensity"
              value={settings.intensity}
              min={0.1}
              max={intensityMax}
              format={formatLayerPanelPercent}
              onChange={(intensity) => onUpdateWeatherTuning(category, { intensity })}
              onReset={() => onResetWeatherTuning(category, "intensity")}
            />
            <WeatherBasicRangeRow
              label="Opacity"
              value={settings.opacity}
              min={0.05}
              max={opacityMax}
              format={formatLayerPanelPercent}
              onChange={(opacity) => onUpdateWeatherTuning(category, { opacity })}
              onReset={() => onResetWeatherTuning(category, "opacity")}
            />
            {(category === "fog" || category === "sand") && (
              <div className="setting-row">
                <span>{colorLabel}</span>
                <div className="weather-setting-control">
                  <ColorInput value={settings.color} onChange={(color) => onUpdateWeatherTuning(category, { color })} />
                  <button className="icon-button weather-reset-button" type="button" title={`Reset ${colorLabel.toLowerCase()}`} aria-label={`Reset weather ${colorLabel.toLowerCase()}`} onClick={() => onResetWeatherTuning(category, "color")}>
                    <RotateCcw size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
            <WeatherBasicRangeRow
              label="Speed"
              value={settings.speed}
              min={0.1}
              max={2}
              format={formatLayerPanelMultiplier}
              onChange={(speed) => onUpdateWeatherTuning(category, { speed })}
              onReset={() => onResetWeatherTuning(category, "speed")}
            />
          </div>
          <details className="weather-advanced-panel">
            <summary>Advanced</summary>
            <div className="settings-grid">
              <div className="setting-row weather-drift-row">
                <span>{category === "sand" ? "Wind" : "Drift"}</span>
                <WeatherDirectionDial weather={settings} onChange={(patch) => onUpdateWeatherTuning(category, patch)} onReset={() => onResetWeatherDrift(category)} />
              </div>
              <WeatherRangeRow label={advancedLabels.edgeBias} value={settings.edgeBias} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(edgeBias) => onUpdateWeatherTuning(category, { edgeBias })} onReset={() => onResetWeatherTuning(category, "edgeBias")} />
              <WeatherRangeRow label={advancedLabels.quietAreaSize} value={settings.quietAreaSize} min={0.35} max={0.9} step={0.05} format={formatLayerPanelPercent} onChange={(quietAreaSize) => onUpdateWeatherTuning(category, { quietAreaSize })} onReset={() => onResetWeatherTuning(category, "quietAreaSize")} />
              <WeatherRangeRow label={advancedLabels.centerStrayDrops} value={settings.centerStrayDrops} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(centerStrayDrops) => onUpdateWeatherTuning(category, { centerStrayDrops })} onReset={() => onResetWeatherTuning(category, "centerStrayDrops")} />
              <WeatherRangeRow label={advancedLabels.streakLength} value={settings.streakLength} min={0.4} max={2} step={0.05} format={formatLayerPanelMultiplier} onChange={(streakLength) => onUpdateWeatherTuning(category, { streakLength })} onReset={() => onResetWeatherTuning(category, "streakLength")} />
              {slot.pattern === "rain-storm" && (
                <>
                  <WeatherRangeRow label="Lightning" value={settings.lightningFrequency} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(lightningFrequency) => onUpdateWeatherTuning(category, { lightningFrequency })} onReset={() => onResetWeatherTuning(category, "lightningFrequency")} />
                  <WeatherRangeRow label="Flash" value={settings.flashStrength} min={0} max={1} step={0.05} format={formatLayerPanelPercent} onChange={(flashStrength) => onUpdateWeatherTuning(category, { flashStrength })} onReset={() => onResetWeatherTuning(category, "flashStrength")} />
                </>
              )}
              <div className="setting-row">
                <span>Quality</span>
                <div className="weather-setting-control">
                  <select value={settings.quality} onChange={(event) => onUpdateWeatherTuning(category, { quality: event.target.value as WeatherTuningSettings["quality"] })}>
                    <option value="low">Low</option>
                    <option value="balanced">Balanced</option>
                    <option value="high">High</option>
                  </select>
                  <button className="icon-button weather-reset-button" type="button" title="Reset quality" aria-label="Reset weather quality" onClick={() => onResetWeatherTuning(category, "quality")}>
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
  );
}

function WeatherBasicRangeRow({
  label,
  value,
  min,
  max,
  format,
  onChange,
  onReset
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <div className="weather-setting-control weather-setting-control-with-value">
        <input type="range" min={min} max={max} step={0.05} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <output>{format(value)}</output>
        <button className="icon-button weather-reset-button" type="button" title={`Reset ${label.toLowerCase()}`} aria-label={`Reset weather ${label.toLowerCase()}`} onClick={onReset}>
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
