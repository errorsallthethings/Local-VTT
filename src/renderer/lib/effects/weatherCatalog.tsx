import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Snowflake,
  ThermometerSnowflake,
  Wind,
  type LucideIcon
} from "lucide-react";
import type {
  FogWeatherEffectType,
  RainWeatherEffectType,
  SandWeatherEffectType,
  SnowWeatherEffectType,
  WeatherEffectSlots,
  WeatherPatternEffectType
} from "../../../shared/localvtt";

export type ActiveWeatherCategory = keyof WeatherEffectSlots;

export type WeatherEffectOption<TPattern extends WeatherPatternEffectType = WeatherPatternEffectType> = {
  effect: TPattern;
  label: string;
  icon: LucideIcon;
};

export const RAIN_EFFECT_OPTIONS: WeatherEffectOption<RainWeatherEffectType>[] = [
  { effect: "light-rain", label: "Light Rain", icon: CloudDrizzle },
  { effect: "rain", label: "Rain", icon: Droplets },
  { effect: "heavy-rain", label: "Heavy Rain", icon: CloudRain },
  { effect: "rain-storm", label: "Rain Storm", icon: CloudLightning }
];

export const FOG_EFFECT_OPTIONS: WeatherEffectOption<FogWeatherEffectType>[] = [
  { effect: "light-fog", label: "Light Fog", icon: Cloud },
  { effect: "fog", label: "Fog", icon: CloudFog },
  { effect: "heavy-fog", label: "Heavy Fog", icon: CloudFog }
];

export const SNOW_EFFECT_OPTIONS: WeatherEffectOption<SnowWeatherEffectType>[] = [
  { effect: "light-snow", label: "Light Snow", icon: ThermometerSnowflake },
  { effect: "snow", label: "Snow", icon: Snowflake },
  { effect: "blizzard", label: "Blizzard", icon: CloudSnow }
];

export const SAND_EFFECT_OPTIONS: WeatherEffectOption<SandWeatherEffectType>[] = [
  { effect: "light-sand", label: "Light Sand", icon: Wind },
  { effect: "sand", label: "Sand", icon: CloudSun },
  { effect: "sandstorm", label: "Sandstorm", icon: Wind }
];

export const WEATHER_CATEGORY_OPTIONS: Array<{
  category: ActiveWeatherCategory;
  label: string;
  icon: LucideIcon;
}> = [
  { category: "rain", label: "Rain", icon: CloudRain },
  { category: "fog", label: "Fog", icon: CloudFog },
  { category: "snow", label: "Snow", icon: Snowflake },
  { category: "sand", label: "Sand", icon: CloudSun }
];

export function getWeatherEffectOptions(category: ActiveWeatherCategory): WeatherEffectOption[] {
  switch (category) {
    case "rain":
      return RAIN_EFFECT_OPTIONS;
    case "snow":
      return SNOW_EFFECT_OPTIONS;
    case "sand":
      return SAND_EFFECT_OPTIONS;
    default:
      return FOG_EFFECT_OPTIONS;
  }
}

export function getWeatherCategoryLabel(category: ActiveWeatherCategory): string {
  return WEATHER_CATEGORY_OPTIONS.find((option) => option.category === category)?.label ?? "Weather";
}

export function getWeatherPatternLabel(pattern: string): string {
  for (const option of [...RAIN_EFFECT_OPTIONS, ...FOG_EFFECT_OPTIONS, ...SNOW_EFFECT_OPTIONS, ...SAND_EFFECT_OPTIONS]) {
    if (option.effect === pattern) {
      return option.label;
    }
  }
  return "Weather";
}

export function getActiveWeatherEffects(weather: { enabled: boolean; effects: WeatherEffectSlots }) {
  if (!weather.enabled) {
    return [];
  }
  return WEATHER_CATEGORY_OPTIONS.flatMap(({ category, icon }) => {
    const slot = weather.effects[category];
    return slot.enabled
      ? [
          {
            key: category,
            label: getWeatherPatternLabel(slot.pattern),
            icon
          }
        ]
      : [];
  });
}
