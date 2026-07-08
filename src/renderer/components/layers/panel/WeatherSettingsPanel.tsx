import { RotateCcw } from "lucide-react";
import type { WeatherPatternEffectType, WeatherSettings, WeatherTuningSettings } from "../../../../shared/localvtt";
import type { ActiveWeatherCategory } from "../../../lib/effects";
import { WeatherCategoryList } from "./WeatherCategoryList";
import { WEATHER_PRESET_PACKS, type WeatherPresetPackId, type WeatherTuningKey } from "./layerPanelWeather";
import { WeatherCategorySettingsPanel } from "./WeatherCategorySettingsPanel";

export function WeatherSettingsPanel({
  weather,
  selectedWeatherPresetPack,
  expandedWeatherCategory,
  onExpandedWeatherCategoryChange,
  onToggleWeatherCategory,
  onSelectWeatherEffect,
  onApplyWeatherPresetPack,
  onResetWeatherPresetPack,
  onUpdateWeatherTuning,
  onResetWeatherTuning,
  onResetWeatherDrift
}: {
  weather: WeatherSettings;
  selectedWeatherPresetPack: WeatherPresetPackId | "";
  expandedWeatherCategory: ActiveWeatherCategory | null;
  onExpandedWeatherCategoryChange: (category: ActiveWeatherCategory | null) => void;
  onToggleWeatherCategory: (category: ActiveWeatherCategory, enabled: boolean) => void;
  onSelectWeatherEffect: (category: ActiveWeatherCategory, effect: WeatherPatternEffectType) => void;
  onApplyWeatherPresetPack: (presetId: WeatherPresetPackId) => void;
  onResetWeatherPresetPack: () => void;
  onUpdateWeatherTuning: (category: ActiveWeatherCategory, patch: Partial<WeatherTuningSettings>) => void;
  onResetWeatherTuning: (category: ActiveWeatherCategory, key: WeatherTuningKey) => void;
  onResetWeatherDrift: (category: ActiveWeatherCategory) => void;
}) {
  const expandedWeatherSlot = expandedWeatherCategory ? weather.effects[expandedWeatherCategory] : null;

  return (
    <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
      <div className="weather-panel-section">
        <div className="weather-settings-heading">
          <span>Weather Preset</span>
        </div>
        <label className="setting-row weather-pack-row">
          <span>Preset</span>
          <span className="weather-pack-control">
            <select value={selectedWeatherPresetPack} onChange={(event) => onApplyWeatherPresetPack(event.target.value as WeatherPresetPackId)}>
              <option value="" disabled>
                Select preset
              </option>
              {WEATHER_PRESET_PACKS.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.label}
                </option>
              ))}
            </select>
            <button
              className="icon-button weather-reset-button"
              type="button"
              aria-label="Clear weather preset selection"
              title="Clear preset selection"
              disabled={!selectedWeatherPresetPack}
              onClick={onResetWeatherPresetPack}
            >
              <RotateCcw size={13} aria-hidden="true" />
            </button>
          </span>
        </label>
      </div>
      <div className="weather-panel-section">
        <div className="weather-settings-heading">
          <span>Active Effects</span>
        </div>
        <WeatherCategoryList
          weather={weather}
          expandedWeatherCategory={expandedWeatherCategory}
          onExpandedWeatherCategoryChange={onExpandedWeatherCategoryChange}
          onToggleWeatherCategory={onToggleWeatherCategory}
          onSelectWeatherEffect={onSelectWeatherEffect}
        />
      </div>
      {expandedWeatherCategory && expandedWeatherSlot && (
        <WeatherCategorySettingsPanel
          category={expandedWeatherCategory}
          slot={expandedWeatherSlot}
          onUpdateWeatherTuning={onUpdateWeatherTuning}
          onResetWeatherTuning={onResetWeatherTuning}
          onResetWeatherDrift={onResetWeatherDrift}
        />
      )}
      <div className="control-divider" />
      <div className="inline-help">Scene weather renders on both GM View and Player View when this layer is visible. Keep weather drift centered for no directional movement.</div>
    </div>
  );
}
