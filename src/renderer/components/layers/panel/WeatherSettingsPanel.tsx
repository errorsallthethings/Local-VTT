import type { WeatherPatternEffectType, WeatherSettings, WeatherTuningSettings } from "../../../../shared/localvtt";
import type { ActiveWeatherCategory } from "../../../lib/effects";
import { WeatherCategoryList } from "./WeatherCategoryList";
import type { WeatherTuningKey } from "./layerPanelWeather";
import { WeatherCategorySettingsPanel } from "./WeatherCategorySettingsPanel";

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

  return (
    <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
      <WeatherCategoryList
        weather={weather}
        expandedWeatherCategory={expandedWeatherCategory}
        onExpandedWeatherCategoryChange={onExpandedWeatherCategoryChange}
        onToggleWeatherCategory={onToggleWeatherCategory}
      />
      {expandedWeatherCategory && expandedWeatherSlot && (
        <WeatherCategorySettingsPanel
          category={expandedWeatherCategory}
          slot={expandedWeatherSlot}
          onSelectWeatherEffect={onSelectWeatherEffect}
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
