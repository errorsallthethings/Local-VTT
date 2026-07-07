import {
  DEFAULT_WEATHER_EFFECT_SETTINGS,
  type WeatherPatternEffectType,
  type WeatherSettings,
  type WeatherTuningSettings
} from "../../../../shared/localvtt";
import { getWeatherEffectOptions, type ActiveWeatherCategory } from "../../../lib/effects";

export type WeatherTuningKey = keyof WeatherTuningSettings;

export function getLegacyWeatherEffect(weather: WeatherSettings): WeatherSettings["effect"] {
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

export function getDefaultWeatherSlot(category: "rain"): WeatherSettings["effects"]["rain"];
export function getDefaultWeatherSlot(category: "fog"): WeatherSettings["effects"]["fog"];
export function getDefaultWeatherSlot(category: "snow"): WeatherSettings["effects"]["snow"];
export function getDefaultWeatherSlot(category: "sand"): WeatherSettings["effects"]["sand"];
export function getDefaultWeatherSlot(category: ActiveWeatherCategory): WeatherSettings["effects"][ActiveWeatherCategory];
export function getDefaultWeatherSlot(category: ActiveWeatherCategory): WeatherSettings["effects"][ActiveWeatherCategory] {
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

export function getWeatherEffectSettingsWithCurrent(weather: WeatherSettings): WeatherSettings["effectSettings"] {
  return {
    ...weather.effectSettings,
    [weather.effects.rain.pattern]: weather.effects.rain.settings,
    [weather.effects.fog.pattern]: weather.effects.fog.settings,
    [weather.effects.snow.pattern]: weather.effects.snow.settings,
    [weather.effects.sand.pattern]: weather.effects.sand.settings
  };
}

export function getWeatherEffectSettingsWithCategoryReset(
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

export function hasEnabledWeatherEffect(effects: WeatherSettings["effects"]): boolean {
  return effects.rain.enabled || effects.fog.enabled || effects.snow.enabled || effects.sand.enabled;
}

export function getWeatherWithPatch(weather: WeatherSettings, patch: Partial<WeatherSettings>): WeatherSettings {
  const nextWeather = {
    ...weather,
    ...patch
  };
  const hasEnabledEffect = hasEnabledWeatherEffect(nextWeather.effects);
  return {
    ...nextWeather,
    enabled: hasEnabledEffect,
    effect: getLegacyWeatherEffect(nextWeather)
  };
}

export function getWeatherWithCategoryToggled(weather: WeatherSettings, category: ActiveWeatherCategory, enabled: boolean): WeatherSettings {
  const slot = enabled ? weather.effects[category] : getDefaultWeatherSlot(category);
  const effects = {
    ...weather.effects,
    [category]: {
      ...slot,
      enabled
    }
  };
  return getWeatherWithPatch(weather, {
    effects,
    enabled: hasEnabledWeatherEffect(effects),
    effectSettings: enabled
      ? getWeatherEffectSettingsWithCurrent({ ...weather, effects })
      : getWeatherEffectSettingsWithCategoryReset(weather, effects, category)
  });
}

export function getWeatherWithSelectedEffect(
  weather: WeatherSettings,
  category: ActiveWeatherCategory,
  effect: WeatherPatternEffectType
): WeatherSettings {
  const currentSlot = weather.effects[category];
  if (currentSlot.enabled && currentSlot.pattern === effect) {
    return getWeatherWithCategoryToggled(weather, category, false);
  }
  const effectSettings = getWeatherEffectSettingsWithCurrent(weather);
  const nextTuning = effectSettings[effect] ?? DEFAULT_WEATHER_EFFECT_SETTINGS[effect];
  effectSettings[effect] = nextTuning;
  return getWeatherWithPatch(weather, {
    enabled: true,
    effects: {
      ...weather.effects,
      [category]: {
        enabled: true,
        pattern: effect,
        settings: nextTuning
      }
    },
    effectSettings
  });
}

export function getWeatherWithTuningPatch(
  weather: WeatherSettings,
  category: ActiveWeatherCategory,
  patch: Partial<WeatherTuningSettings>
): WeatherSettings {
  const slot = weather.effects[category];
  const nextTuning = {
    ...slot.settings,
    ...patch
  };
  return getWeatherWithPatch(weather, {
    effects: {
      ...weather.effects,
      [category]: {
        ...slot,
        settings: nextTuning
      }
    },
    effectSettings: {
      ...weather.effectSettings,
      [slot.pattern]: nextTuning
    }
  });
}

export function getWeatherWithTuningReset(
  weather: WeatherSettings,
  category: ActiveWeatherCategory,
  key: WeatherTuningKey
): WeatherSettings {
  const pattern = weather.effects[category].pattern;
  return getWeatherWithTuningPatch(weather, category, { [key]: DEFAULT_WEATHER_EFFECT_SETTINGS[pattern][key] });
}

export function getWeatherWithDriftReset(weather: WeatherSettings, category: ActiveWeatherCategory): WeatherSettings {
  const pattern = weather.effects[category].pattern;
  const defaults = DEFAULT_WEATHER_EFFECT_SETTINGS[pattern];
  return getWeatherWithTuningPatch(weather, category, {
    directionDegrees: defaults.directionDegrees,
    driftStrength: defaults.driftStrength
  });
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

export function getWeatherAdvancedLabels(category: ActiveWeatherCategory) {
  return WEATHER_ADVANCED_LABELS[category];
}

export function getWeatherIntensityMax(category: ActiveWeatherCategory): number {
  if (category === "sand") {
    return 1.5;
  }
  if (category === "snow") {
    return 1.25;
  }
  return 1;
}

export function getWeatherOpacityMax(category: ActiveWeatherCategory): number {
  if (category === "sand") {
    return 1.25;
  }
  return 1;
}

export function getWeatherColorLabel(category: ActiveWeatherCategory): string {
  if (category === "sand") {
    return "Dust Color";
  }
  return "Tint";
}
