import * as THREE from "three";
import {
  DEFAULT_ACID_EFFECT_TUNING,
  DEFAULT_COLD_EFFECT_TUNING,
  DEFAULT_DARKNESS_EFFECT_TUNING,
  DEFAULT_POISON_EFFECT_TUNING,
  type AcidEffectTuning,
  type ColdEffectTuning,
  type DarknessEffectTuning,
  type PoisonEffectTuning
} from "./environmentEffectTuningDefaults";
import { drawAcidFallback, drawColdFallback, drawDarknessFallback, drawPoisonFallback } from "./environmentEffectFallbacks";
import { degreesToRadians, type ScreenBounds } from "./environmentEffectRendererMath";
import {
  disposeEnvironmentEffectRuntime,
  getSharedEffectPlaneGeometry,
  getSharedEnvironmentEffectRenderer,
  positionEnvironmentEffectMesh,
  updateEnvironmentEffectCameraUniforms,
  type EnvironmentEffectRuntime
} from "./environmentEffectRuntime";

export const ACID_EFFECT_PRESETS = {
  acidPool: { ...DEFAULT_ACID_EFFECT_TUNING },
  causticSludge: {
    opacity: 0.9,
    acidScale: 7.8,
    speed: 0.12,
    directionDegrees: 282,
    corrosion: 0.92,
    bubbleDensity: 0.36,
    bubbleSize: 0.72,
    streakDensity: 0.76,
    streakWarp: 0.88,
    foam: 0.36,
    glow: 0.42,
    panFollow: 1,
    zoomScale: 0.2,
    baseAlpha: 0.38,
    darkColor: "#172c08",
    acidColor: "#65a30d",
    foamColor: "#d9f99d"
  },
  bubblingAcid: {
    opacity: 0.86,
    acidScale: 4.4,
    speed: 0.38,
    directionDegrees: 260,
    corrosion: 0.62,
    bubbleDensity: 0.92,
    bubbleSize: 0.84,
    streakDensity: 0.28,
    streakWarp: 0.64,
    foam: 0.86,
    glow: 0.78,
    panFollow: 1,
    zoomScale: -0.1,
    baseAlpha: 0.2,
    darkColor: "#052e16",
    acidColor: "#a3e635",
    foamColor: "#f7fee7"
  }
} as const satisfies Record<string, AcidEffectTuning>;

export const POISON_EFFECT_PRESETS = {
  poisonCloud: { ...DEFAULT_POISON_EFFECT_TUNING },
  toxicFog: {
    opacity: 0.78,
    cloudScale: 6.2,
    speed: 0.08,
    directionDegrees: 284,
    turbulence: 0.92,
    density: 0.82,
    pocketDensity: 0.42,
    pocketSize: 0.72,
    softness: 0.92,
    drift: 0.72,
    glow: 0.28,
    panFollow: 1,
    zoomScale: 0.1,
    baseAlpha: 0.34,
    shadowColor: "#10250b",
    poisonColor: "#4d7c0f",
    highlightColor: "#bef264"
  },
  sicklyMiasma: {
    opacity: 0.68,
    cloudScale: 3.8,
    speed: 0.18,
    directionDegrees: 262,
    turbulence: 1.2,
    density: 0.58,
    pocketDensity: 0.86,
    pocketSize: 0.5,
    softness: 0.74,
    drift: 0.88,
    glow: 0.72,
    panFollow: 1,
    zoomScale: -0.15,
    baseAlpha: 0.2,
    shadowColor: "#052e16",
    poisonColor: "#84cc16",
    highlightColor: "#ecfccb"
  }
} as const satisfies Record<string, PoisonEffectTuning>;

