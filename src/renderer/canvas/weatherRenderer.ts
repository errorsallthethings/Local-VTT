import type { Camera } from "./camera";
import type { Scene, WeatherEffectType, WeatherSettings } from "../../shared/localvtt";

type WeatherBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const PARTICLE_COUNTS: Record<WeatherEffectType, number> = {
  none: 0,
  "partly-cloudy": 9,
  "light-rain": 90,
  rain: 180,
  "heavy-rain": 330,
  lightning: 0,
  "rain-storm": 360,
  snow: 120,
  blizzard: 300,
  "dust-storm": 180,
  "heavy-wind": 42,
  "light-fog": 7,
  fog: 12,
  "heavy-fog": 20,
  ashfall: 120,
  embers: 85
};

export function shouldAnimateWeather(scene: Scene, visible: boolean): boolean {
  return visible && scene.weather.enabled && scene.weather.effect !== "none";
}

export function drawWeather(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  camera: Camera,
  now: number,
  layerOpacity = 1
) {
  const weather = scene.weather;
  if (!weather.enabled || weather.effect === "none" || layerOpacity <= 0 || weather.opacity <= 0) {
    return;
  }

  const bounds = getWeatherBounds(viewportWidth, viewportHeight, camera);
  const opacity = Math.max(0, Math.min(1, weather.opacity * layerOpacity));

  ctx.save();
  ctx.globalAlpha *= opacity;
  switch (weather.effect) {
    case "partly-cloudy":
      drawCloudShadows(ctx, bounds, weather, now);
      break;
    case "light-rain":
    case "rain":
    case "heavy-rain":
      drawRain(ctx, bounds, weather, now);
      break;
    case "lightning":
      drawLightning(ctx, bounds, weather, now);
      break;
    case "rain-storm":
      drawRain(ctx, bounds, weather, now, 1.2);
      drawLightning(ctx, bounds, weather, now);
      break;
    case "snow":
    case "blizzard":
      drawSnow(ctx, bounds, weather, now);
      break;
    case "dust-storm":
      drawDustStorm(ctx, bounds, weather, now);
      break;
    case "heavy-wind":
      drawWindDebris(ctx, bounds, weather, now);
      break;
    case "light-fog":
    case "fog":
    case "heavy-fog":
      drawFogBanks(ctx, bounds, weather, now);
      break;
    case "ashfall":
      drawAshfall(ctx, bounds, weather, now);
      break;
    case "embers":
      drawEmbers(ctx, bounds, weather, now);
      break;
  }
  ctx.restore();
}

function getWeatherBounds(viewportWidth: number, viewportHeight: number, camera: Camera): WeatherBounds {
  const margin = Math.max(viewportWidth, viewportHeight) / Math.max(0.25, camera.zoom) * 0.2;
  const left = -camera.x / camera.zoom - margin;
  const top = -camera.y / camera.zoom - margin;
  return {
    left,
    top,
    width: viewportWidth / camera.zoom + margin * 2,
    height: viewportHeight / camera.zoom + margin * 2
  };
}

function drawRain(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number, densityBoost = 1) {
  const count = Math.round(PARTICLE_COUNTS[weather.effect] * weather.intensity * densityBoost);
  const angle = degreesToRadians(weather.directionDegrees);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const speed = 520 * weather.speed;
  const length = 22 + 28 * weather.intensity;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(185, 219, 255, 0.72)";
  ctx.lineWidth = weather.effect === "light-rain" ? 1.2 : weather.effect === "rain" ? 1.7 : 2.4;
  for (let index = 0; index < count; index += 1) {
    const seed = hash(index);
    const lane = hash(index + 1000);
    const drift = (now * 0.001 * speed + seed * bounds.height * 1.8) % (bounds.height * 1.8);
    const x = bounds.left + lane * bounds.width + dx * drift * 0.28;
    const y = bounds.top + drift - bounds.height * 0.4;
    ctx.beginPath();
    ctx.moveTo(wrap(x, bounds.left, bounds.width), wrap(y, bounds.top, bounds.height));
    ctx.lineTo(wrap(x - dx * length, bounds.left, bounds.width), wrap(y - dy * length, bounds.top, bounds.height));
    ctx.stroke();
  }
}

