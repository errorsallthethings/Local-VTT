import * as THREE from "three";
import type { Camera } from "./camera";
import { getSourceHeight, getSourceWidth, resolveMapTransform } from "./mapRenderer";
import type { Scene, WeatherEffectType, WeatherMask, WeatherSettings } from "../../shared/localvtt";

type WeatherBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type WeatherArea = {
  clip: WeatherBounds;
  spawnPadding: number;
};

type RainStreak = {
  seed: number;
  baseX: number;
  baseY: number;
  centerFade: number;
  quietTravel: number | null;
  jitterRadius: number;
  depth: number;
  speed: number;
  length: number;
  opacity: number;
  drift: number;
};

type RainPreset = {
  density: number;
  opacity: number;
  speed: number;
  length: number;
  edgeBiasPower: number;
  quietDropChance: number;
  quietDropOpacity: number;
  stormFlash: boolean;
};

const RAIN_EFFECTS = new Set<WeatherEffectType>(["light-rain", "rain", "heavy-rain", "rain-storm"]);

const RAIN_PRESETS: Record<Exclude<WeatherEffectType, "none">, RainPreset> = {
  "light-rain": {
    density: 0.42,
    opacity: 0.62,
    speed: 0.82,
    length: 0.7,
    edgeBiasPower: 8.8,
    quietDropChance: 0.015,
    quietDropOpacity: 0.3,
    stormFlash: false
  },
  rain: {
    density: 0.72,
    opacity: 0.82,
    speed: 0.95,
    length: 0.86,
    edgeBiasPower: 7.8,
    quietDropChance: 0.025,
    quietDropOpacity: 0.38,
    stormFlash: false
  },
  "heavy-rain": {
    density: 1,
    opacity: 1,
    speed: 1,
    length: 1,
    edgeBiasPower: 7.2,
    quietDropChance: 0.035,
    quietDropOpacity: 0.45,
    stormFlash: false
  },
  "rain-storm": {
    density: 1.18,
    opacity: 1.08,
    speed: 1.16,
    length: 1.08,
    edgeBiasPower: 6.8,
    quietDropChance: 0.04,
    quietDropOpacity: 0.48,
    stormFlash: true
  }
};

class RainRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  private rain: THREE.LineSegments | null = null;
  private streaks: RainStreak[] = [];
  private signature = "";

  draw(ctx: CanvasRenderingContext2D, area: WeatherArea, weather: WeatherSettings, camera: Camera, now: number, opacity: number) {
    const bounds = area.clip;
    const preset = getRainPreset(weather.effect);
    const width = ctx.canvas.clientWidth || bounds.width;
    const height = ctx.canvas.clientHeight || bounds.height;
    const renderer = this.getRenderer(width, height);
    const signature = [
      weather.effect,
      Math.round(bounds.left),
      Math.round(bounds.top),
      Math.round(bounds.width),
      Math.round(bounds.height),
      Math.round(area.spawnPadding),
      weather.intensity.toFixed(2),
      weather.edgeBias.toFixed(2),
      weather.quietAreaSize.toFixed(2),
      weather.centerStrayDrops.toFixed(2),
      weather.quality
    ].join(":");
    if (signature !== this.signature) {
      this.signature = signature;
      this.rebuild(area, weather, preset);
    }

    this.update(bounds, weather, preset, now, opacity);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    ctx.save();
    ctx.clip(getWeatherClipPath(area.clip, weather.masks, camera), "evenodd");
    ctx.drawImage(renderer.domElement, 0, 0, width, height);
    if (preset.stormFlash) {
      drawStormFlash(ctx, area.clip, weather, now, opacity);
    }
    ctx.restore();
  }

  private getRenderer(width: number, height: number) {
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(1);
      this.camera.position.set(0, 0, 2400);
      this.camera.lookAt(0, 0, 0);
    }
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = height;
    this.camera.near = 0.1;
    this.camera.far = 5000;
    this.camera.updateProjectionMatrix();
    return this.renderer;
  }

  private rebuild(area: WeatherArea, weather: WeatherSettings, preset: RainPreset) {
    this.scene.clear();
    this.rain = null;
    const count = Math.round(1050 * preset.density * getQualityMultiplier(weather) * Math.max(0.1, weather.intensity));
    this.streaks = Array.from({ length: count }, (_, index) => createStreak(area.clip, area.spawnPadding, preset, weather, index));

    const material = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.48 * preset.opacity,
      depthWrite: false,
      depthTest: false,
      vertexColors: true,
      blending: THREE.NormalBlending
    });
    this.rain = new THREE.LineSegments(new THREE.BufferGeometry(), material);
    this.scene.add(this.rain);
  }

  private update(bounds: WeatherBounds, weather: WeatherSettings, preset: RainPreset, now: number, opacity: number) {
    if (!this.rain) {
      return;
    }
    const positions: number[] = [];
    const colors: number[] = [];
    const elapsed = now * 0.001;
    const color = new THREE.Color("#d9ecff");
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const directionDegrees = Number.isFinite(weather.directionDegrees) ? weather.directionDegrees : 0;
    const driftStrength = Number.isFinite(weather.driftStrength) ? Math.max(0, Math.min(1, weather.driftStrength)) : 0;
    const directionRadians = (directionDegrees * Math.PI) / 180;
    const windDistance = Math.min(bounds.width, bounds.height) * 0.1 * driftStrength;
    const windX = Math.cos(directionRadians) * windDistance;
    const windY = Math.sin(directionRadians) * windDistance;

    for (const streak of this.streaks) {
      const rawFallProgress = streak.depth + elapsed * streak.speed * weather.speed * preset.speed * 2.15;
      const cycle = Math.floor(rawFallProgress);
      const fallProgress = rawFallProgress - cycle;
      const cycleOffset = getCycleOffset(streak.seed, cycle, streak.jitterRadius);
      const anchorX = streak.baseX + cycleOffset.x;
      const anchorY = streak.baseY + cycleOffset.y;
      const cycleOpacity = 0.82 + hash(streak.seed + cycle * 19.73) * 0.36;
      const cycleLength = 0.84 + hash(streak.seed + cycle * 23.41) * 0.32;
      const cycleTravel = 0.9 + hash(streak.seed + cycle * 29.17) * 0.2;
      const fadeIn = smoothstep(0, 0.035, fallProgress);
      const fadeOut = 1 - smoothstep(0.82, 1, fallProgress);
      const fallAlpha = fadeIn * fadeOut;
      const toCenterX = centerX - anchorX;
      const toCenterY = centerY - anchorY;
      const distanceToCenter = Math.max(1, Math.hypot(toCenterX, toCenterY));
      const directionX = toCenterX / distanceToCenter;
      const directionY = toCenterY / distanceToCenter;
      const distanceToQuietArea = (streak.quietTravel ?? getDistanceToQuietArea(bounds, anchorX, anchorY, directionX, directionY, weather.quietAreaSize)) * cycleTravel;
      const travelProgress = Math.pow(fallProgress, 1.35);
      const travel = travelProgress * Math.max(0, distanceToQuietArea);
      const x = anchorX + directionX * travel;
      const y = anchorY + directionY * travel;
      const length = streak.length * cycleLength * preset.length * weather.streakLength * (1.05 + fallProgress * 1.7);
      const screenDrift = 16 + fallProgress * 34;
      const jitter = (streak.drift - 0.5) * 0.18;
      const cos = Math.cos(jitter);
      const sin = Math.sin(jitter);
      const driftX = (directionX * cos - directionY * sin) * screenDrift + windX * fallProgress;
      const driftY = (directionX * sin + directionY * cos) * screenDrift + windY * fallProgress;
      const alpha = opacity * weather.opacity * preset.opacity * streak.opacity * cycleOpacity * streak.centerFade * fallAlpha * (0.42 + fallProgress * 0.58);
      const nearZ = 1280 - fallProgress * 1180;
      const farZ = nearZ + length * 6.4;

      positions.push(x - driftX * 0.5, y - driftY * 0.5, nearZ);
      positions.push(x + driftX * 0.5, y + driftY * 0.5, farZ);
      colors.push(color.r * alpha, color.g * alpha, color.b * alpha);
      colors.push(color.r * alpha, color.g * alpha, color.b * alpha);
    }

    this.rain.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.rain.geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    this.rain.geometry.attributes.position.needsUpdate = true;
    this.rain.geometry.attributes.color.needsUpdate = true;
  }
}

function getWeatherClipPath(bounds: WeatherBounds, masks: WeatherMask[], camera: Camera): Path2D {
  const path = new Path2D();
  path.rect(bounds.left, bounds.top, bounds.width, bounds.height);
  for (const mask of masks) {
    if (mask.visible === false) {
      continue;
    }
    addWeatherMaskPath(path, mask, camera);
  }
  return path;
}

function addWeatherMaskPath(path: Path2D, mask: WeatherMask, camera: Camera) {
  if (mask.kind === "rectangle" && mask.points.length >= 2) {
    const start = worldToScreen(mask.points[0], camera);
    const end = worldToScreen(mask.points[1], camera);
    path.rect(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    return;
  }
  if (mask.kind === "circle" && mask.points[0] && mask.radius) {
    const center = worldToScreen(mask.points[0], camera);
    path.arc(center.x, center.y, mask.radius * camera.zoom, 0, Math.PI * 2);
    return;
  }
  if (mask.kind === "polygon" && mask.points.length >= 3) {
    const start = worldToScreen(mask.points[0], camera);
    path.moveTo(start.x, start.y);
    for (const point of mask.points.slice(1)) {
      const screenPoint = worldToScreen(point, camera);
      path.lineTo(screenPoint.x, screenPoint.y);
    }
    path.closePath();
  }
}

function worldToScreen(point: { x: number; y: number }, camera: Camera) {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y
  };
}

