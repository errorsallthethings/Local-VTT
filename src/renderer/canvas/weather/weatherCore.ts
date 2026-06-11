import * as THREE from "three";
import type { Camera } from "../camera";
import { getSourceHeight, getSourceWidth, resolveMapTransform } from "../mapRenderer";
import type { FogWeatherEffectType, RainWeatherEffectType, SandWeatherEffectType, Scene, SnowWeatherEffectType, WeatherEffectType, WeatherMask, WeatherSettings } from "../../../shared/localvtt";

export type WeatherBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type WeatherArea = {
  clip: WeatherBounds;
  spawnPadding: number;
};

export type RainStreak = {
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

export type FogBank = {
  seed: number;
  groupSeed: number;
  textureIndex: number;
  baseX: number;
  baseY: number;
  localX: number;
  localY: number;
  radiusX: number;
  radiusY: number;
  alpha: number;
  speed: number;
  groupSpeed: number;
  rotation: number;
  phase: number;
  groupPhase: number;
  flowDistance: number;
  drift: number;
  localDrift: number;
};

export type SnowParticle = {
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

export type SandParticle = {
  seed: number;
  baseX: number;
  baseY: number;
  centerFade: number;
  speed: number;
  size: number;
  phase: number;
  depth: number;
};

export type RainPreset = {
  density: number;
  opacity: number;
  speed: number;
  length: number;
  edgeBiasPower: number;
  quietDropChance: number;
  quietDropOpacity: number;
  stormFlash: boolean;
};

export type FogPreset = {
  bankCount: number;
  opacity: number;
  scale: number;
  baseHaze: number;
};

export type SnowPreset = {
  density: number;
  opacity: number;
  speed: number;
  size: number;
  streak: number;
  frost: number;
};

export type SandPreset = {
  density: number;
  opacity: number;
  speed: number;
  size: number;
  veil: number;
  turbulence: number;
  swirl: number;
  windBase: number;
  gustFrequency: number;
  gustAmplitude: number;
  tintStrength: number;
};

type WeatherQualityInput = Pick<WeatherSettings, "quality">;
type WeatherIntensityInput = Pick<WeatherSettings, "quality" | "intensity">;
type WeatherDriftInput = Pick<WeatherSettings, "directionDegrees" | "driftStrength">;

const FOG_EFFECTS = new Set<WeatherEffectType>(["light-fog", "fog", "heavy-fog"]);
const SAND_EFFECTS = new Set<WeatherEffectType>(["light-sand", "sand", "sandstorm"]);

export const RAIN_PRESETS: Record<RainWeatherEffectType, RainPreset> = {
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

export const FOG_PRESETS: Record<FogWeatherEffectType, FogPreset> = {
  "light-fog": {
    bankCount: 75,
    opacity: 0.42,
    scale: 1.34,
    baseHaze: 0.12
  },
  fog: {
    bankCount: 125,
    opacity: 0.52,
    scale: 1.5,
    baseHaze: 0.18
  },
  "heavy-fog": {
    bankCount: 170,
    opacity: 0.66,
    scale: 1.72,
    baseHaze: 0.28
  }
};

export const SNOW_PRESETS: Record<SnowWeatherEffectType, SnowPreset> = {
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

export const SAND_PRESETS: Record<SandWeatherEffectType, SandPreset> = {
  "light-sand": {
    density: 1.55,
    opacity: 0.72,
    speed: 0.92,
    size: 0.92,
    veil: 0.52,
    turbulence: 0.44,
    swirl: 0.12,
    windBase: 0.72,
    gustFrequency: 0.38,
    gustAmplitude: 0.46,
    tintStrength: 0.24
  },
  sand: {
    density: 2.65,
    opacity: 1.02,
    speed: 1.1,
    size: 1.08,
    veil: 0.58,
    turbulence: 0.74,
    swirl: 0.26,
    windBase: 1.05,
    gustFrequency: 0.72,
    gustAmplitude: 0.88,
    tintStrength: 0.3
  },
  sandstorm: {
    density: 4.35,
    opacity: 1.32,
    speed: 1.42,
    size: 1.28,
    veil: 0.92,
    turbulence: 1.2,
    swirl: 0.58,
    windBase: 1.55,
    gustFrequency: 1.05,
    gustAmplitude: 1.42,
    tintStrength: 0.46
  }
};

export function getWeatherClipPath(bounds: WeatherBounds, masks: WeatherMask[], camera: Camera): Path2D {
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

export function addWeatherMaskPath(path: Path2D, mask: WeatherMask, camera: Camera) {
  if (mask.kind === "rectangle" && mask.points.length >= 2) {
    const start = worldToScreen(mask.points[0], camera);
    const end = worldToScreen(mask.points[1], camera);
    path.rect(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    return;
  }
  if (mask.kind === "circle" && mask.points[0] && mask.radius) {
    const center = worldToScreen(mask.points[0], camera);
    const radius = mask.radius * camera.zoom;
    path.moveTo(center.x + radius, center.y);
    path.arc(center.x, center.y, radius, 0, Math.PI * 2);
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

export function worldToScreen(point: { x: number; y: number }, camera: Camera) {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y
  };
}

export function createStreak(bounds: WeatherBounds, spawnPadding: number, preset: RainPreset, weather: WeatherSettings, index: number): RainStreak {
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

export function getEdgeFade(bounds: WeatherBounds, point: { x: number; y: number }, quietAreaSize: number): number {
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

export function getDistanceToQuietArea(bounds: WeatherBounds, x: number, y: number, directionX: number, directionY: number, quietAreaSize: number): number {
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

export function getQuietAreaBounds(bounds: WeatherBounds, quietAreaSize: number) {
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

export function getScreenWeatherArea(scene: Scene, viewportWidth: number, viewportHeight: number, camera: Camera, mapSource?: CanvasImageSource | null): WeatherArea {
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

export function getEdgePoint(bounds: WeatherBounds, spawnPadding: number, edgeBiasPower: number, index: number): { x: number; y: number } {
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

export function getQuietAreaPoint(bounds: WeatherBounds, index: number, quietAreaSize: number): { x: number; y: number } {
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

export function createSandVeilMesh(bounds: WeatherBounds): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(bounds.width, bounds.height);
  geometry.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 780);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      veilOpacity: { value: 0 },
      sandColor: { value: new THREE.Color("#d39b54") },
      time: { value: 0 },
      direction: { value: new THREE.Vector2(1, 0) },
      aspect: { value: bounds.width / Math.max(1, bounds.height) },
      tintStrength: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float veilOpacity;
      uniform vec3 sandColor;
      uniform float time;
      uniform vec2 direction;
      uniform float aspect;
      uniform float tintStrength;
      varying vec2 vUv;

      float hash(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
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
          point = point * 2.07 + vec2(13.4, 9.2);
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 centered = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
        vec2 dir = normalize(direction);
        vec2 crossDir = vec2(-dir.y, dir.x);
        vec2 flow = vec2(dot(centered, dir), dot(centered, crossDir));
        float broadDust = fbm(flow * vec2(5.4, 1.75) + vec2(time * 0.1, time * 0.022));
        float fineDust = fbm(flow * vec2(19.0, 4.8) + vec2(time * 0.24, -time * 0.052));
        float crossGusts = fbm(vec2(flow.y * 7.0 + time * 0.08, flow.x * 1.4 - time * 0.035));
        float gustBands = smoothstep(0.28, 0.82, broadDust + fineDust * 0.32 + crossGusts * 0.22);
        float edgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float edgeLift = 1.0 - smoothstep(0.0, 0.4, edgeDistance);
        float hostileHaze = smoothstep(0.48, 0.92, gustBands + crossGusts * 0.18);
        float alpha = veilOpacity * (0.18 + gustBands * 0.64 + edgeLift * 0.34 + hostileHaze * tintStrength * 0.24);
        vec3 hotSand = sandColor * vec3(1.34, 0.92, 0.62);
        vec3 orangeDust = vec3(1.0, 0.48, 0.16);
        vec3 dustColor = mix(sandColor * 0.68, hotSand * 1.18, fineDust * 0.72 + gustBands * 0.28);
        dustColor = mix(dustColor, orangeDust, hostileHaze * tintStrength);
        gl_FragColor = vec4(dustColor, alpha);
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

export function updateSandVeilMesh(mesh: THREE.Mesh | null, weather: WeatherSettings, preset: SandPreset, now: number, layerOpacity: number) {
  if (!mesh || !(mesh.material instanceof THREE.ShaderMaterial)) {
    return;
  }
  const directionRadians = (weather.directionDegrees * Math.PI) / 180;
  const driftStrength = Math.max(0, Math.min(1, weather.driftStrength));
  mesh.material.uniforms.veilOpacity.value = Math.min(1.35, preset.veil * weather.opacity * weather.intensity * layerOpacity);
  mesh.material.uniforms.sandColor.value.set(weather.color);
  mesh.material.uniforms.time.value = now * 0.001 * Math.max(0.12, weather.speed) * preset.speed * (0.55 + driftStrength * 0.45);
  mesh.material.uniforms.direction.value.set(Math.cos(directionRadians), Math.sin(directionRadians));
  mesh.material.uniforms.tintStrength.value = preset.tintStrength;
}

export function createFogDensityTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.needsUpdate = true;
    return fallbackTexture;
  }

  const image = context.createImageData(size, size);
  const atlasColumns = 3;
  const tileSize = size / atlasColumns;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const tileX = Math.min(atlasColumns - 1, Math.floor(x / tileSize));
      const tileY = Math.min(atlasColumns - 1, Math.floor(y / tileSize));
      const variant = tileY * atlasColumns + tileX;
      const localX = x - tileX * tileSize;
      const localY = y - tileY * tileSize;
      const u = localX / (tileSize - 1);
      const v = localY / (tileSize - 1);
      const variantSeed = variant * 1000;
      const blobCount = 22 + Math.floor(hash(variantSeed + 1291) * 18);
      const warpX = (valueNoise(u * 4.2 + 12.7, v * 4.2 + 3.9, 131 + variantSeed) - 0.5) * 0.14;
      const warpY = (valueNoise(u * 4.2 + 2.4, v * 4.2 + 16.8, 167 + variantSeed) - 0.5) * 0.14;
      const warpedU = u + warpX;
      const warpedV = v + warpY;
      const centeredX = warpedU - 0.52;
      const centeredY = warpedV - 0.48;
      const radial = Math.max(0, 1 - Math.hypot(centeredX * 0.9, centeredY * 1.08) * 2.7);
      let blobDensity = 0;
      for (let blobIndex = 0; blobIndex < blobCount; blobIndex += 1) {
        const blobSeed = variantSeed + blobIndex;
        const blobX = 0.28 + hash(blobSeed + 1301) * 0.44;
        const blobY = 0.27 + hash(blobSeed + 1401) * 0.46;
        const radiusX = 0.04 + hash(blobSeed + 1501) * 0.105;
        const radiusY = 0.035 + hash(blobSeed + 1601) * 0.095;
        const weight = 0.45 + hash(blobSeed + 1701) * 0.8;
        const dx = (warpedU - blobX) / radiusX;
        const dy = (warpedV - blobY) / radiusY;
        blobDensity += Math.exp(-(dx * dx + dy * dy) * 1.55) * weight;
      }
      blobDensity = Math.min(1, blobDensity * 0.58);
      const broadNoise =
        valueNoise(warpedU * 2.4 + 7.2, warpedV * 2.4 + 1.7, 11 + variantSeed) * 0.48 +
        valueNoise(warpedU * 5.2 + 2.1, warpedV * 5.2 + 8.8, 29 + variantSeed) * 0.34 +
        valueNoise(warpedU * 11.0 + 6.7, warpedV * 11.0 + 4.4, 47 + variantSeed) * 0.18;
      const erosion =
        valueNoise(warpedU * 13.5 + 3.2, warpedV * 13.5 + 9.1, 73 + variantSeed) * 0.5 +
        valueNoise(warpedU * 28.0 + 5.8, warpedV * 28.0 + 2.6, 101 + variantSeed) * 0.32;
      const strand = Math.max(0, valueNoise(warpedU * 7.2 + 18.4, warpedV * 2.1 + 5.9, 197 + variantSeed) - 0.42) * 0.34;
      const wisps = Math.max(0, broadNoise + strand - erosion * 0.48);
      const edgeFade =
        smoothstep(0, 0.3, u) *
        smoothstep(0, 0.3, v) *
        (1 - smoothstep(0.7, 1, u)) *
        (1 - smoothstep(0.7, 1, v));
      const density = Math.max(0, Math.min(1, smoothstep(0.02, 1, radial * 0.32 + blobDensity * 0.48 + wisps * 0.18 - erosion * 0.12) * edgeFade));
      const alpha = Math.round(Math.pow(density, 1.75) * 190);
      const offset = (y * size + x) * 4;
      image.data[offset] = alpha;
      image.data[offset + 1] = alpha;
      image.data[offset + 2] = alpha;
      image.data[offset + 3] = alpha;
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createFogHazeMesh(bounds: WeatherBounds): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(bounds.width, bounds.height);
  geometry.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 760);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      hazeOpacity: { value: 0 },
      fogTint: { value: new THREE.Color("#d8dee9") },
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
      uniform float hazeOpacity;
      uniform vec3 fogTint;
      uniform float time;
      uniform float aspect;
      varying vec2 vUv;

      float hash(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
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
          point = point * 2.1 + vec2(19.2, 5.7);
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 centeredUv = vec2((vUv.x - 0.5) * aspect + 0.5, vUv.y);
        float edgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float edgeLift = 1.0 - smoothstep(0.0, 0.42, edgeDistance);
        float cloud = fbm(centeredUv * 5.2 + vec2(time * 0.012, -time * 0.008));
        float veil = smoothstep(0.2, 0.86, cloud) * 0.55 + edgeLift * 0.45;
        vec3 neutralHaze = mix(vec3(0.58, 0.66, 0.7), vec3(0.82, 0.88, 0.9), clamp(cloud + 0.2, 0.0, 1.0));
        vec3 color = mix(neutralHaze, fogTint, 0.5);
        gl_FragColor = vec4(color, hazeOpacity * veil);
      }
    `
  });
  const haze = new THREE.Mesh(geometry, material);
  haze.frustumCulled = false;
  return haze;
}

export function updateFogHazeMesh(mesh: THREE.Mesh | null, weather: WeatherSettings, preset: FogPreset, now: number, layerOpacity: number) {
  if (!mesh || !(mesh.material instanceof THREE.ShaderMaterial)) {
    return;
  }
  mesh.material.uniforms.hazeOpacity.value = preset.baseHaze * weather.opacity * weather.intensity * layerOpacity;
  mesh.material.uniforms.fogTint.value.set(weather.color);
  mesh.material.uniforms.time.value = now * 0.001 * Math.max(0.12, weather.speed);
}

export function createFogBanks(bounds: WeatherBounds, weather: WeatherSettings, preset: FogPreset, targetCount: number): FogBank[] {
  const banks: FogBank[] = [];
  const baseSize = Math.min(bounds.width, bounds.height);
  const extraFogCluster = weather.effect === "light-fog" || weather.effect === "fog" ? 1 : 0;
  const groupCount = Math.max(1, Math.ceil(targetCount / 14) + extraFogCluster);
  const noDrift = weather.driftStrength <= 0.02;
  const driftRadians = noDrift ? 0 : (weather.directionDegrees * Math.PI) / 180;
  const directionX = Math.cos(driftRadians);
  const directionY = Math.sin(driftRadians);
  const crossX = -directionY;
  const crossY = directionX;

  for (let groupIndex = 0; groupIndex < groupCount && banks.length < targetCount; groupIndex += 1) {
    const point = getFogBankPoint(bounds, weather, groupIndex * 97);
    const groupSeed = groupIndex + hash(groupIndex + 1201) * 1000;
    const remainingGroups = groupCount - groupIndex;
    const remainingBanks = targetCount - banks.length;
    const averageRemaining = Math.ceil(remainingBanks / remainingGroups);
    const childCount = Math.min(remainingBanks, Math.max(1, averageRemaining));
    const clusterLength = baseSize * preset.scale * weather.streakLength * (noDrift ? 0.18 + hash(groupIndex + 1223) * 0.16 : 0.42 + weather.driftStrength * 0.18 + hash(groupIndex + 1223) * 0.28);
    const clusterWidth = baseSize * preset.scale * weather.streakLength * (noDrift ? 0.08 + hash(groupIndex + 1227) * 0.06 : 0.028 + (1 - weather.driftStrength) * 0.022 + hash(groupIndex + 1227) * 0.035);
    const groupPhase = hash(groupIndex + 1229);
    const groupSpeed = 0.5 + hash(groupIndex + 1231) * 0.58;
    const flowDistance = Math.hypot(bounds.width, bounds.height) * 1.55;
    const groupDrift = baseSize * (0.024 + hash(groupIndex + 1237) * 0.045);

    for (let childIndex = 0; childIndex < childCount && banks.length < targetCount; childIndex += 1) {
      const index = banks.length;
      const childSeed = groupIndex * 997 + childIndex * 37 + index;
      const alongJitter = hash(childSeed + 1) - 0.5;
      const orderedAlong = childCount <= 1 ? 0 : childIndex / (childCount - 1) - 0.5;
      const along = (orderedAlong * 0.72 + alongJitter * 0.28) * clusterLength;
      const cross = (hash(childSeed + 2) - 0.5) * clusterWidth;
      const localX = directionX * along + crossX * cross;
      const localY = directionY * along + crossY * cross;
      banks.push(createFogBank(bounds, weather, preset, index, {
        groupSeed,
        point,
        localX,
        localY,
        groupPhase,
        groupSpeed,
        flowDistance,
        groupDrift
      }));
    }
  }

  return banks;
}

export function createFogBank(
  bounds: WeatherBounds,
  weather: WeatherSettings,
  preset: FogPreset,
  index: number,
  group: {
    groupSeed: number;
    point: { x: number; y: number };
    localX: number;
    localY: number;
    groupPhase: number;
    groupSpeed: number;
    flowDistance: number;
    groupDrift: number;
  }
): FogBank {
  const scale = preset.scale * weather.streakLength;
  const baseSize = Math.min(bounds.width, bounds.height);
  const localDistance = Math.hypot(group.localX, group.localY);
  const maxClusterDistance = baseSize * preset.scale * weather.streakLength * 0.46;
  const clusterFade = Math.max(0, 1 - localDistance / Math.max(1, maxClusterDistance));
  const distanceScale = 0.12 + Math.pow(clusterFade, 2.45) * 0.88;
  const sizeJitter = (0.64 + hash(index + 229) * 0.46 + clusterFade * 0.34) * distanceScale;
  const aspect = 0.82 + hash(index + 235) * 0.36;
  return {
    seed: index + hash(index + 207) * 1000,
    groupSeed: group.groupSeed,
    textureIndex: Math.floor(hash(index + 209) * 9),
    baseX: group.point.x,
    baseY: group.point.y,
    localX: group.localX,
    localY: group.localY,
    radiusX: baseSize * (0.1 + hash(index + 221) * 0.08) * scale * sizeJitter * aspect,
    radiusY: baseSize * (0.09 + hash(index + 223) * 0.075) * scale * sizeJitter,
    alpha: (0.46 + hash(index + 227) * 0.48 + clusterFade * 0.52) * (0.78 + weather.intensity * 0.78),
    speed: 0.32 + hash(index + 211) * 0.5,
    groupSpeed: group.groupSpeed,
    rotation: hash(index + 217) * Math.PI * 2,
    phase: hash(index + 219),
    groupPhase: group.groupPhase,
    flowDistance: group.flowDistance,
    drift: group.groupDrift,
    localDrift: baseSize * (0.012 + hash(index + 231) * 0.026)
  };
}

export function createFrostEdgeMesh(bounds: WeatherBounds): THREE.Group {
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

export function updateFrostEdgeMesh(mesh: THREE.Group | null, weather: WeatherSettings, preset: SnowPreset, now: number, layerOpacity: number) {
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

export function createSnowParticle(bounds: WeatherBounds, weather: WeatherSettings, preset: SnowPreset, index: number): SnowParticle {
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

export function createSandParticle(bounds: WeatherBounds, weather: WeatherSettings, index: number): SandParticle {
  const quietGrainChance = 0.015 + weather.centerStrayDrops * 0.16;
  const quietGrain = hash(index + 901) > 1 - quietGrainChance;
  const spawnPadding = Math.min(bounds.width, bounds.height) * (0.28 + weather.driftStrength * 0.24);
  const spawnBounds = {
    left: bounds.left - spawnPadding,
    top: bounds.top - spawnPadding,
    width: bounds.width + spawnPadding * 2,
    height: bounds.height + spawnPadding * 2
  };
  const point = quietGrain
    ? getQuietAreaPoint(bounds, index + 905, weather.quietAreaSize)
    : getEdgePoint(spawnBounds, spawnPadding, 2 + weather.edgeBias * 4, index + 910);
  return {
    seed: index + hash(index + 917) * 1000,
    baseX: point.x,
    baseY: point.y,
    centerFade: quietGrain ? getEdgeFade(bounds, point, weather.quietAreaSize) * 0.36 : 0.52 + getEdgeFade(bounds, point, weather.quietAreaSize) * 0.48,
    speed: 0.36 + hash(index + 920) * 0.58,
    size: 0.55 + hash(index + 930) * 0.9,
    phase: hash(index + 940),
    depth: hash(index + 950)
  };
}

export function getFogBankPoint(bounds: WeatherBounds, weather: WeatherSettings, index: number): { x: number; y: number } {
  if (weather.driftStrength <= 0.02) {
    const quiet = getQuietAreaBounds(bounds, Math.max(0.35, weather.quietAreaSize * 0.92));
    const useInterior = hash(index + 229) < 0.72 + weather.centerStrayDrops * 0.24;
    const activeBounds = useInterior ? quiet : bounds;
    return {
      x: activeBounds.left + hash(index + 241) * activeBounds.width,
      y: activeBounds.top + hash(index + 251) * activeBounds.height
    };
  }
  const directionRadians = (weather.directionDegrees * Math.PI) / 180;
  const directionX = Math.cos(directionRadians);
  const directionY = Math.sin(directionRadians);
  const crossX = -directionY;
  const crossY = directionX;
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const diagonal = Math.hypot(bounds.width, bounds.height);
  const interiorChance = (1 - weather.edgeBias) * 0.32 + weather.centerStrayDrops * 0.18;
  if (hash(index + 229) < interiorChance) {
    const quiet = getQuietAreaBounds(bounds, Math.max(0.35, weather.quietAreaSize * 0.82));
    return {
      x: quiet.left + hash(index + 241) * quiet.width,
      y: quiet.top + hash(index + 251) * quiet.height
    };
  }
  const edgeTightness = 1 - weather.edgeBias;
  const crossSpan = diagonal * (0.4 + edgeTightness * 0.3 + hash(index + 231) * 0.26);
  const crossOffset = (hash(index + 241) - 0.5) * crossSpan;
  const startOffset = diagonal * (0.5 + weather.edgeBias * 0.18 + hash(index + 251) * 0.12);
  return {
    x: centerX - directionX * startOffset + crossX * crossOffset,
    y: centerY - directionY * startOffset + crossY * crossOffset
  };
}

export function getRainPreset(effect: RainWeatherEffectType): RainPreset {
  return RAIN_PRESETS[effect];
}

export function drawStormFlash(ctx: CanvasRenderingContext2D, bounds: WeatherBounds, weather: WeatherSettings, now: number, opacity: number) {
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

export function getEdgeBiasPower(weather: WeatherSettings, preset: RainPreset): number {
  return Math.max(1.5, preset.edgeBiasPower * (0.45 + weather.edgeBias * 1.1));
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function getMinimumWeatherDimension(bounds: WeatherBounds): number {
  return Math.min(bounds.width, bounds.height);
}

export function getQualityMultiplier(weather: WeatherQualityInput): number {
  switch (weather.quality) {
    case "low":
      return 0.62;
    case "high":
      return 1.38;
    default:
      return 1;
  }
}

export function getWeatherIntensity(weather: Pick<WeatherSettings, "intensity">, minimum = 0.1): number {
  return Math.max(minimum, Number.isFinite(weather.intensity) ? weather.intensity : minimum);
}

export function getWeatherParticleCount(baseCount: number, density: number, weather: WeatherIntensityInput): number {
  return Math.round(baseCount * density * getQualityMultiplier(weather) * getWeatherIntensity(weather));
}

export function getWeatherDriftVector(weather: WeatherDriftInput, minimumStrength = 0) {
  const strength = clamp(Number.isFinite(weather.driftStrength) ? weather.driftStrength : 0, minimumStrength, 1);
  const degrees = Number.isFinite(weather.directionDegrees) ? weather.directionDegrees : 0;
  const radians = (degrees * Math.PI) / 180;
  return {
    degrees,
    radians,
    strength,
    x: Math.cos(radians),
    y: Math.sin(radians)
  };
}

export function valueNoise(x: number, y: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const localX = x - cellX;
  const localY = y - cellY;
  const curveX = localX * localX * (3 - 2 * localX);
  const curveY = localY * localY * (3 - 2 * localY);
  const a = hash(seed + cellX * 37.17 + cellY * 17.31);
  const b = hash(seed + (cellX + 1) * 37.17 + cellY * 17.31);
  const c = hash(seed + cellX * 37.17 + (cellY + 1) * 17.31);
  const d = hash(seed + (cellX + 1) * 37.17 + (cellY + 1) * 17.31);
  return lerp(lerp(a, b, curveX), lerp(c, d, curveX), curveY);
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function isFogEffect(effect: WeatherEffectType): effect is FogWeatherEffectType {
  return FOG_EFFECTS.has(effect);
}

export function isSnowEffect(effect: WeatherEffectType): effect is SnowWeatherEffectType {
  return effect === "light-snow" || effect === "snow" || effect === "blizzard";
}

export function isSandEffect(effect: WeatherEffectType): effect is SandWeatherEffectType {
  return SAND_EFFECTS.has(effect);
}

export function getCycleOffset(seed: number, cycle: number, radius: number): { x: number; y: number } {
  const angle = hash(seed + cycle * 11.31) * Math.PI * 2;
  const distance = Math.sqrt(hash(seed + cycle * 13.97)) * radius;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function hash(value: number): number {
  const sine = Math.sin(value * 12.9898) * 43758.5453;
  return sine - Math.floor(sine);
}
