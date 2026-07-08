import { getWeatherEffectOptions, WEATHER_CATEGORY_OPTIONS, type ActiveWeatherCategory } from "../../../lib/effects";
import type { WeatherPatternEffectType } from "../../../../shared/localvtt";
import type { WeatherSettings } from "../../../../shared/localvtt";
import { WeatherCategoryRow } from "./WeatherControls";

export function WeatherCategoryList({
  weather,
  expandedWeatherCategory,
  onExpandedWeatherCategoryChange,
  onToggleWeatherCategory,
  onSelectWeatherEffect
}: {
  weather: WeatherSettings;
  expandedWeatherCategory: ActiveWeatherCategory | null;
  onExpandedWeatherCategoryChange: (category: ActiveWeatherCategory | null) => void;
  onToggleWeatherCategory: (category: ActiveWeatherCategory, enabled: boolean) => void;
  onSelectWeatherEffect: (category: ActiveWeatherCategory, effect: WeatherPatternEffectType) => void;
}) {
  return (
    <div className="weather-category-list">
      {WEATHER_CATEGORY_OPTIONS.map((option) => {
        const slot = weather.effects[option.category];
        return (
          <WeatherCategoryRow
            key={option.category}
            label={option.label}
            enabled={slot.enabled}
            expanded={expandedWeatherCategory === option.category}
            pattern={slot.pattern}
            options={getWeatherEffectOptions(option.category)}
            onEnabledChange={(enabled) => onToggleWeatherCategory(option.category, enabled)}
            onPatternChange={(effect) => onSelectWeatherEffect(option.category, effect)}
            onExpand={() => onExpandedWeatherCategoryChange(expandedWeatherCategory === option.category ? null : option.category)}
          />
        );
      })}
    </div>
  );
}
