import type { Camera } from "./camera";
import type { Scene, WeatherMask, WeatherSettings } from "../../shared/localvtt";
import { RainRenderer } from "./weather/rainRenderer";
import { FogRenderer } from "./weather/fogRenderer";
import { SnowRenderer } from "./weather/snowRenderer";
import { SandRenderer } from "./weather/sandRenderer";
import { clamp01, getScreenWeatherArea, getWeatherClipPath, type WeatherBounds } from "./weather/weatherCore";

const rainRenderer = new RainRenderer();
const fogRenderer = new FogRenderer();
const snowRenderer = new SnowRenderer();
const sandRenderer = new SandRenderer();
let cachedClipSignature = "";
let cachedClipPath: Path2D | null = null;

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
  const clipPath = getCachedWeatherClipPath(area.clip, weather.masks, camera);
  if (weather.effects.rain.enabled) {
    rainRenderer.draw(ctx, area, getWeatherForRain(scene.weather), camera, now, opacity, clipPath);
  }
  if (weather.effects.fog.enabled) {
    fogRenderer.draw(ctx, area, getWeatherForFog(scene.weather), camera, now, opacity, clipPath);
  }
  if (weather.effects.snow.enabled) {
    snowRenderer.draw(ctx, area, getWeatherForSnow(scene.weather), camera, now, opacity, clipPath);
  }
  if (weather.effects.sand.enabled) {
    sandRenderer.draw(ctx, area, getWeatherForSand(scene.weather), camera, now, opacity, clipPath);
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

function getCachedWeatherClipPath(bounds: WeatherBounds, masks: WeatherMask[], camera: Camera): Path2D {
  const signature = getWeatherClipSignature(bounds, masks, camera);
  if (cachedClipPath && signature === cachedClipSignature) {
    return cachedClipPath;
  }
  cachedClipSignature = signature;
  cachedClipPath = getWeatherClipPath(bounds, masks, camera);
  return cachedClipPath;
}

function getWeatherClipSignature(bounds: WeatherBounds, masks: WeatherMask[], camera: Camera): string {
  return [
    toSignatureNumber(bounds.left),
    toSignatureNumber(bounds.top),
    toSignatureNumber(bounds.width),
    toSignatureNumber(bounds.height),
    toSignatureNumber(camera.x),
    toSignatureNumber(camera.y),
    toSignatureNumber(camera.zoom),
    masks.map(getWeatherMaskSignature).join("|")
  ].join(":");
}

function getWeatherMaskSignature(mask: WeatherMask): string {
  return [
    mask.id,
    mask.kind,
    mask.visible === false ? "0" : "1",
    toSignatureNumber(mask.radius ?? 0),
    mask.points.map((point) => `${toSignatureNumber(point.x)},${toSignatureNumber(point.y)}`).join(";")
  ].join(",");
}

function toSignatureNumber(value: number): string {
  return value.toFixed(3);
}