const rainRenderer = new RainRenderer();

export function shouldAnimateWeather(scene: Scene, visible: boolean): boolean {
  return visible && scene.weather.enabled && RAIN_EFFECTS.has(scene.weather.effect);
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
  if (!weather.enabled || !RAIN_EFFECTS.has(weather.effect) || layerOpacity <= 0 || weather.opacity <= 0) {
    return;
  }
  const area = getScreenWeatherArea(scene, viewportWidth, viewportHeight, camera, mapSource);
  const opacity = Math.max(0, Math.min(1, layerOpacity));
  rainRenderer.draw(ctx, area, weather, camera, now, opacity);
}

function createStreak(bounds: WeatherBounds, spawnPadding: number, preset: RainPreset, weather: WeatherSettings, index: number): RainStreak {
  const quietDropChance = 0.005 + weather.centerStrayDrops * 0.09;
  const quietDrop = hash(index + 91) > 1 - quietDropChance;
  const point = quietDrop ? getQuietAreaPoint(bounds, index, weather.quietAreaSize) : getEdgePoint(bounds, spawnPadding, getEdgeBiasPower(weather, preset), index);
  const depth = hash(index + 30);
  return {
    seed: index + hash(index + 7) * 1000,
    baseX: point.x,
    baseY: point.y,
    centerFade: quietDrop ? getEdgeFade(bounds, point, weather.quietAreaSize) * preset.quietDropOpacity : getEdgeFade(bounds, point, weather.quietAreaSize),
    quietTravel: quietDrop ? Math.min(bounds.width, bounds.height) * (0.015 + hash(index + 92) * 0.035) : null,
    jitterRadius: Math.min(bounds.width, bounds.height) * (quietDrop ? 0.008 : 0.018),
    depth,
    speed: 1.1 + hash(index + 40) * 2.1,
    length: 18 + hash(index + 50) * 42,
    opacity: 0.2 + hash(index + 70) * 0.38,
    drift: hash(index + 80)
  };
}

function getEdgeFade(bounds: WeatherBounds, point: { x: number; y: number }, quietAreaSize: number): number {
  const distanceToEdge = Math.min(
    Math.abs(point.x - bounds.left),
    Math.abs(bounds.left + bounds.width - point.x),
    Math.abs(point.y - bounds.top),
    Math.abs(bounds.top + bounds.height - point.y)
  );
  const fadeRange = Math.min(bounds.width, bounds.height) * Math.max(0.08, (1 - quietAreaSize) * 1.3);
  const edgeProgress = Math.max(0, Math.min(1, distanceToEdge / fadeRange));
  return 1 - smoothstep(0.05, 0.78, edgeProgress) * 0.88;
}

function getDistanceToQuietArea(bounds: WeatherBounds, x: number, y: number, directionX: number, directionY: number, quietAreaSize: number): number {
  const { left: quietLeft, right: quietRight, top: quietTop, bottom: quietBottom } = getQuietAreaBounds(bounds, quietAreaSize);

  if (x >= quietLeft && x <= quietRight && y >= quietTop && y <= quietBottom) {
    return 0;
  }

  const candidates: number[] = [];
  if (directionX !== 0) {
    candidates.push((quietLeft - x) / directionX, (quietRight - x) / directionX);
  }
  if (directionY !== 0) {
    candidates.push((quietTop - y) / directionY, (quietBottom - y) / directionY);
  }

  const distance = candidates
    .filter((candidate) => {
      if (!Number.isFinite(candidate) || candidate <= 0) {
        return false;
      }
      const candidateX = x + directionX * candidate;
      const candidateY = y + directionY * candidate;
      return candidateX >= quietLeft - 1 && candidateX <= quietRight + 1 && candidateY >= quietTop - 1 && candidateY <= quietBottom + 1;
    })
    .sort((a, b) => a - b)[0];

  return distance ?? 0;
}

function getQuietAreaBounds(bounds: WeatherBounds, quietAreaSize: number) {
  const size = Math.max(0.35, Math.min(0.9, quietAreaSize));
  const width = bounds.width * size;
  const height = bounds.height * size;
  const left = bounds.left + (bounds.width - width) / 2;
  const top = bounds.top + (bounds.height - height) / 2;
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height
  };
}