function drawSnow(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  const blizzard = weather.effect === "blizzard";
  const count = Math.round(PARTICLE_COUNTS[weather.effect] * weather.intensity);
  const angle = degreesToRadians(weather.directionDegrees);
  const windX = Math.cos(angle) * (blizzard ? 220 : 70) * weather.speed;
  const fallSpeed = (blizzard ? 180 : 70) * weather.speed;
  ctx.fillStyle = blizzard ? "rgba(242, 248, 255, 0.82)" : "rgba(250, 253, 255, 0.78)";
  for (let index = 0; index < count; index += 1) {
    const seed = hash(index);
    const size = blizzard ? 1.5 + seed * 3.5 : 1.8 + seed * 3;
    const x = bounds.left + wrap(hash(index + 42) * bounds.width + now * 0.001 * windX, 0, bounds.width);
    const y = bounds.top + wrap(hash(index + 88) * bounds.height + now * 0.001 * fallSpeed * (0.5 + seed), 0, bounds.height);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  if (blizzard) {
    drawDirectionalHaze(ctx, bounds, "rgba(210, 230, 245, 0.18)");
  }
}

function drawFogBanks(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  const count = Math.round(PARTICLE_COUNTS[weather.effect] * (0.6 + weather.intensity));
  const alpha = weather.effect === "light-fog" ? 0.08 : weather.effect === "fog" ? 0.13 : 0.2;
  for (let index = 0; index < count; index += 1) {
    drawSoftBlob(ctx, {
      x: bounds.left + wrap(hash(index + 7) * bounds.width + now * 0.012 * weather.speed * (index % 3 === 0 ? -1 : 1), 0, bounds.width),
      y: bounds.top + wrap(hash(index + 71) * bounds.height + now * 0.006 * weather.speed, 0, bounds.height),
      radiusX: bounds.width * (0.18 + hash(index + 12) * 0.18),
      radiusY: bounds.height * (0.06 + hash(index + 19) * 0.09),
      color: `rgba(210, 220, 225, ${alpha})`
    });
  }
}

function drawCloudShadows(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  const count = Math.round(PARTICLE_COUNTS["partly-cloudy"] * (0.7 + weather.intensity));
  for (let index = 0; index < count; index += 1) {
    drawSoftBlob(ctx, {
      x: bounds.left + wrap(hash(index + 33) * bounds.width + now * 0.015 * weather.speed, 0, bounds.width),
      y: bounds.top + wrap(hash(index + 99) * bounds.height + now * 0.007 * weather.speed, 0, bounds.height),
      radiusX: bounds.width * (0.08 + hash(index + 101) * 0.12),
      radiusY: bounds.height * (0.04 + hash(index + 202) * 0.06),
      color: "rgba(20, 27, 36, 0.18)"
    });
  }
}

function drawDustStorm(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  drawDirectionalHaze(ctx, bounds, "rgba(178, 132, 75, 0.2)");
  drawStreakParticles(ctx, bounds, weather, now, "rgba(214, 169, 100, 0.55)", 34, 2.4, PARTICLE_COUNTS["dust-storm"]);
}

function drawWindDebris(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  drawStreakParticles(ctx, bounds, weather, now, "rgba(150, 116, 58, 0.7)", 18, 3, PARTICLE_COUNTS["heavy-wind"]);
}

function drawAshfall(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  const count = Math.round(PARTICLE_COUNTS.ashfall * weather.intensity);
  ctx.fillStyle = "rgba(120, 126, 130, 0.52)";
  for (let index = 0; index < count; index += 1) {
    const seed = hash(index);
    const x = bounds.left + wrap(hash(index + 36) * bounds.width + now * 0.006 * weather.speed, 0, bounds.width);
    const y = bounds.top + wrap(hash(index + 63) * bounds.height + now * 0.018 * weather.speed * (0.5 + seed), 0, bounds.height);
    ctx.beginPath();
    ctx.arc(x, y, 1.4 + seed * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEmbers(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  const count = Math.round(PARTICLE_COUNTS.embers * weather.intensity);
  ctx.shadowColor = "rgba(255, 128, 40, 0.75)";
  ctx.shadowBlur = 8;
  for (let index = 0; index < count; index += 1) {
    const seed = hash(index);
    const x = bounds.left + wrap(hash(index + 17) * bounds.width + now * 0.018 * weather.speed, 0, bounds.width);
    const y = bounds.top + wrap(hash(index + 29) * bounds.height - now * 0.025 * weather.speed * (0.4 + seed), 0, bounds.height);
    ctx.fillStyle = `rgba(255, ${120 + Math.round(seed * 70)}, 48, ${0.45 + seed * 0.35})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + seed * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLightning(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number) {
  const cycle = Math.floor(now / 2200);
  const flashSeed = hash(cycle);
  const flashProgress = (now % 2200) / 2200;
  if (flashSeed < 0.62 || flashProgress > 0.12) {
    return;
  }
  const alpha = (1 - flashProgress / 0.12) * (0.35 + weather.intensity * 0.35);
  ctx.fillStyle = `rgba(230, 240, 255, ${alpha})`;
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
}

function drawStreakParticles(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number, color: string, length: number, width: number, baseCount: number) {
  const count = Math.round(baseCount * weather.intensity);
  const angle = degreesToRadians(weather.directionDegrees);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  for (let index = 0; index < count; index += 1) {
    const speed = (260 + hash(index) * 360) * weather.speed;
    const x = bounds.left + wrap(hash(index + 22) * bounds.width + now * 0.001 * speed * dx, 0, bounds.width);
    const y = bounds.top + wrap(hash(index + 44) * bounds.height + now * 0.001 * speed * dy, 0, bounds.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - dx * length, y - dy * length);
    ctx.stroke();
  }
}

function drawDirectionalHaze(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
}

function drawSoftBlob(ctx: CanvasRenderingContext2D, blob: { x: number; y: number; radiusX: number; radiusY: number; color: string }) {
  const radius = Math.max(blob.radiusX, blob.radiusY);
  ctx.save();
  ctx.translate(blob.x, blob.y);
  ctx.scale(blob.radiusX / radius, blob.radiusY / radius);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, blob.color);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function wrap(value: number, start: number, size: number): number {
  return ((((value - start) % size) + size) % size) + start;
}

function hash(value: number): number {
  const sine = Math.sin(value * 12.9898) * 43758.5453;
  return sine - Math.floor(sine);
}
