import { WEATHER_CATEGORY_OPTIONS, type ActiveWeatherCategory } from "../../../lib/effects";
import type { WeatherSettings } from "../../../../shared/localvtt";
import { WeatherCategoryRow } from "./WeatherControls";

export function WeatherCategoryList({
  weather,
  expandedWeatherCategory,
  onExpandedWeatherCategoryChange,
  onToggleWeatherCategory
}: {
  weather: WeatherSettings;
  expandedWeatherCategory: ActiveWeatherCategory | null;
  onExpandedWeatherCategoryChange: (category: ActiveWeatherCategory | null) => void;
  onToggleWeatherCategory: (category: ActiveWeatherCategory, enabled: boolean) => void;
}) {
  return (
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
  );
}