export const COLD_EFFECT_PRESETS = {
  frostField: { ...DEFAULT_COLD_EFFECT_TUNING },
  iceCrystals: {
    opacity: 0.78,
    frostScale: 4.2,
    speed: 0.05,
    directionDegrees: 292,
    veinDensity: 0.72,
    veinWidth: 0.36,
    crystalDensity: 0.92,
    crystalSize: 0.78,
    haze: 0.18,
    shimmer: 0.72,
    glow: 0.66,
    panFollow: 1,
    zoomScale: -0.1,
    baseAlpha: 0.14,
    shadowColor: "#0b1f33",
    frostColor: "#93c5fd",
    highlightColor: "#ffffff"
  },
  freezingHaze: {
    opacity: 0.68,
    frostScale: 7.6,
    speed: 0.12,
    directionDegrees: 278,
    veinDensity: 0.34,
    veinWidth: 0.28,
    crystalDensity: 0.36,
    crystalSize: 0.52,
    haze: 0.86,
    shimmer: 0.4,
    glow: 0.36,
    panFollow: 1,
    zoomScale: 0.1,
    baseAlpha: 0.28,
    shadowColor: "#13293d",
    frostColor: "#bfdbfe",
    highlightColor: "#eff6ff"
  }
} as const satisfies Record<string, ColdEffectTuning>;

export const DARKNESS_EFFECT_PRESETS = {
  shadowPool: { ...DEFAULT_DARKNESS_EFFECT_TUNING },
  creepingDarkness: {
    opacity: 0.88,
    darknessScale: 7.4,
    speed: 0.08,
    directionDegrees: 266,
    depth: 0.86,
    tendrilDensity: 0.78,
    tendrilReach: 0.82,
    edgeSoftness: 0.9,
    wispDensity: 0.54,
    drift: 0.72,
    voidHighlight: 0.18,
    panFollow: 1,
    zoomScale: 0.15,
    baseAlpha: 0.4,
    shadowColor: "#111827",
    voidColor: "#01030a",
    highlightColor: "#4f46e5"
  },
  voidShroud: {
    opacity: 0.94,
    darknessScale: 3.8,
    speed: 0.16,
    directionDegrees: 288,
    depth: 1,
    tendrilDensity: 0.46,
    tendrilReach: 0.58,
    edgeSoftness: 0.62,
    wispDensity: 0.3,
    drift: 0.48,
    voidHighlight: 0.38,
    panFollow: 1,
    zoomScale: -0.1,
    baseAlpha: 0.48,
    shadowColor: "#0f172a",
    voidColor: "#000000",
    highlightColor: "#7c3aed"
  }
} as const satisfies Record<string, DarknessEffectTuning>;

let acidRuntime: EnvironmentEffectRuntime | null = null;
let poisonRuntime: EnvironmentEffectRuntime | null = null;
let coldRuntime: EnvironmentEffectRuntime | null = null;
let darknessRuntime: EnvironmentEffectRuntime | null = null;

export function disposeHazardEffectRuntimes(): void {
  disposeEnvironmentEffectRuntime(acidRuntime);
  disposeEnvironmentEffectRuntime(poisonRuntime);
  disposeEnvironmentEffectRuntime(coldRuntime);
  disposeEnvironmentEffectRuntime(darknessRuntime);
  acidRuntime = null;
  poisonRuntime = null;
  coldRuntime = null;
  darknessRuntime = null;
}

