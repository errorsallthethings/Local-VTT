import {
  DEFAULT_WEATHER_EFFECT_SETTINGS,
  type WeatherPatternEffectType,
  type WeatherSettings,
  type WeatherTuningSettings
} from "../../../../shared/localvtt";
import { getWeatherEffectOptions, type ActiveWeatherCategory } from "../../../lib/effects";

export type WeatherTuningKey = keyof WeatherTuningSettings;
export type WeatherPresetPackId = "light-rain" | "storm" | "blizzard" | "ash-fall" | "desert-wind" | "magical-fog";

interface WeatherPresetPackSlot {
  category: ActiveWeatherCategory;
  pattern: WeatherPatternEffectType;
  settings: WeatherTuningSettings;
}

export interface WeatherPresetPack {
  id: WeatherPresetPackId;
  label: string;
  slots: WeatherPresetPackSlot[];
}

export const WEATHER_PRESET_PACKS: WeatherPresetPack[] = [
  {
    id: "light-rain",
    label: "Light Rain",
    slots: [
      {
        category: "rain",
        pattern: "light-rain",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS["light-rain"] }
      }
    ]
  },
  {
    id: "storm",
    label: "Storm",
    slots: [
      {
        category: "rain",
        pattern: "rain-storm",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS["rain-storm"], directionDegrees: 118, driftStrength: 0.34 }
      },
      {
        category: "fog",
        pattern: "light-fog",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS["light-fog"], opacity: 0.52, color: "#9aa7b8", directionDegrees: 118, driftStrength: 0.22 }
      }
    ]
  },
  {
    id: "blizzard",
    label: "Blizzard",
    slots: [
      {
        category: "snow",
        pattern: "blizzard",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.blizzard, directionDegrees: 32, driftStrength: 0.72 }
      },
      {
        category: "fog",
        pattern: "light-fog",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS["light-fog"], opacity: 0.58, color: "#dbe7f3", directionDegrees: 32, driftStrength: 0.36 }
      }
    ]
  },
  {
    id: "ash-fall",
    label: "Ash Fall",
    slots: [
      {
        category: "snow",
        pattern: "light-snow",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS["light-snow"], opacity: 0.72, color: "#8f8a82", speed: 0.38, driftStrength: 0.24, streakLength: 0.82 }
      },
      {
        category: "fog",
        pattern: "light-fog",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS["light-fog"], opacity: 0.46, color: "#6f665f", speed: 0.54, driftStrength: 0.18 }
      }
    ]
  },
  {
    id: "desert-wind",
    label: "Desert Wind",
    slots: [
      {
        category: "sand",
        pattern: "sand",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.sand, directionDegrees: 18, driftStrength: 0.82 }
      }
    ]
  },
  {
    id: "magical-fog",
    label: "Magical Fog",
    slots: [
      {
        category: "fog",
        pattern: "heavy-fog",
        settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-fog"], color: "#9f7aea", opacity: 0.86, speed: 0.68, directionDegrees: 292, driftStrength: 0.3 }
      }
    ]
  }
];

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

export function getWeatherPresetPack(id: WeatherPresetPackId): WeatherPresetPack {
  return WEATHER_PRESET_PACKS.find((pack) => pack.id === id) ?? WEATHER_PRESET_PACKS[0];
}

export function getWeatherWithPresetPack(weather: WeatherSettings, presetId: WeatherPresetPackId): WeatherSettings {
  const preset = getWeatherPresetPack(presetId);
  const effects: WeatherSettings["effects"] = {
    rain: getDefaultWeatherSlot("rain"),
    fog: getDefaultWeatherSlot("fog"),
    snow: getDefaultWeatherSlot("snow"),
    sand: getDefaultWeatherSlot("sand")
  };
  const effectSettings = { ...weather.effectSettings };

  for (const slot of preset.slots) {
    const settings = { ...slot.settings };
    if (slot.category === "rain" && isRainWeatherPresetPattern(slot.pattern)) {
      effects.rain = { enabled: true, pattern: slot.pattern, settings };
    } else if (slot.category === "fog" && isFogWeatherPresetPattern(slot.pattern)) {
      effects.fog = { enabled: true, pattern: slot.pattern, settings };
    } else if (slot.category === "snow" && isSnowWeatherPresetPattern(slot.pattern)) {
      effects.snow = { enabled: true, pattern: slot.pattern, settings };
    } else if (slot.category === "sand" && isSandWeatherPresetPattern(slot.pattern)) {
      effects.sand = { enabled: true, pattern: slot.pattern, settings };
    }
    effectSettings[slot.pattern] = settings;
  }

  return getWeatherWithPatch(weather, {
    effects,
    effectSettings,
    masks: weather.masks
  });
}

function isRainWeatherPresetPattern(pattern: WeatherPatternEffectType): pattern is WeatherSettings["effects"]["rain"]["pattern"] {
  return pattern === "light-rain" || pattern === "rain" || pattern === "heavy-rain" || pattern === "rain-storm";
}

function isFogWeatherPresetPattern(pattern: WeatherPatternEffectType): pattern is WeatherSettings["effects"]["fog"]["pattern"] {
  return pattern === "light-fog" || pattern === "fog" || pattern === "heavy-fog";
}

function isSnowWeatherPresetPattern(pattern: WeatherPatternEffectType): pattern is WeatherSettings["effects"]["snow"]["pattern"] {
  return pattern === "light-snow" || pattern === "snow" || pattern === "blizzard";
}

function isSandWeatherPresetPattern(pattern: WeatherPatternEffectType): pattern is WeatherSettings["effects"]["sand"]["pattern"] {
  return pattern === "light-sand" || pattern === "sand" || pattern === "sandstorm";
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