function getScreenWeatherArea(scene: Scene, viewportWidth: number, viewportHeight: number, camera: Camera, mapSource?: CanvasImageSource | null): WeatherArea {
  if (mapSource) {
    const sourceWidth = getSourceWidth(mapSource);
    const sourceHeight = getSourceHeight(mapSource);
    if (sourceWidth > 0 && sourceHeight > 0) {
      const transform = resolveMapTransform(scene, sourceWidth, sourceHeight, viewportWidth, viewportHeight);
      const left = camera.x + transform.x * camera.zoom;
      const top = camera.y + transform.y * camera.zoom;
      const width = sourceWidth * transform.scale * camera.zoom;
      const height = sourceHeight * transform.scale * camera.zoom;
      const padding = Math.min(width, height) * 0.16;
      return {
        clip: { left, top, width, height },
        spawnPadding: padding
      };
    }
  }
  return {
    clip: { left: 0, top: 0, width: viewportWidth, height: viewportHeight },
    spawnPadding: Math.min(viewportWidth, viewportHeight) * 0.12
  };
}

function getEdgePoint(bounds: WeatherBounds, spawnPadding: number, edgeBiasPower: number, index: number): { x: number; y: number } {
  const side = Math.floor(hash(index + 2) * 4);
  const edgeBand = spawnPadding * 1.12;
  const inwardBias = Math.pow(hash(index + 3), edgeBiasPower);
  const outsideNudge = hash(index + 6) * spawnPadding * 0.035;
  const edgeOffset = inwardBias * edgeBand - outsideNudge;
  const alongX = bounds.left - edgeBand * 0.18 + hash(index + 4) * (bounds.width + edgeBand * 0.36);
  const alongY = bounds.top - edgeBand * 0.18 + hash(index + 5) * (bounds.height + edgeBand * 0.36);
  switch (side) {
    case 0:
      return { x: alongX, y: bounds.top + edgeOffset };
    case 1:
      return { x: bounds.left + bounds.width - edgeOffset, y: alongY };
    case 2:
      return { x: alongX, y: bounds.top + bounds.height - edgeOffset };
    default:
      return { x: bounds.left + edgeOffset, y: alongY };
  }
}

function getQuietAreaPoint(bounds: WeatherBounds, index: number, quietAreaSize: number): { x: number; y: number } {
  const quiet = getQuietAreaBounds(bounds, quietAreaSize);
  const side = Math.floor(hash(index + 93) * 4);
  const inset = Math.min(bounds.width, bounds.height) * (0.015 + hash(index + 94) * 0.055);
  switch (side) {
    case 0:
      return { x: quiet.left + hash(index + 95) * quiet.width, y: quiet.top + inset };
    case 1:
      return { x: quiet.right - inset, y: quiet.top + hash(index + 96) * quiet.height };
    case 2:
      return { x: quiet.left + hash(index + 97) * quiet.width, y: quiet.bottom - inset };
    default:
      return { x: quiet.left + inset, y: quiet.top + hash(index + 98) * quiet.height };
  }
}

function getRainPreset(effect: WeatherEffectType): RainPreset {
  return effect === "none" ? RAIN_PRESETS["heavy-rain"] : RAIN_PRESETS[effect];
}

function drawStormFlash(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number, opacity: number) {
  if (weather.lightningFrequency <= 0 || weather.flashStrength <= 0) {
    return;
  }
  const seconds = now * 0.001;
  const cycle = 9.5 - weather.lightningFrequency * 5.5;
  const phase = seconds % cycle;
  const burstSeed = Math.floor(seconds / cycle);
  const shouldFlash = hash(burstSeed + 501) > 1 - weather.lightningFrequency;
  if (!shouldFlash || phase > 0.32) {
    return;
  }

  const firstPulse = 1 - smoothstep(0, 0.11, phase);
  const secondPulse = phase > 0.16 ? 1 - smoothstep(0.16, 0.32, phase) : 0;
  const alpha = Math.max(firstPulse, secondPulse * 0.58) * weather.opacity * opacity * weather.flashStrength;
  if (alpha <= 0) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(215, 231, 255, ${alpha})`;
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
  ctx.restore();
}

function getEdgeBiasPower(weather: WeatherSettings, preset: RainPreset): number {
  return Math.max(1.5, preset.edgeBiasPower * (0.45 + weather.edgeBias * 1.1));
}

function getQualityMultiplier(weather: WeatherSettings): number {
  switch (weather.quality) {
    case "low":
      return 0.62;
    case "high":
      return 1.38;
    default:
      return 1;
  }
}

function getCycleOffset(seed: number, cycle: number, radius: number): { x: number; y: number } {
  const angle = hash(seed + cycle * 11.31) * Math.PI * 2;
  const distance = Math.sqrt(hash(seed + cycle * 13.97)) * radius;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function hash(value: number): number {
  const sine = Math.sin(value * 12.9898) * 43758.5453;
  return sine - Math.floor(sine);
}
