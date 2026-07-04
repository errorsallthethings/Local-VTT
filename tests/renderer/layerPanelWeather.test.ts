import { describe, expect, it } from "vitest";
import {
  getDefaultWeatherSlot,
  getLegacyWeatherEffect,
  getWeatherAdvancedLabels,
  getWeatherColorLabel,
  getWeatherEffectSettingsWithCategoryReset,
  getWeatherEffectSettingsWithCurrent,
  getWeatherIntensityMax,
  getWeatherOpacityMax,
  getWeatherWithCategoryToggled,
  getWeatherWithDriftReset,
  getWeatherWithPatch,
  getWeatherWithSelectedEffect,
  getWeatherWithTuningPatch,
  getWeatherWithTuningReset,
  hasEnabledWeatherEffect
} from "../../src/renderer/components/layers/panel/layerPanelWeather";
import { createDefaultScene, DEFAULT_WEATHER_EFFECT_SETTINGS } from "../../src/shared/localvtt";

describe("layer panel weather helpers", () => {
  it("creates independent default weather slots by category", () => {
    const rain = getDefaultWeatherSlot("rain");
    const fog = getDefaultWeatherSlot("fog");

    expect(rain).toMatchObject({ enabled: false, pattern: "rain" });
    expect(fog).toMatchObject({ enabled: false, pattern: "fog" });
    expect(rain.settings).toEqual(DEFAULT_WEATHER_EFFECT_SETTINGS.rain);
    expect(rain.settings).not.toBe(DEFAULT_WEATHER_EFFECT_SETTINGS.rain);
  });

  it("reports legacy weather effect from the first enabled category", () => {
    const scene = createDefaultScene("Weather");
    scene.weather.effects.fog = { ...scene.weather.effects.fog, enabled: true, pattern: "fog" };
    scene.weather.effects.snow = { ...scene.weather.effects.snow, enabled: true, pattern: "snow" };

    expect(getLegacyWeatherEffect(scene.weather)).toBe("fog");
    expect(hasEnabledWeatherEffect(scene.weather.effects)).toBe(true);
    expect(hasEnabledWeatherEffect(createDefaultScene("Clear").weather.effects)).toBe(false);
  });

  it("merges current category settings into effect settings", () => {
    const scene = createDefaultScene("Weather");
    scene.weather.effectSettings.rain = { ...DEFAULT_WEATHER_EFFECT_SETTINGS.rain, opacity: 0.1 };
    scene.weather.effects.rain = {
      enabled: true,
      pattern: "rain",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.rain, opacity: 0.8 }
    };

    expect(getWeatherEffectSettingsWithCurrent(scene.weather).rain?.opacity).toBe(0.8);
  });

  it("resets all effect settings for a category", () => {
    const scene = createDefaultScene("Weather");
    scene.weather.effectSettings["heavy-rain"] = { ...DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"], opacity: 0.2 };

    const reset = getWeatherEffectSettingsWithCategoryReset(scene.weather, scene.weather.effects, "rain");

    expect(reset.rain).toBe(DEFAULT_WEATHER_EFFECT_SETTINGS.rain);
    expect(reset["heavy-rain"]).toBe(DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"]);
  });

  it("returns category-specific labels and limits", () => {
    expect(getWeatherAdvancedLabels("fog").streakLength).toBe("Bank Scale");
    expect(getWeatherIntensityMax("snow")).toBe(1.25);
    expect(getWeatherIntensityMax("sand")).toBe(1.5);
    expect(getWeatherOpacityMax("sand")).toBe(1.25);
    expect(getWeatherColorLabel("sand")).toBe("Dust Color");
    expect(getWeatherColorLabel("rain")).toBe("Tint");
  });

  it("normalizes enabled and legacy effect fields when applying weather patches", () => {
    const scene = createDefaultScene("Weather");
    const weather = getWeatherWithPatch(scene.weather, {
      effects: {
        ...scene.weather.effects,
        snow: {
          enabled: true,
          pattern: "snow",
          settings: DEFAULT_WEATHER_EFFECT_SETTINGS.snow
        }
      }
    });

    expect(weather.enabled).toBe(true);
    expect(weather.effect).toBe("snow");
  });

  it("toggles weather categories and resets disabled category effect settings", () => {
    const scene = createDefaultScene("Weather");
    scene.weather.effectSettings["heavy-rain"] = { ...DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"], opacity: 0.2 };

    const enabled = getWeatherWithCategoryToggled(scene.weather, "rain", true);
    expect(enabled.effects.rain.enabled).toBe(true);
    expect(enabled.enabled).toBe(true);
    expect(enabled.effect).toBe("rain");

    const disabled = getWeatherWithCategoryToggled(enabled, "rain", false);
    expect(disabled.effects.rain.enabled).toBe(false);
    expect(disabled.enabled).toBe(false);
    expect(disabled.effect).toBe("none");
    expect(disabled.effectSettings["heavy-rain"]).toBe(DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"]);
  });

  it("selects weather effects and toggles the active effect off when selected again", () => {
    const scene = createDefaultScene("Weather");
    scene.weather.effectSettings["heavy-rain"] = { ...DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"], opacity: 0.66 };

    const selected = getWeatherWithSelectedEffect(scene.weather, "rain", "heavy-rain");
    expect(selected.effects.rain).toMatchObject({ enabled: true, pattern: "heavy-rain" });
    expect(selected.effects.rain.settings.opacity).toBe(0.66);
    expect(selected.effect).toBe("heavy-rain");

    const toggledOff = getWeatherWithSelectedEffect(selected, "rain", "heavy-rain");
    expect(toggledOff.effects.rain.enabled).toBe(false);
    expect(toggledOff.effect).toBe("none");
  });

  it("updates and resets weather tuning for the selected category pattern", () => {
    const scene = createDefaultScene("Weather");
    const selected = getWeatherWithSelectedEffect(scene.weather, "rain", "heavy-rain");
    const tuned = getWeatherWithTuningPatch(selected, "rain", {
      opacity: 0.42,
      directionDegrees: 123,
      driftStrength: 0.25
    });

    expect(tuned.effects.rain.settings.opacity).toBe(0.42);
    expect(tuned.effectSettings["heavy-rain"]?.opacity).toBe(0.42);

    const opacityReset = getWeatherWithTuningReset(tuned, "rain", "opacity");
    expect(opacityReset.effects.rain.settings.opacity).toBe(DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"].opacity);

    const driftReset = getWeatherWithDriftReset(tuned, "rain");
    expect(driftReset.effects.rain.settings.directionDegrees).toBe(DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"].directionDegrees);
    expect(driftReset.effects.rain.settings.driftStrength).toBe(DEFAULT_WEATHER_EFFECT_SETTINGS["heavy-rain"].driftStrength);
  });
});