export function drawEnvironmentAcidEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: AcidEffectTuning = DEFAULT_ACID_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getAcidRuntime(width, height);
  if (!runtime) {
    drawAcidFallback(ctx, bounds, layerOpacity);
    return;
  }

  drawAcidFallback(ctx, bounds, layerOpacity * 0.45);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.28;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.71 + 13.6;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateAcidMaterialTuning(runtime.meshA.material, tuning);
  updateAcidMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentPoisonEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: PoisonEffectTuning = DEFAULT_POISON_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getPoisonRuntime(width, height);
  if (!runtime) {
    drawPoisonFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.34;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.63 + 18.1;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updatePoisonMaterialTuning(runtime.meshA.material, tuning);
  updatePoisonMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentColdEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: ColdEffectTuning = DEFAULT_COLD_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getColdRuntime(width, height);
  if (!runtime) {
    drawColdFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.3;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.58 + 22.4;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateColdMaterialTuning(runtime.meshA.material, tuning);
  updateColdMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentDarknessEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: DarknessEffectTuning = DEFAULT_DARKNESS_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getDarknessRuntime(width, height);
  if (!runtime) {
    drawDarknessFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.42;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.55 + 14.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateDarknessMaterialTuning(runtime.meshA.material, tuning);
  updateDarknessMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

function getAcidRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!acidRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createAcidMaterial(0.84);
    const materialB = createAcidMaterial(0.28);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    acidRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (acidRuntime.width !== width || acidRuntime.height !== height) {
    acidRuntime.width = width;
    acidRuntime.height = height;
    acidRuntime.camera.left = 0;
    acidRuntime.camera.right = width;
    acidRuntime.camera.top = 0;
    acidRuntime.camera.bottom = height;
    acidRuntime.camera.near = 0.1;
    acidRuntime.camera.far = 5000;
    acidRuntime.camera.updateProjectionMatrix();
  }

  return acidRuntime;
}

function getPoisonRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!poisonRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createPoisonMaterial(0.72);
    const materialB = createPoisonMaterial(0.34);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    poisonRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (poisonRuntime.width !== width || poisonRuntime.height !== height) {
    poisonRuntime.width = width;
    poisonRuntime.height = height;
    poisonRuntime.camera.left = 0;
    poisonRuntime.camera.right = width;
    poisonRuntime.camera.top = 0;
    poisonRuntime.camera.bottom = height;
    poisonRuntime.camera.near = 0.1;
    poisonRuntime.camera.far = 5000;
    poisonRuntime.camera.updateProjectionMatrix();
  }

  return poisonRuntime;
}

function getColdRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!coldRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createColdMaterial(0.72);
    const materialB = createColdMaterial(0.3);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    coldRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (coldRuntime.width !== width || coldRuntime.height !== height) {
    coldRuntime.width = width;
    coldRuntime.height = height;
    coldRuntime.camera.left = 0;
    coldRuntime.camera.right = width;
    coldRuntime.camera.top = 0;
    coldRuntime.camera.bottom = height;
    coldRuntime.camera.near = 0.1;
    coldRuntime.camera.far = 5000;
    coldRuntime.camera.updateProjectionMatrix();
  }

  return coldRuntime;
}

function getDarknessRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!darknessRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createDarknessMaterial(0.82);
    const materialB = createDarknessMaterial(0.34);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    darknessRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (darknessRuntime.width !== width || darknessRuntime.height !== height) {
    darknessRuntime.width = width;
    darknessRuntime.height = height;
    darknessRuntime.camera.left = 0;
    darknessRuntime.camera.right = width;
    darknessRuntime.camera.top = 0;
    darknessRuntime.camera.bottom = height;
    darknessRuntime.camera.near = 0.1;
    darknessRuntime.camera.far = 5000;
    darknessRuntime.camera.updateProjectionMatrix();
  }

  return darknessRuntime;
}

function createAcidMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      acidScale: { value: DEFAULT_ACID_EFFECT_TUNING.acidScale },
      speed: { value: DEFAULT_ACID_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_ACID_EFFECT_TUNING.directionDegrees) },
      corrosion: { value: DEFAULT_ACID_EFFECT_TUNING.corrosion },
      bubbleDensity: { value: DEFAULT_ACID_EFFECT_TUNING.bubbleDensity },
      bubbleSize: { value: DEFAULT_ACID_EFFECT_TUNING.bubbleSize },
      streakDensity: { value: DEFAULT_ACID_EFFECT_TUNING.streakDensity },
      streakWarp: { value: DEFAULT_ACID_EFFECT_TUNING.streakWarp },
      foam: { value: DEFAULT_ACID_EFFECT_TUNING.foam },
      glow: { value: DEFAULT_ACID_EFFECT_TUNING.glow },
      panFollow: { value: DEFAULT_ACID_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_ACID_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_ACID_EFFECT_TUNING.baseAlpha },
      darkColor: { value: new THREE.Color(DEFAULT_ACID_EFFECT_TUNING.darkColor) },
      acidColor: { value: new THREE.Color(DEFAULT_ACID_EFFECT_TUNING.acidColor) },
      foamColor: { value: new THREE.Color(DEFAULT_ACID_EFFECT_TUNING.foamColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float acidScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float corrosion;
      uniform float bubbleDensity;
      uniform float bubbleSize;
      uniform float streakDensity;
      uniform float streakWarp;
      uniform float foam;
      uniform float glow;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 darkColor;
      uniform vec3 acidColor;
      uniform vec3 foamColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.03;
          amplitude *= 0.52;
        }
        return total;
      }

      float bubbleField(vec2 uv, float localTime) {
        float field = 0.0;
        float cells = mix(2.0, 10.0, bubbleDensity) * mix(0.65, 1.3, bubbleSize);
        for (int layer = 0; layer < 3; layer++) {
          float layerSeed = float(layer) * 37.21;
          vec2 layerUv = uv * (cells + float(layer) * 1.7) + vec2(localTime * (0.08 + float(layer) * 0.03), -localTime * 0.06);
          vec2 cell = floor(layerUv);
          vec2 fraction = fract(layerUv);
          float seed = randomValue(cell + layerSeed);
          float placed = smoothstep(0.82 - bubbleDensity * 0.62, 0.98, seed);
          vec2 center = vec2(0.5) + (vec2(randomValue(cell + vec2(4.4, layerSeed)), randomValue(cell + vec2(12.7, layerSeed))) - 0.5) * 0.56;
          float radius = mix(0.08, 0.28, bubbleSize) * mix(0.65, 1.45, randomValue(cell + vec2(9.0, 2.0)));
          float distanceFromCenter = length(fraction - center);
          float ring = 1.0 - smoothstep(radius, radius + 0.035, abs(distanceFromCenter - radius));
          float centerPop = 1.0 - smoothstep(radius * 0.25, radius * 0.7, distanceFromCenter);
          float pulse = 0.72 + sin(localTime * 4.0 + seed * 6.2831853) * 0.28;
          field = max(field, (ring + centerPop * 0.3) * placed * pulse);
        }
        return clamp(field, 0.0, 1.0);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 170.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;

        vec2 flowUv = uv * max(0.2, acidScale / 4.0);
        float large = fbm(flowUv * 0.82 + vec2(localTime * 0.2, -localTime * 0.08));
        float medium = fbm(flowUv * 1.9 - vec2(localTime * 0.18, localTime * 0.14));
        flowUv += vec2(large - 0.5, medium - 0.5) * streakWarp * 0.9;

        float body = smoothstep(0.16, 0.88, large * 0.56 + medium * 0.34 + fbm(flowUv * 4.2) * 0.1);
        float corrosivePits = smoothstep(0.62 - corrosion * 0.32, 0.96, fbm(flowUv * mix(2.8, 8.5, corrosion) + vec2(localTime * 0.12, 8.0)));
        float streakNoise = fbm(vec2(flowUv.x * (1.0 + streakWarp * 2.0), flowUv.y * mix(4.0, 14.0, streakDensity)) + vec2(localTime * 0.45, 0.0));
        float streaks = smoothstep(0.74 - streakDensity * 0.36, 0.96, streakNoise);
        streaks *= smoothstep(0.2, 0.85, fbm(flowUv * vec2(6.0, 1.2) - vec2(0.0, localTime * 0.2)));
        float bubbles = bubbleField(flowUv * mix(0.9, 1.8, bubbleDensity), localTime);
        float foamEdge = smoothstep(0.58 - foam * 0.28, 0.96, fbm(flowUv * vec2(3.5, 5.2) - vec2(localTime * 0.08, localTime * 0.18)));

        vec3 color = mix(darkColor, acidColor, body + corrosivePits * 0.35);
        color = mix(color, foamColor, clamp(bubbles * 0.85 + foamEdge * foam * 0.42 + streaks * foam * 0.24, 0.0, 1.0));
        color += acidColor * glow * (corrosivePits * 0.28 + bubbles * 0.18 + streaks * 0.16);
        float alpha = (baseAlpha + body * 0.26 + corrosivePits * corrosion * 0.22 + streaks * 0.24 + bubbles * 0.28 + foamEdge * foam * 0.18) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateAcidMaterialTuning(material: THREE.ShaderMaterial, tuning: AcidEffectTuning) {
  material.uniforms.acidScale.value = tuning.acidScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.corrosion.value = tuning.corrosion;
  material.uniforms.bubbleDensity.value = tuning.bubbleDensity;
  material.uniforms.bubbleSize.value = tuning.bubbleSize;
  material.uniforms.streakDensity.value = tuning.streakDensity;
  material.uniforms.streakWarp.value = tuning.streakWarp;
  material.uniforms.foam.value = tuning.foam;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.darkColor.value.set(tuning.darkColor);
  material.uniforms.acidColor.value.set(tuning.acidColor);
  material.uniforms.foamColor.value.set(tuning.foamColor);
}

function createPoisonMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      cloudScale: { value: DEFAULT_POISON_EFFECT_TUNING.cloudScale },
      speed: { value: DEFAULT_POISON_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_POISON_EFFECT_TUNING.directionDegrees) },
      turbulence: { value: DEFAULT_POISON_EFFECT_TUNING.turbulence },
      density: { value: DEFAULT_POISON_EFFECT_TUNING.density },
      pocketDensity: { value: DEFAULT_POISON_EFFECT_TUNING.pocketDensity },
      pocketSize: { value: DEFAULT_POISON_EFFECT_TUNING.pocketSize },
      softness: { value: DEFAULT_POISON_EFFECT_TUNING.softness },
      drift: { value: DEFAULT_POISON_EFFECT_TUNING.drift },
      glow: { value: DEFAULT_POISON_EFFECT_TUNING.glow },
      panFollow: { value: DEFAULT_POISON_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_POISON_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_POISON_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_POISON_EFFECT_TUNING.shadowColor) },
      poisonColor: { value: new THREE.Color(DEFAULT_POISON_EFFECT_TUNING.poisonColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_POISON_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float cloudScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float turbulence;
      uniform float density;
      uniform float pocketDensity;
      uniform float pocketSize;
      uniform float softness;
      uniform float drift;
      uniform float glow;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 poisonColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.02;
          amplitude *= 0.5;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 190.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;

        vec2 flow = uv * max(0.2, cloudScale / 4.0);
        flow.x -= localTime * (0.22 + drift * 0.7);
        flow.y += sin(flow.x * 1.4 + localTime * 1.7) * drift * 0.18;
        float broad = fbm(flow * 0.78 + vec2(localTime * 0.08, -localTime * 0.03));
        float curl = fbm(flow * 1.55 - vec2(localTime * 0.06, localTime * 0.1));
        flow += vec2(broad - 0.5, curl - 0.5) * turbulence * 0.9;
        float largeCloud = fbm(flow * 0.95 + vec2(localTime * 0.06, 4.0));
        float mediumCloud = fbm(rotate2d(0.9) * flow * 1.85 - vec2(localTime * 0.08, localTime * 0.03));
        float fineCloud = fbm(flow * 4.4 + vec2(7.0, -localTime * 0.12));
        float cloud = largeCloud * 0.58 + mediumCloud * 0.32 + fineCloud * 0.1;
        float cloudMask = smoothstep(0.56 - density * 0.44, mix(0.96, 0.72, softness), cloud);

        float pocketNoise = fbm(flow * mix(2.6, 7.8, pocketDensity) + vec2(localTime * 0.18, -9.0));
        float pocketShape = smoothstep(0.74 - pocketDensity * 0.38, 0.98, pocketNoise);
        float pocketBreakup = smoothstep(0.24, 0.86, fbm(flow * vec2(3.7, 1.4) - vec2(localTime * 0.09, 0.0)));
        float pockets = pocketShape * pocketBreakup * mix(0.45, 1.35, pocketSize);

        float edgeWisps = smoothstep(0.22, 0.88, fbm(flow * vec2(6.0, 2.0) + vec2(localTime * 0.03, localTime * 0.11)));
        vec3 color = mix(shadowColor, poisonColor, cloudMask + pockets * 0.25);
        color = mix(color, highlightColor, clamp(pockets * 0.5 + edgeWisps * glow * 0.24, 0.0, 1.0));
        color += poisonColor * glow * (pockets * 0.26 + cloudMask * 0.12);
        float alpha = (baseAlpha + cloudMask * density * 0.64 + pockets * 0.34 + edgeWisps * glow * 0.12) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updatePoisonMaterialTuning(material: THREE.ShaderMaterial, tuning: PoisonEffectTuning) {
  material.uniforms.cloudScale.value = tuning.cloudScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.turbulence.value = tuning.turbulence;
  material.uniforms.density.value = tuning.density;
  material.uniforms.pocketDensity.value = tuning.pocketDensity;
  material.uniforms.pocketSize.value = tuning.pocketSize;
  material.uniforms.softness.value = tuning.softness;
  material.uniforms.drift.value = tuning.drift;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.poisonColor.value.set(tuning.poisonColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createColdMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      frostScale: { value: DEFAULT_COLD_EFFECT_TUNING.frostScale },
      speed: { value: DEFAULT_COLD_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_COLD_EFFECT_TUNING.directionDegrees) },
      veinDensity: { value: DEFAULT_COLD_EFFECT_TUNING.veinDensity },
      veinWidth: { value: DEFAULT_COLD_EFFECT_TUNING.veinWidth },
      crystalDensity: { value: DEFAULT_COLD_EFFECT_TUNING.crystalDensity },
      crystalSize: { value: DEFAULT_COLD_EFFECT_TUNING.crystalSize },
      haze: { value: DEFAULT_COLD_EFFECT_TUNING.haze },
      shimmer: { value: DEFAULT_COLD_EFFECT_TUNING.shimmer },
      glow: { value: DEFAULT_COLD_EFFECT_TUNING.glow },
      panFollow: { value: DEFAULT_COLD_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_COLD_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_COLD_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_COLD_EFFECT_TUNING.shadowColor) },
      frostColor: { value: new THREE.Color(DEFAULT_COLD_EFFECT_TUNING.frostColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_COLD_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float frostScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float veinDensity;
      uniform float veinWidth;
      uniform float crystalDensity;
      uniform float crystalSize;
      uniform float haze;
      uniform float shimmer;
      uniform float glow;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 frostColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.05;
          amplitude *= 0.52;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float frostVeins(vec2 uv, float localTime) {
        float field = 0.0;
        for (int layer = 0; layer < 4; layer++) {
          float layerSeed = float(layer) * 11.73;
          vec2 veinUv = rotate2d(float(layer) * 0.78 + directionRadians * 0.35) * uv;
          veinUv += vec2(fbm(veinUv * 1.3 + layerSeed), fbm(veinUv * 1.7 - layerSeed)) * 0.42;
          float lines = veinUv.x * mix(3.5, 12.0, veinDensity) + sin(veinUv.y * (2.0 + float(layer)) + localTime * 0.32 + layerSeed) * 0.45;
          float phase = abs(fract(lines) - 0.5);
          float width = mix(0.015, 0.075, veinWidth);
          float line = 1.0 - smoothstep(width, width + 0.025, phase);
          float breakup = smoothstep(0.24, 0.86, fbm(veinUv * vec2(2.5, 7.0) + vec2(layerSeed, localTime * 0.06)));
          field = max(field, line * breakup);
        }
        return field * veinDensity;
      }

      float crystalField(vec2 uv, float localTime) {
        float field = 0.0;
        float cells = mix(2.0, 9.0, crystalDensity) * mix(0.75, 1.3, crystalSize);
        for (int layer = 0; layer < 3; layer++) {
          float layerSeed = float(layer) * 31.19;
          vec2 gridUv = rotate2d(float(layer) * 1.4 + 0.2) * uv * (cells + float(layer) * 1.4);
          vec2 cell = floor(gridUv);
          vec2 fraction = fract(gridUv);
          float seed = randomValue(cell + layerSeed);
          float placed = smoothstep(0.83 - crystalDensity * 0.62, 0.98, seed);
          vec2 center = vec2(0.5) + (vec2(randomValue(cell + vec2(4.0, layerSeed)), randomValue(cell + vec2(13.0, layerSeed))) - 0.5) * 0.44;
          vec2 localPoint = fraction - center;
          float angle = randomValue(cell + vec2(7.0, layerSeed)) * 3.14159;
          localPoint = rotate2d(angle) * localPoint;
          float size = mix(0.1, 0.28, crystalSize);
          float shardA = 1.0 - smoothstep(size * 0.08, size * 0.18, abs(localPoint.x)) * smoothstep(size * 0.95, size * 1.25, abs(localPoint.y));
          float shardB = 1.0 - smoothstep(size * 0.07, size * 0.17, abs(localPoint.y)) * smoothstep(size * 0.75, size * 1.1, abs(localPoint.x));
          float diagonal = abs(localPoint.x + localPoint.y) * 0.72;
          float shardC = 1.0 - smoothstep(size * 0.055, size * 0.15, diagonal) * smoothstep(size * 0.85, size * 1.2, length(localPoint));
          float crystal = max(max(shardA, shardB), shardC * 0.72);
          crystal *= 1.0 - smoothstep(size * 0.95, size * 1.3, length(localPoint));
          float twinkle = 0.75 + sin(localTime * 4.0 + seed * 6.2831853) * 0.25 * shimmer;
          field = max(field, crystal * placed * twinkle);
        }
        return clamp(field, 0.0, 1.0);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 180.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;
        vec2 frostUv = uv * max(0.2, frostScale / 4.0);
        frostUv += vec2(fbm(frostUv * 0.9 + localTime * 0.08), fbm(frostUv * 1.2 - localTime * 0.05)) * shimmer * 0.22;

        float hazeField = smoothstep(0.22, 0.88, fbm(frostUv * 0.82 + vec2(localTime * 0.05, -localTime * 0.03)));
        float veins = frostVeins(frostUv, localTime);
        float crystals = crystalField(frostUv, localTime);
        float icyPatch = smoothstep(0.38, 0.92, fbm(frostUv * 1.7 - vec2(localTime * 0.025, 8.0)));

        vec3 color = mix(shadowColor, frostColor, hazeField * haze + icyPatch * 0.5 + veins * 0.32);
        color = mix(color, highlightColor, clamp(crystals * 0.82 + veins * 0.5 + shimmer * glow * hazeField * 0.18, 0.0, 1.0));
        color += frostColor * glow * (veins * 0.22 + crystals * 0.18 + icyPatch * 0.1);
        float alpha = (baseAlpha + hazeField * haze * 0.35 + icyPatch * 0.2 + veins * 0.34 + crystals * 0.38) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateColdMaterialTuning(material: THREE.ShaderMaterial, tuning: ColdEffectTuning) {
  material.uniforms.frostScale.value = tuning.frostScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.veinDensity.value = tuning.veinDensity;
  material.uniforms.veinWidth.value = tuning.veinWidth;
  material.uniforms.crystalDensity.value = tuning.crystalDensity;
  material.uniforms.crystalSize.value = tuning.crystalSize;
  material.uniforms.haze.value = tuning.haze;
  material.uniforms.shimmer.value = tuning.shimmer;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.frostColor.value.set(tuning.frostColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createDarknessMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      darknessScale: { value: DEFAULT_DARKNESS_EFFECT_TUNING.darknessScale },
      speed: { value: DEFAULT_DARKNESS_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_DARKNESS_EFFECT_TUNING.directionDegrees) },
      depth: { value: DEFAULT_DARKNESS_EFFECT_TUNING.depth },
      tendrilDensity: { value: DEFAULT_DARKNESS_EFFECT_TUNING.tendrilDensity },
      tendrilReach: { value: DEFAULT_DARKNESS_EFFECT_TUNING.tendrilReach },
      edgeSoftness: { value: DEFAULT_DARKNESS_EFFECT_TUNING.edgeSoftness },
      wispDensity: { value: DEFAULT_DARKNESS_EFFECT_TUNING.wispDensity },
      drift: { value: DEFAULT_DARKNESS_EFFECT_TUNING.drift },
      voidHighlight: { value: DEFAULT_DARKNESS_EFFECT_TUNING.voidHighlight },
      panFollow: { value: DEFAULT_DARKNESS_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_DARKNESS_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_DARKNESS_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_DARKNESS_EFFECT_TUNING.shadowColor) },
      voidColor: { value: new THREE.Color(DEFAULT_DARKNESS_EFFECT_TUNING.voidColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_DARKNESS_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float darknessScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float depth;
      uniform float tendrilDensity;
      uniform float tendrilReach;
      uniform float edgeSoftness;
      uniform float wispDensity;
      uniform float drift;
      uniform float voidHighlight;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 voidColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.02;
          amplitude *= 0.52;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float tendrilField(vec2 uv, float localTime) {
        float field = 0.0;
        for (int layer = 0; layer < 5; layer++) {
          float seed = float(layer) * 23.17;
          vec2 tendrilUv = rotate2d(directionRadians * 0.45 + float(layer) * 0.88) * uv;
          tendrilUv += vec2(
            fbm(tendrilUv * 0.9 + vec2(seed, localTime * 0.08)),
            fbm(tendrilUv * 1.2 + vec2(-seed, -localTime * 0.05))
          ) * mix(0.18, 0.72, drift);
          float spacing = mix(2.6, 10.0, tendrilDensity);
          float strand = tendrilUv.x * spacing + sin(tendrilUv.y * (2.2 + tendrilReach * 4.6) + seed + localTime * 0.35) * mix(0.3, 1.3, tendrilReach);
          float phase = abs(fract(strand) - 0.5);
          float width = mix(0.028, 0.12, tendrilReach);
          float line = 1.0 - smoothstep(width, width + mix(0.035, 0.13, edgeSoftness), phase);
          float broken = smoothstep(0.2, 0.9, fbm(tendrilUv * vec2(2.0, 5.4) + vec2(seed, localTime * 0.04)));
          field = max(field, line * broken);
        }
        return field * tendrilDensity;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 180.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;
        vec2 darknessUv = uv * max(0.18, darknessScale / 4.0);

        vec2 driftUv = darknessUv + vec2(
          fbm(darknessUv * 0.7 + localTime * 0.08),
          fbm(darknessUv * 0.95 - localTime * 0.06)
        ) * mix(0.15, 0.85, drift);

        float deepPatch = smoothstep(0.18, 0.92, fbm(driftUv * 1.2 + vec2(localTime * 0.035, -localTime * 0.02)));
        float voidPocket = smoothstep(0.48, 0.96, fbm(driftUv * 2.1 - vec2(localTime * 0.03, 9.0)));
        float wisps = smoothstep(0.5, 0.92, fbm(driftUv * vec2(1.4, 5.6) + vec2(localTime * 0.12, 18.0))) * wispDensity;
        float tendrils = tendrilField(driftUv, localTime);
        float softCloud = smoothstep(0.18, 0.86, fbm(driftUv * 0.62 - vec2(localTime * 0.02, localTime * 0.015)));
        float absorb = clamp(deepPatch * depth + voidPocket * depth * 0.58 + tendrils * 0.46 + softCloud * edgeSoftness * 0.24, 0.0, 1.0);
        float highlight = clamp((tendrils * 0.36 + wisps * 0.44 + voidPocket * 0.18) * voidHighlight, 0.0, 1.0);

        vec3 color = mix(shadowColor, voidColor, clamp(absorb * 1.18, 0.0, 1.0));
        color = mix(color, highlightColor, highlight);
        float alpha = (baseAlpha + absorb * 0.52 + tendrils * 0.18 + wisps * 0.16) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateDarknessMaterialTuning(material: THREE.ShaderMaterial, tuning: DarknessEffectTuning) {
  material.uniforms.darknessScale.value = tuning.darknessScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.depth.value = tuning.depth;
  material.uniforms.tendrilDensity.value = tuning.tendrilDensity;
  material.uniforms.tendrilReach.value = tuning.tendrilReach;
  material.uniforms.edgeSoftness.value = tuning.edgeSoftness;
  material.uniforms.wispDensity.value = tuning.wispDensity;
  material.uniforms.drift.value = tuning.drift;
  material.uniforms.voidHighlight.value = tuning.voidHighlight;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.voidColor.value.set(tuning.voidColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}


