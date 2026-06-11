import { describe, expect, it } from "vitest";
import { createDefaultWeather } from "../../src/shared/localvtt";
import { getActiveWeatherEffects, getWeatherPatternLabel } from "../../src/renderer/lib/weatherCatalog";

describe("weather catalog", () => {
  it("provides labels for weather patterns from one catalog", () => {
    expect(getWeatherPatternLabel("light-rain")).toBe("Light Rain");
    expect(getWeatherPatternLabel("heavy-fog")).toBe("Heavy Fog");
    expect(getWeatherPatternLabel("blizzard")).toBe("Blizzard");
    expect(getWeatherPatternLabel("sandstorm")).toBe("Sandstorm");
    expect(getWeatherPatternLabel("unknown")).toBe("Weather");
  });

  it("returns active weather effects in category order", () => {
    const weather = createDefaultWeather();
    weather.enabled = true;
    weather.effects.snow.enabled = true;
    weather.effects.snow.pattern = "blizzard";
    weather.effects.rain.enabled = true;
    weather.effects.rain.pattern = "rain-storm";

    expect(getActiveWeatherEffects(weather).map((effect) => [effect.key, effect.label])).toEqual([
      ["rain", "Rain Storm"],
      ["snow", "Blizzard"]
    ]);
  });
});
