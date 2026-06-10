import * as THREE from "three";
import type { Camera } from "./camera";
import { getSourceHeight, getSourceWidth, resolveMapTransform } from "./mapRenderer";
import type { FogWeatherEffectType, RainWeatherEffectType, Scene, SnowWeatherEffectType, WeatherEffectType, WeatherMask, WeatherSettings } from "../../shared/localvtt";

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

type SnowParticle = {
  seed: number;
  baseX: number;
  baseY: number;
  centerFade: number;
  quietTravel: number | null;
  jitterRadius: number;
  speed: number;
  size: number;
  phase: number;
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

type FogPreset = {
  bankCount: number;
  opacity: number;
  scale: number;
  baseHaze: number;
};

type SnowPreset = {
  density: number;
  opacity: number;
  speed: number;
  size: number;
  streak: number;
  frost: number;
};

const FOG_EFFECTS = new Set<WeatherEffectType>(["light-fog", "fog", "heavy-fog"]);

const RAIN_PRESETS: Record<RainWeatherEffectType, RainPreset> = {
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

const FOG_PRESETS: Record<FogWeatherEffectType, FogPreset> = {
  "light-fog": {
    bankCount: 14,
    opacity: 0.9,
    scale: 1.06,
    baseHaze: 0.18
  },
  fog: {
    bankCount: 18,
    opacity: 0.92,
    scale: 1.14,
    baseHaze: 0.22
  },
  "heavy-fog": {
    bankCount: 26,
    opacity: 1.08,
    scale: 1.34,
    baseHaze: 0.34
  }
};

const SNOW_PRESETS: Record<SnowWeatherEffectType, SnowPreset> = {
  "light-snow": {
    density: 2.62,
    opacity: 1.08,
    speed: 1.28,
    size: 0.98,
    streak: 0.76,
    frost: 0.55
  },
  snow: {
    density: 3.55,
    opacity: 1.16,
    speed: 1.42,
    size: 0.98,
    streak: 0.86,
    frost: 0.78
  },
  blizzard: {
    density: 4.85,
    opacity: 1.28,
    speed: 1.62,
    size: 0.98,
    streak: 0.98,
    frost: 1
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
    const preset = getRainPreset(weather.effect as RainWeatherEffectType);
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
    const windX = Math.cos(directionRadians);
    const windY = Math.sin(directionRadians);
    const maxWindDistance = Math.min(bounds.width, bounds.height) * 0.5 * driftStrength;

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
      const windDistance = maxWindDistance * Math.pow(fallProgress, 1.04) * (0.72 + hash(streak.seed + 746) * 0.48);
      const x = anchorX + directionX * travel + windX * windDistance;
      const y = anchorY + directionY * travel + windY * windDistance;
      const length = streak.length * cycleLength * preset.length * weather.streakLength * (1.05 + fallProgress * 1.7);
      const screenDrift = 16 + fallProgress * 34;
      const jitter = (streak.drift - 0.5) * 0.18;
      const cos = Math.cos(jitter);
      const sin = Math.sin(jitter);
      const driftX = (directionX * cos - directionY * sin) * screenDrift;
      const driftY = (directionX * sin + directionY * cos) * screenDrift;
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

class SnowRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  private frost: THREE.Group | null = null;
  private snow: THREE.Points | null = null;
  private particles: SnowParticle[] = [];
  private signature = "";

  draw(ctx: CanvasRenderingContext2D, area: WeatherArea, weather: WeatherSettings, camera: Camera, now: number, opacity: number) {
    if (!isSnowEffect(weather.effect)) {
      return;
    }
    const bounds = area.clip;
    const preset = SNOW_PRESETS[weather.effect];
    const width = ctx.canvas.clientWidth || bounds.width;
    const height = ctx.canvas.clientHeight || bounds.height;
    const renderer = this.getRenderer(width, height);
    const signature = [
      weather.effect,
      Math.round(bounds.left),
      Math.round(bounds.top),
      Math.round(bounds.width),
      Math.round(bounds.height),
      weather.intensity.toFixed(2),
      weather.edgeBias.toFixed(2),
      weather.quietAreaSize.toFixed(2),
      weather.centerStrayDrops.toFixed(2),
      weather.streakLength.toFixed(2),
      weather.quality
    ].join(":");
    if (signature !== this.signature) {
      this.signature = signature;
      this.rebuild(bounds, weather, preset);
    }

    this.update(bounds, weather, preset, now, opacity);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    ctx.save();
    ctx.clip(getWeatherClipPath(area.clip, weather.masks, camera), "evenodd");
    ctx.drawImage(renderer.domElement, 0, 0, width, height);
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

  private rebuild(bounds: WeatherBounds, weather: WeatherSettings, preset: SnowPreset) {
    this.scene.clear();
    this.frost = null;
    this.snow = null;
    const count = Math.round(560 * preset.density * getQualityMultiplier(weather) * Math.max(0.1, weather.intensity));
    this.particles = Array.from({ length: count }, (_, index) => createSnowParticle(bounds, weather, preset, index));
    this.frost = createFrostEdgeMesh(bounds);
    this.frost.renderOrder = 0;
    this.scene.add(this.frost);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      vertexColors: true,
      blending: THREE.NormalBlending,
      uniforms: {
        globalOpacity: { value: 0.92 * preset.opacity * weather.opacity }
      },
      vertexShader: `
        attribute float particleSize;
        attribute float particleAlpha;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vAlpha = particleAlpha;
          gl_PointSize = particleSize;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float globalOpacity;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float distanceFromCenter = length(center);
          float softCircle = 1.0 - smoothstep(0.28, 0.5, distanceFromCenter);
          if (softCircle <= 0.0) {
            discard;
          }
          gl_FragColor = vec4(vColor, softCircle * vAlpha * globalOpacity);
        }
      `
    });
    this.snow = new THREE.Points(new THREE.BufferGeometry(), material);
    this.snow.renderOrder = 1;
    this.scene.add(this.snow);
  }

  private update(bounds: WeatherBounds, weather: WeatherSettings, preset: SnowPreset, now: number, layerOpacity: number) {
    if (!this.snow) {
      return;
    }
    updateFrostEdgeMesh(this.frost, weather, preset, now, layerOpacity);
    const material = this.snow.material;
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.globalOpacity.value = 0.92 * preset.opacity * weather.opacity * layerOpacity;
    }
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const alphas: number[] = [];
    const elapsed = now * 0.001 * weather.speed * preset.speed;
    const driftRadians = (weather.directionDegrees * Math.PI) / 180;
    const driftStrength = Math.max(0, Math.min(1, weather.driftStrength));
    const driftX = Math.cos(driftRadians);
    const driftY = Math.sin(driftRadians);
    const maxDriftDistance = Math.min(bounds.width, bounds.height) * 0.5 * driftStrength;
    const color = new THREE.Color("#eff7ff");
    const quietBounds = getQuietAreaBounds(bounds, weather.quietAreaSize);
    const centerX = quietBounds.left + quietBounds.width / 2;
    const centerY = quietBounds.top + quietBounds.height / 2;

    for (const particle of this.particles) {
      const rawFallProgress = particle.phase + elapsed * particle.speed * (1.1 + preset.streak * 0.82);
      const cycle = Math.floor(rawFallProgress);
      const fallProgress = rawFallProgress - cycle;
      const cycleOffset = getCycleOffset(particle.seed, cycle, particle.jitterRadius);
      const anchorX = particle.baseX + cycleOffset.x;
      const anchorY = particle.baseY + cycleOffset.y;
      const toCenterX = centerX - anchorX;
      const toCenterY = centerY - anchorY;
      const distanceToCenter = Math.max(1, Math.hypot(toCenterX, toCenterY));
      const directionX = toCenterX / distanceToCenter;
      const directionY = toCenterY / distanceToCenter;
      const distanceToQuietArea = particle.quietTravel ?? getDistanceToQuietArea(bounds, anchorX, anchorY, directionX, directionY, weather.quietAreaSize);
      const travel = Math.max(0, distanceToQuietArea) * Math.pow(fallProgress, 1.14);
      const wave = Math.sin(elapsed * (1.75 + hash(particle.seed + 730) * 1.25) + particle.phase * Math.PI * 2);
      const secondaryWave = Math.cos(elapsed * (0.65 + hash(particle.seed + 735) * 0.8) + particle.drift * Math.PI * 2);
      const crossX = -directionY;
      const crossY = directionX;
      const lateralDistance = Math.min(bounds.width, bounds.height) * (0.018 + preset.streak * 0.018 + driftStrength * 0.018) * wave;
      const swayDistance = Math.min(bounds.width, bounds.height) * 0.012 * driftStrength * secondaryWave;
      const driftDistance = maxDriftDistance * Math.pow(fallProgress, 1.04) * (0.72 + hash(particle.seed + 746) * 0.48);
      const x = anchorX + directionX * travel + driftX * driftDistance + crossX * (lateralDistance + swayDistance);
      const y = anchorY + directionY * travel + driftY * driftDistance + crossY * (lateralDistance + swayDistance);
      const fadeIn = smoothstep(0, 0.06, fallProgress);
      const fadeOut = 1 - smoothstep(0.82, 1, fallProgress);
      const depthScale = 1.24 - fallProgress * 0.46;
      const alpha = (0.46 + hash(particle.seed + 750) * 0.36) * particle.centerFade * fadeIn * fadeOut * (0.9 - fallProgress * 0.24);
      const size = Math.max(1.4, 3.2 * preset.size * weather.streakLength * particle.size * depthScale);
      const z = 1260 - fallProgress * 1160;
      positions.push(x, y, z);
      colors.push(color.r, color.g, color.b);
      sizes.push(size);
      alphas.push(alpha);
    }

    this.snow.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.snow.geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    this.snow.geometry.setAttribute("particleSize", new THREE.Float32BufferAttribute(sizes, 1));
    this.snow.geometry.setAttribute("particleAlpha", new THREE.Float32BufferAttribute(alphas, 1));
    this.snow.geometry.attributes.position.needsUpdate = true;
    this.snow.geometry.attributes.color.needsUpdate = true;
    this.snow.geometry.attributes.particleSize.needsUpdate = true;
    this.snow.geometry.attributes.particleAlpha.needsUpdate = true;
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
const snowRenderer = new SnowRenderer();

export function shouldAnimateWeather(scene: Scene, visible: boolean): boolean {
  return visible && scene.weather.enabled && (scene.weather.effects.rain.enabled || scene.weather.effects.fog.enabled || scene.weather.effects.snow.enabled);
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
  if (!weather.enabled || layerOpacity <= 0 || weather.opacity <= 0) {
    return;
  }
  const area = getScreenWeatherArea(scene, viewportWidth, viewportHeight, camera, mapSource);
  const opacity = Math.max(0, Math.min(1, layerOpacity));
  if (weather.effects.rain.enabled) {
    rainRenderer.draw(ctx, area, getWeatherForRain(scene.weather), camera, now, opacity);
  }
  if (weather.effects.fog.enabled) {
    drawFogWeather(ctx, area, getWeatherForFog(scene.weather), camera, now, opacity);
  }
  if (weather.effects.snow.enabled) {
    drawSnowWeather(ctx, area, getWeatherForSnow(scene.weather), camera, now, opacity);
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

function drawFogWeather(ctx: CanvasRenderingContext2D, area: WeatherArea, weather: WeatherSettings, camera: Camera, now: number, layerOpacity: number) {
  if (!isFogEffect(weather.effect)) {
    return;
  }
  const bounds = area.clip;
  const preset = FOG_PRESETS[weather.effect];
  const opacity = weather.opacity * layerOpacity * preset.opacity;
  const count = Math.round(preset.bankCount * getQualityMultiplier(weather) * (0.65 + weather.intensity));
  const driftRadians = (weather.directionDegrees * Math.PI) / 180;
  const driftDistance = Math.min(bounds.width, bounds.height) * weather.driftStrength * 0.16;
  const driftX = Math.cos(driftRadians) * driftDistance;
  const driftY = Math.sin(driftRadians) * driftDistance;
  const elapsed = now * 0.001 * weather.speed;

  ctx.save();
  ctx.clip(getWeatherClipPath(area.clip, weather.masks, camera), "evenodd");
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(184, 196, 206, ${preset.baseHaze * opacity * weather.intensity})`;
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);

  for (let index = 0; index < count; index += 1) {
    const point = getFogBankPoint(bounds, weather, index);
    const phase = elapsed * (0.16 + hash(index + 211) * 0.34) + hash(index + 219) * Math.PI * 2;
    const radiusX = bounds.width * (0.18 + hash(index + 221) * 0.22) * preset.scale * weather.streakLength;
    const radiusY = bounds.height * (0.08 + hash(index + 223) * 0.12) * preset.scale * weather.streakLength;
    const flow = getFogFlowOffset(bounds, weather, elapsed, index);
    const wobbleX = Math.cos(phase) * bounds.width * 0.025 + driftX * Math.sin(phase * 0.7);
    const wobbleY = Math.sin(phase * 0.82) * bounds.height * 0.018 + driftY * Math.cos(phase * 0.6);
    const alpha = opacity * (0.07 + hash(index + 227) * 0.11) * (0.65 + weather.intensity * 0.55);
    drawLoopedFogBank(ctx, bounds, point.x + wobbleX, point.y + wobbleY, flow, radiusX, radiusY, alpha);
  }

  ctx.restore();
}

function drawSnowWeather(ctx: CanvasRenderingContext2D, area: WeatherArea, weather: WeatherSettings, camera: Camera, now: number, layerOpacity: number) {
  snowRenderer.draw(ctx, area, weather, camera, now, layerOpacity);
}

function createFrostEdgeMesh(bounds: WeatherBounds): THREE.Group {
  const frost = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(bounds.width, bounds.height);
  geometry.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 900);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      frostOpacity: { value: 0 },
      time: { value: 0 },
      aspect: { value: bounds.width / Math.max(1, bounds.height) }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float frostOpacity;
      uniform float time;
      uniform float aspect;
      varying vec2 vUv;

      float hash(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
      }

      vec2 hash2(vec2 point) {
        return fract(sin(vec2(dot(point, vec2(127.1, 311.7)), dot(point, vec2(269.5, 183.3)))) * 43758.5453123);
      }

      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 local = fract(point);
        vec2 curve = local * local * (3.0 - 2.0 * local);
        float a = hash(cell);
        float b = hash(cell + vec2(1.0, 0.0));
        float c = hash(cell + vec2(0.0, 1.0));
        float d = hash(cell + vec2(1.0, 1.0));
        return mix(mix(a, b, curve.x), mix(c, d, curve.x), curve.y);
      }

      float fbm(vec2 point) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int octave = 0; octave < 4; octave++) {
          value += noise(point) * amplitude;
          point = point * 2.08 + vec2(17.3, 9.1);
          amplitude *= 0.5;
        }
        return value;
      }

      float lineDistance(vec2 point, vec2 direction) {
        return abs(point.x * direction.y - point.y * direction.x);
      }

      float iceShardField(vec2 point) {
        vec2 grid = point * vec2(8.0, 7.0);
        vec2 cell = floor(grid);
        vec2 local = fract(grid);
        float nearest = 10.0;
        float secondNearest = 10.0;
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 feature = neighbor + hash2(cell + neighbor) * 0.72 + 0.14;
            float distanceToFeature = length(local - feature);
            if (distanceToFeature < nearest) {
              secondNearest = nearest;
              nearest = distanceToFeature;
            } else if (distanceToFeature < secondNearest) {
              secondNearest = distanceToFeature;
            }
          }
        }
        float border = secondNearest - nearest;
        return 1.0 - smoothstep(0.006, 0.032, border);
      }

      float warpedVoronoiCracks(vec2 point, float edgeMask) {
        vec2 warp = vec2(fbm(point * 5.4 + vec2(13.2, 4.7)), fbm(point * 5.4 + vec2(41.1, 29.8))) - 0.5;
        vec2 warped = point + warp * 0.09;
        float fine = pow(iceShardField(warped * 1.35 + vec2(1.7, 3.2)), 3.4);
        float broad = pow(iceShardField(warped * 0.72 + vec2(8.4, 2.6)), 3.0);
        float edgeGate = smoothstep(0.48, 0.82, fbm(point * 4.2 + vec2(9.2, 14.6)));
        return (fine * 0.72 + broad * 0.42) * edgeMask * edgeGate;
      }

      void main() {
        vec2 centeredUv = vec2((vUv.x - 0.5) * aspect + 0.5, vUv.y);
        float edgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float unevenEdge = fbm(centeredUv * 7.5 + vec2(3.7, 11.2)) * 0.08;
        float edgeMask = 1.0 - smoothstep(0.0, 0.16 + unevenEdge, edgeDistance);
        float deepEdge = 1.0 - smoothstep(0.0, 0.075 + unevenEdge * 0.55, edgeDistance);
        float interiorFade = 1.0 - smoothstep(0.018, 0.072 + unevenEdge * 0.24, edgeDistance);
        float patchMask = smoothstep(0.34, 0.76, fbm(centeredUv * 5.4 + vec2(time * 0.004, -time * 0.003)));
        float creepMask = edgeMask * (0.35 + patchMask * 0.65);
        float cloudyFrost = fbm(centeredUv * 12.0 + vec2(time * 0.006, -time * 0.004));
        float powderGrain = fbm(centeredUv * 54.0 - vec2(time * 0.01, time * 0.007));
        float crackCore = warpedVoronoiCracks(centeredUv + vec2(cloudyFrost * 0.035, powderGrain * 0.02), interiorFade);
        float crackShadow = warpedVoronoiCracks(centeredUv + vec2(cloudyFrost * 0.035 + 0.0022, powderGrain * 0.02 + 0.0015), interiorFade);
        float crackDepth = max(0.0, crackShadow - crackCore * 0.55);
        float broadSheets = smoothstep(0.58, 0.94, fbm(centeredUv * 5.2 + vec2(3.4, 9.7))) * creepMask;
        float cloudyEdge = creepMask * (0.18 + cloudyFrost * 0.25 + powderGrain * 0.12);
        float whiteBuildup = deepEdge * (0.22 + cloudyFrost * 0.3) * (0.5 + patchMask * 0.5);
        float alpha = (cloudyEdge + whiteBuildup + broadSheets * 0.2 + crackCore * 0.68 + crackDepth * 0.34) * frostOpacity;
        vec3 glassBlue = vec3(0.45, 0.76, 0.95);
        vec3 frostedWhite = vec3(0.94, 0.99, 1.0);
        vec3 shadowBlue = vec3(0.22, 0.5, 0.72);
        vec3 frostColor = mix(glassBlue, frostedWhite, clamp(whiteBuildup + crackCore * 1.15 + powderGrain * 0.2, 0.0, 1.0));
        vec3 color = mix(frostColor, shadowBlue, clamp(crackDepth * 0.42, 0.0, 0.4));
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.frustumCulled = false;
  frost.add(plane);

  const edgeMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#d8f6ff"),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending
  });
  const edgeWidth = Math.min(bounds.width, bounds.height) * 0.035;
  const edgeSpecs = [
    { x: bounds.left + bounds.width / 2, y: bounds.top + edgeWidth / 2, width: bounds.width, height: edgeWidth },
    { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height - edgeWidth / 2, width: bounds.width, height: edgeWidth },
    { x: bounds.left + edgeWidth / 2, y: bounds.top + bounds.height / 2, width: edgeWidth, height: bounds.height },
    { x: bounds.left + bounds.width - edgeWidth / 2, y: bounds.top + bounds.height / 2, width: edgeWidth, height: bounds.height }
  ];
  for (const spec of edgeSpecs) {
    const edgeGeometry = new THREE.PlaneGeometry(spec.width, spec.height);
    edgeGeometry.translate(spec.x, spec.y, 920);
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial.clone());
    edge.frustumCulled = false;
    frost.add(edge);
  }

  frost.frustumCulled = false;
  return frost;
}

function updateFrostEdgeMesh(mesh: THREE.Group | null, weather: WeatherSettings, preset: SnowPreset, now: number, layerOpacity: number) {
  if (!mesh) {
    return;
  }
  const patternOpacity = preset.frost * weather.opacity * weather.intensity * layerOpacity;
  const opacity = Math.max(0, Math.min(1, patternOpacity));
  for (const child of mesh.children) {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
      child.material.uniforms.frostOpacity.value = opacity;
      child.material.uniforms.time.value = now * 0.001 * Math.max(0.25, weather.speed);
    }
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
      child.material.opacity = 0;
    }
  }
}

function createSnowParticle(bounds: WeatherBounds, weather: WeatherSettings, preset: SnowPreset, index: number): SnowParticle {
  const quietDropChance = 0.005 + weather.centerStrayDrops * 0.08;
  const quietDrop = hash(index + 681) > 1 - quietDropChance;
  const point = quietDrop
    ? getQuietAreaPoint(bounds, index + 682, weather.quietAreaSize)
    : getEdgePoint(bounds, Math.min(bounds.width, bounds.height) * 0.12, 2 + weather.edgeBias * 3, index + 690);
  return {
    seed: index + hash(index + 701) * 1000,
    baseX: point.x,
    baseY: point.y,
    centerFade: quietDrop ? getEdgeFade(bounds, point, weather.quietAreaSize) * 0.42 : 0.42 + getEdgeFade(bounds, point, weather.quietAreaSize) * 0.58,
    quietTravel: quietDrop ? Math.min(bounds.width, bounds.height) * (0.01 + hash(index + 692) * 0.03) : null,
    jitterRadius: Math.min(bounds.width, bounds.height) * (quietDrop ? 0.008 : 0.018),
    speed: 0.16 + hash(index + 710) * 0.34,
    size: 0.72 + hash(index + 760) * 0.46,
    phase: hash(index + 720),
    drift: hash(index + 770)
  };
}

function getFogFlowOffset(
  bounds: WeatherBounds,
  weather: WeatherSettings,
  elapsed: number,
  index: number
): { x: number; y: number; progress: number; flowDistance: number; directionX: number; directionY: number } {
  const driftRadians = (weather.directionDegrees * Math.PI) / 180;
  const driftStrength = Math.max(0.12, weather.driftStrength);
  const flowDistance = Math.hypot(bounds.width, bounds.height) * (0.18 + driftStrength * 0.34);
  const speed = 0.018 + weather.speed * (0.055 + hash(index + 261) * 0.045);
  const progress = (hash(index + 263) + elapsed * speed) % 1;
  const centeredProgress = progress - 0.5;
  const directionX = Math.cos(driftRadians);
  const directionY = Math.sin(driftRadians);
  const crossX = -directionY;
  const crossY = directionX;
  const crossWave = Math.sin(elapsed * (0.22 + hash(index + 267) * 0.28) + hash(index + 269) * Math.PI * 2);
  const crossDistance = Math.min(bounds.width, bounds.height) * 0.045 * crossWave;
  return {
    x: directionX * flowDistance * centeredProgress + crossX * crossDistance,
    y: directionY * flowDistance * centeredProgress + crossY * crossDistance,
    progress,
    flowDistance,
    directionX,
    directionY
  };
}

function drawLoopedFogBank(
  ctx: CanvasRenderingContext2D,
  bounds: WeatherBounds,
  baseX: number,
  baseY: number,
  flow: { x: number; y: number; progress: number; flowDistance: number; directionX: number; directionY: number },
  radiusX: number,
  radiusY: number,
  alpha: number
) {
  const fadeOut = 1 - smoothstep(0.76, 1, flow.progress);
  const fadeIn = smoothstep(0, 0.24, flow.progress);
  const travelX = flow.directionX * flow.flowDistance;
  const travelY = flow.directionY * flow.flowDistance;
  drawFogBank(ctx, baseX + flow.x, baseY + flow.y, radiusX, radiusY, alpha * fadeOut);
  drawFogBank(ctx, baseX + flow.x - travelX, baseY + flow.y - travelY, radiusX, radiusY, alpha * fadeIn);
}

function getFogBankPoint(bounds: WeatherBounds, weather: WeatherSettings, index: number): { x: number; y: number } {
  const edgeChance = weather.edgeBias * 0.72;
  if (hash(index + 231) < edgeChance) {
    return getEdgePoint(bounds, Math.min(bounds.width, bounds.height) * 0.16, 2 + weather.edgeBias * 5, index + 239);
  }
  const quiet = getQuietAreaBounds(bounds, weather.quietAreaSize);
  const useQuietArea = hash(index + 233) < weather.centerStrayDrops;
  const activeBounds = useQuietArea ? quiet : bounds;
  return {
    x: activeBounds.left + hash(index + 241) * activeBounds.width,
    y: activeBounds.top + hash(index + 251) * activeBounds.height
  };
}

function drawFogBank(ctx: CanvasRenderingContext2D, x: number, y: number, radiusX: number, radiusY: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radiusX, radiusY);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, `rgba(220, 228, 234, ${alpha})`);
  gradient.addColorStop(0.46, `rgba(205, 215, 223, ${alpha * 0.55})`);
  gradient.addColorStop(1, "rgba(205, 215, 223, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getRainPreset(effect: RainWeatherEffectType): RainPreset {
  return RAIN_PRESETS[effect];
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

function isFogEffect(effect: WeatherEffectType): effect is FogWeatherEffectType {
  return FOG_EFFECTS.has(effect);
}

function isSnowEffect(effect: WeatherEffectType): effect is SnowWeatherEffectType {
  return effect === "light-snow" || effect === "snow" || effect === "blizzard";
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
