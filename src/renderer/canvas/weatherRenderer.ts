import type { Camera } from "./camera";
import type { Scene, WeatherSettings } from "../../shared/localvtt";
import { RainRenderer } from "./weather/rainRenderer";
import { FogRenderer } from "./weather/fogRenderer";
import { SnowRenderer } from "./weather/snowRenderer";
import { SandRenderer } from "./weather/sandRenderer";
import { clamp01, getScreenWeatherArea } from "./weather/weatherCore";

const rainRenderer = new RainRenderer();
const fogRenderer = new FogRenderer();
const snowRenderer = new SnowRenderer();
const sandRenderer = new SandRenderer();

export function shouldAnimateWeather(scene: Scene, visible: boolean): boolean {
  return visible && scene.weather.enabled && (scene.weather.effects.rain.enabled || scene.weather.effects.fog.enabled || scene.weather.effects.snow.enabled || scene.weather.effects.sand.enabled);
}

export function drawWeather(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  camera: Camera,
  now: number,
  layerOpacity = 1,
  mapSource?: CanvasImageSource | null
) {
  const weather = scene.weather;
  if (!weather.enabled || layerOpacity <= 0) {
    return;
  }
  const area = getScreenWeatherArea(scene, viewportWidth, viewportHeight, camera, mapSource);
  const opacity = clamp01(layerOpacity);
  if (weather.effects.rain.enabled) {
    rainRenderer.draw(ctx, area, getWeatherForRain(scene.weather), camera, now, opacity);
  }
  if (weather.effects.fog.enabled) {
    fogRenderer.draw(ctx, area, getWeatherForFog(scene.weather), camera, now, opacity);
  }
  if (weather.effects.snow.enabled) {
    snowRenderer.draw(ctx, area, getWeatherForSnow(scene.weather), camera, now, opacity);
  }
  if (weather.effects.sand.enabled) {
    sandRenderer.draw(ctx, area, getWeatherForSand(scene.weather), camera, now, opacity);
  }
}

function getWeatherForRain(weather: WeatherSettings): WeatherSettings {
  return {
    ...weather,
    ...weather.effects.rain.settings,
    effect: weather.effects.rain.pattern
  };
}

function getWeatherForFog(weather: WeatherSettings): WeatherSettings {
  return {
    ...weather,
    ...weather.effects.fog.settings,
    effect: weather.effects.fog.pattern
  };
}

function getWeatherForSnow(weather: WeatherSettings): WeatherSettings {
  return {
    ...weather,
    ...weather.effects.snow.settings,
    effect: weather.effects.snow.pattern
  };
}

function getWeatherForSand(weather: WeatherSettings): WeatherSettings {
  return {
    ...weather,
    ...weather.effects.sand.settings,
    effect: weather.effects.sand.pattern
  };
}
