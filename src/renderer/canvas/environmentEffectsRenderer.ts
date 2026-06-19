import * as THREE from "three";
import {
  DEFAULT_FOG_EFFECT_TUNING_SETTINGS,
  DEFAULT_FIRE_EFFECT_TUNING_SETTINGS,
  DEFAULT_LAVA_EFFECT_TUNING_SETTINGS,
  DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS,
  DEFAULT_WATER_EFFECT_TUNING_SETTINGS,
  type FogEffectTuningSettings,
  type FireEffectTuningSettings,
  type LavaEffectTuningSettings,
  type SmokeEffectTuningSettings,
  type WaterEffectTuningSettings
} from "../../shared/localvtt";

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WaterEffectTuning = WaterEffectTuningSettings;
export type LavaEffectTuning = LavaEffectTuningSettings;
export type FireEffectTuning = FireEffectTuningSettings;
export type SmokeEffectTuning = SmokeEffectTuningSettings;
export type FogEffectTuning = FogEffectTuningSettings;

export const DEFAULT_WATER_EFFECT_TUNING: WaterEffectTuning = DEFAULT_WATER_EFFECT_TUNING_SETTINGS;
export const DEFAULT_LAVA_EFFECT_TUNING: LavaEffectTuning = DEFAULT_LAVA_EFFECT_TUNING_SETTINGS;
export const DEFAULT_FIRE_EFFECT_TUNING: FireEffectTuning = DEFAULT_FIRE_EFFECT_TUNING_SETTINGS;
export const DEFAULT_SMOKE_EFFECT_TUNING: SmokeEffectTuning = DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS;
export const DEFAULT_FOG_EFFECT_TUNING: FogEffectTuning = DEFAULT_FOG_EFFECT_TUNING_SETTINGS;

export const WATER_EFFECT_PRESETS = {
  stream: {
    opacity: 0.92,
    bandScale: 6.6,
    bandWidth: 0.07,
    speed: 1.06,
    directionDegrees: 272,
    distortion: 0.03,
    verticalDistortion: 0.08,
    distortionVariation: 0.9,
    bandBreakup: 1,
    bandVariation: 1.35,
    bandOverlap: 0.42,
    panFollow: 1,
    zoomScale: -1,
    baseAlpha: 0.14,
    highlightAlpha: 0.44,
    deepColor: "#002e4d",
    waterColor: "#008cb8",
    highlightColor: "#ffffff"
  },
  river: {
    opacity: 0.59,
    bandScale: 14.2,
    bandWidth: 0.49,
    speed: 1.33,
    directionDegrees: 272,
    distortion: 0.11,
    verticalDistortion: 0.03,
    distortionVariation: 0.68,
    bandBreakup: 0.93,
    bandVariation: 4,
    bandOverlap: 0,
    panFollow: 1,
    zoomScale: -1,
    baseAlpha: 0.26,
    highlightAlpha: 0,
    deepColor: "#004d1a",
    waterColor: "#006280",
    highlightColor: "#c3f2fe"
  }
} as const satisfies Record<string, WaterEffectTuning>;

export const LAVA_EFFECT_PRESETS = {
  moltenFlow: { ...DEFAULT_LAVA_EFFECT_TUNING },
  magmaPool: {
    opacity: 0.86,
    flowScale: 8.5,
    speed: 0.18,
    directionDegrees: 12,
    distortion: 0.92,
    crust: 0.62,
    glow: 0.82,
    ember: 0.55,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.48,
    darkColor: "#210504",
    lavaColor: "#b71c1c",
    hotColor: "#ffec99"
  }
} as const satisfies Record<string, LavaEffectTuning>;

export const FIRE_EFFECT_PRESETS = {
  embers: {
    opacity: 0.64,
    flameScale: 8.4,
    speed: 0.28,
    directionDegrees: 270,
    turbulence: 0.52,
    tongues: 0.18,
    tongueVariation: 0.58,
    breakup: 0.8,
    flameStretch: 0.32,
    flicker: 0.46,
    ember: 0.82,
    heat: 0.38,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.22,
    emberColor: "#2b0a03",
    flameColor: "#b45309",
    hotColor: "#fef3c7"
  },
  flames: { ...DEFAULT_FIRE_EFFECT_TUNING },
  inferno: {
    opacity: 0.94,
    flameScale: 5.2,
    speed: 0.92,
    directionDegrees: 270,
    turbulence: 1.24,
    tongues: 0.72,
    tongueVariation: 0.92,
    breakup: 0.52,
    flameStretch: 0.82,
    flicker: 0.9,
    ember: 0.58,
    heat: 0.96,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.34,
    emberColor: "#450a0a",
    flameColor: "#ef4444",
    hotColor: "#fff7ad"
  }
} as const satisfies Record<string, FireEffectTuning>;

export const SMOKE_EFFECT_PRESETS = {
  driftingSmoke: { ...DEFAULT_SMOKE_EFFECT_TUNING },
  heavySmoke: {
    opacity: 0.72,
    cloudScale: 7.2,
    speed: 0.08,
    directionDegrees: 282,
    turbulence: 0.48,
    softness: 0.84,
    density: 0.74,
    lift: 0.12,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.32,
    shadowColor: "#2d3742",
    smokeColor: "#a6b0bb",
    highlightColor: "#eef2f7"
  }
} as const satisfies Record<string, SmokeEffectTuning>;

export const FOG_EFFECT_PRESETS = {
  lightMist: { ...DEFAULT_FOG_EFFECT_TUNING },
  lowFog: {
    opacity: 0.7,
    cloudScale: 4.2,
    speed: 0.06,
    directionDegrees: 276,
    turbulence: 0.34,
    softness: 0.94,
    density: 0.58,
    lift: 0.03,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.24,
    shadowColor: "#687482",
    smokeColor: "#c8d2dc",
    highlightColor: "#f8fbff"
  },
  thickMist: {
    opacity: 0.78,
    cloudScale: 3.2,
    speed: 0.04,
    directionDegrees: 288,
    turbulence: 0.5,
    softness: 0.98,
    density: 0.72,
    lift: 0.05,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.28,
    shadowColor: "#5f6c78",
    smokeColor: "#b8c4cf",
    highlightColor: "#eef5fb"
  }
} as const satisfies Record<string, FogEffectTuning>;

type WaterRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  meshA: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  meshB: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  startedAt: number;
  width: number;
  height: number;
};

let waterRuntime: WaterRuntime | null = null;
let lavaRuntime: WaterRuntime | null = null;
let fireRuntime: WaterRuntime | null = null;
let smokeRuntime: WaterRuntime | null = null;
let fogRuntime: WaterRuntime | null = null;

function getEffectWorldOrigin(bounds: ScreenBounds, cameraState: { x: number; y: number; zoom: number }) {
  const zoom = Math.max(cameraState.zoom, 0.01);
  return {
    x: (bounds.x - cameraState.x) / zoom,
    y: (bounds.y - cameraState.y) / zoom
  };
}

function updateCameraUniforms(material: THREE.ShaderMaterial, bounds: ScreenBounds, cameraState: { x: number; y: number; zoom: number }) {
  const origin = getEffectWorldOrigin(bounds, cameraState);
  material.uniforms.cameraOffset.value.set(cameraState.x, cameraState.y);
  material.uniforms.cameraZoom.value = cameraState.zoom;
  material.uniforms.effectOrigin.value.set(origin.x, origin.y);
}

export function drawEnvironmentWaterEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: WaterEffectTuning = DEFAULT_WATER_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getWaterRuntime(width, height);
  if (!runtime) {
    drawWaterFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionWaterMesh(runtime.meshA, width, height, 1);
  positionWaterMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = 0;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.82 + 19.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateWaterMaterialTuning(runtime.meshA.material, tuning);
  updateWaterMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentLavaEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: LavaEffectTuning = DEFAULT_LAVA_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getLavaRuntime(width, height);
  if (!runtime) {
    drawLavaFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionWaterMesh(runtime.meshA, width, height, 1);
  positionWaterMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = 0;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.74 + 9.3;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateLavaMaterialTuning(runtime.meshA.material, tuning);
  updateLavaMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentFireEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: FireEffectTuning = DEFAULT_FIRE_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getFireRuntime(width, height);
  if (!runtime) {
    drawFireFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionWaterMesh(runtime.meshA, width, height, 1);
  positionWaterMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.36;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 1.31 + 11.4;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateFireMaterialTuning(runtime.meshA.material, tuning);
  updateFireMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentSmokeEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: SmokeEffectTuning = DEFAULT_SMOKE_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getSmokeRuntime(width, height);
  if (!runtime) {
    drawSmokeFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionWaterMesh(runtime.meshA, width, height, 1);
  positionWaterMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.42;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.61 + 14.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateSmokeMaterialTuning(runtime.meshA.material, tuning);
  updateSmokeMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentFogEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: FogEffectTuning = DEFAULT_FOG_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getFogRuntime(width, height);
  if (!runtime) {
    drawFogFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionWaterMesh(runtime.meshA, width, height, 1);
  positionWaterMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.32;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.47 + 31.1;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateFogMaterialTuning(runtime.meshA.material, tuning);
  updateFogMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

function getWaterRuntime(width: number, height: number): WaterRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!waterRuntime) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createWaterMaterial(0.68);
    const materialB = createWaterMaterial(0.38);
    const meshA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    const meshB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    waterRuntime = {
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

  if (waterRuntime.width !== width || waterRuntime.height !== height) {
    waterRuntime.width = width;
    waterRuntime.height = height;
    waterRuntime.camera.left = 0;
    waterRuntime.camera.right = width;
    waterRuntime.camera.top = 0;
    waterRuntime.camera.bottom = height;
    waterRuntime.camera.near = 0.1;
    waterRuntime.camera.far = 5000;
    waterRuntime.camera.updateProjectionMatrix();
  }

  return waterRuntime;
}

function getLavaRuntime(width: number, height: number): WaterRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!lavaRuntime) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createLavaMaterial(0.9);
    const materialB = createLavaMaterial(0.35);
    const meshA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    const meshB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    lavaRuntime = {
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

  if (lavaRuntime.width !== width || lavaRuntime.height !== height) {
    lavaRuntime.width = width;
    lavaRuntime.height = height;
    lavaRuntime.camera.left = 0;
    lavaRuntime.camera.right = width;
    lavaRuntime.camera.top = 0;
    lavaRuntime.camera.bottom = height;
    lavaRuntime.camera.near = 0.1;
    lavaRuntime.camera.far = 5000;
    lavaRuntime.camera.updateProjectionMatrix();
  }

  return lavaRuntime;
}

function getFireRuntime(width: number, height: number): WaterRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!fireRuntime) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createFireMaterial(0.86);
    const materialB = createFireMaterial(0.34);
    const meshA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    const meshB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    fireRuntime = {
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

  if (fireRuntime.width !== width || fireRuntime.height !== height) {
    fireRuntime.width = width;
    fireRuntime.height = height;
    fireRuntime.camera.left = 0;
    fireRuntime.camera.right = width;
    fireRuntime.camera.top = 0;
    fireRuntime.camera.bottom = height;
    fireRuntime.camera.near = 0.1;
    fireRuntime.camera.far = 5000;
    fireRuntime.camera.updateProjectionMatrix();
  }

  return fireRuntime;
}

function getSmokeRuntime(width: number, height: number): WaterRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!smokeRuntime) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createSmokeMaterial(0.82);
    const materialB = createSmokeMaterial(0.36);
    const meshA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    const meshB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    smokeRuntime = {
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

  if (smokeRuntime.width !== width || smokeRuntime.height !== height) {
    smokeRuntime.width = width;
    smokeRuntime.height = height;
    smokeRuntime.camera.left = 0;
    smokeRuntime.camera.right = width;
    smokeRuntime.camera.top = 0;
    smokeRuntime.camera.bottom = height;
    smokeRuntime.camera.near = 0.1;
    smokeRuntime.camera.far = 5000;
    smokeRuntime.camera.updateProjectionMatrix();
  }

  return smokeRuntime;
}

function getFogRuntime(width: number, height: number): WaterRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!fogRuntime) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createFogMaterial(0.68);
    const materialB = createFogMaterial(0.28);
    const meshA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    const meshB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    fogRuntime = {
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

  if (fogRuntime.width !== width || fogRuntime.height !== height) {
    fogRuntime.width = width;
    fogRuntime.height = height;
    fogRuntime.camera.left = 0;
    fogRuntime.camera.right = width;
    fogRuntime.camera.top = 0;
    fogRuntime.camera.bottom = height;
    fogRuntime.camera.near = 0.1;
    fogRuntime.camera.far = 5000;
    fogRuntime.camera.updateProjectionMatrix();
  }

  return fogRuntime;
}

function createWaterMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      bandScale: { value: DEFAULT_WATER_EFFECT_TUNING.bandScale },
      bandWidth: { value: DEFAULT_WATER_EFFECT_TUNING.bandWidth },
      speed: { value: DEFAULT_WATER_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_WATER_EFFECT_TUNING.directionDegrees) },
      distortion: { value: DEFAULT_WATER_EFFECT_TUNING.distortion },
      verticalDistortion: { value: DEFAULT_WATER_EFFECT_TUNING.verticalDistortion },
      distortionVariation: { value: DEFAULT_WATER_EFFECT_TUNING.distortionVariation },
      bandBreakup: { value: DEFAULT_WATER_EFFECT_TUNING.bandBreakup },
      bandVariation: { value: DEFAULT_WATER_EFFECT_TUNING.bandVariation },
      bandOverlap: { value: DEFAULT_WATER_EFFECT_TUNING.bandOverlap },
      panFollow: { value: DEFAULT_WATER_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_WATER_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_WATER_EFFECT_TUNING.baseAlpha },
      highlightAlpha: { value: DEFAULT_WATER_EFFECT_TUNING.highlightAlpha },
      deepColor: { value: new THREE.Color(DEFAULT_WATER_EFFECT_TUNING.deepColor) },
      waterColor: { value: new THREE.Color(DEFAULT_WATER_EFFECT_TUNING.waterColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_WATER_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: Math.max(opacity, 0.75) }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float bandScale;
      uniform float bandWidth;
      uniform float speed;
      uniform float directionRadians;
      uniform float distortion;
      uniform float verticalDistortion;
      uniform float distortionVariation;
      uniform float bandBreakup;
      uniform float bandVariation;
      uniform float bandOverlap;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform float highlightAlpha;
      uniform vec3 deepColor;
      uniform vec3 waterColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;
      varying vec2 vUv;

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
        float motion = time * speed * 6.2831853;
        vec2 flowUv = uv;
        flowUv.x -= time * speed * 0.72;
        flowUv.y += sin(flowUv.x * 1.7 + motion * 0.12) * 0.035;
        float distortionNoise = valueNoise(pixelUv * vec2(1.15, 0.85) + vec2(motion * 0.018, -motion * 0.012));
        float distortionNoiseB = valueNoise(pixelUv * vec2(2.4, 1.7) - vec2(motion * 0.011, motion * 0.02));
        float distortionFactor = mix(1.0, 0.35 + distortionNoise * 1.55 + distortionNoiseB * 0.55, distortionVariation);
        float localHorizontalDistortion = distortion * distortionFactor;
        float localVerticalDistortion = verticalDistortion * distortionFactor;
        flowUv.x += sin(flowUv.y * 6.2831853 * 2.0 + motion) * localHorizontalDistortion;
        flowUv.y += cos(flowUv.x * 6.2831853 * 1.7 - motion * 0.82) * localVerticalDistortion;

        float spacingNoise = valueNoise(flowUv * vec2(1.35, 2.15) + vec2(motion * 0.018, -motion * 0.012)) - 0.5;
        float crossNoise = valueNoise(flowUv * vec2(2.8, 0.9) - vec2(motion * 0.01, motion * 0.016)) - 0.5;
        float diagonal = flowUv.x * bandScale + flowUv.y * bandScale * 0.3875 + (spacingNoise * 0.95 + crossNoise * 0.45) * bandVariation;
        float phase = abs(fract(diagonal) - 0.5);
        float primaryBand = 1.0 - smoothstep(bandWidth * 0.4, bandWidth, phase);
        float secondarySpacingNoise = valueNoise(flowUv * vec2(1.9, 1.15) - vec2(motion * 0.014, motion * 0.019)) - 0.5;
        float secondaryDiagonal = flowUv.x * bandScale * 0.78 - flowUv.y * bandScale * 0.52 + 0.23 + secondarySpacingNoise * bandVariation * 0.75;
        float secondaryPhase = abs(fract(secondaryDiagonal) - 0.5);
        float secondaryBand = 1.0 - smoothstep(bandWidth * 0.32, bandWidth * 1.12, secondaryPhase);
        float band = max(primaryBand, secondaryBand * bandOverlap);
        band += primaryBand * secondaryBand * bandOverlap * 0.55;
        band = clamp(band, 0.0, 1.0);
        float bodyLarge = valueNoise(flowUv * vec2(0.52, 0.88) + vec2(time * speed * 0.18, -time * speed * 0.08));
        float bodyMedium = valueNoise(flowUv * vec2(1.05, 1.7) - vec2(time * speed * 0.11, time * speed * 0.2));
        float bodyFine = valueNoise(flowUv * vec2(2.4, 3.1) + vec2(time * speed * 0.05, time * speed * 0.09));
        float body = smoothstep(0.22, 0.86, bodyLarge * 0.58 + bodyMedium * 0.3 + bodyFine * 0.12);
        float highlight = smoothstep(0.15, 0.88, band);
        float breakupPrimary = valueNoise(flowUv * vec2(3.0, 11.0) + vec2(motion * 0.08, 0.0));
        float breakupSecondary = valueNoise(flowUv * vec2(13.0, 4.0) - vec2(0.0, motion * 0.05));
        float breakupTertiary = valueNoise(flowUv * vec2(7.5, 7.0) + vec2(motion * 0.032, motion * 0.024));
        float brokenHighlight = smoothstep(0.24, 0.74, mix(mix(breakupPrimary, breakupSecondary, 0.38), breakupTertiary, 0.28));
        float segmentLong = valueNoise(flowUv * vec2(0.85, 5.8) + vec2(motion * 0.045, -motion * 0.018));
        float segmentShort = valueNoise(flowUv * vec2(5.4, 10.2) - vec2(motion * 0.03, motion * 0.052));
        float segmentPatch = smoothstep(0.42, 0.82, segmentLong * 0.72 + segmentShort * 0.28);
        brokenHighlight *= segmentPatch;
        highlight *= mix(1.0, brokenHighlight, bandBreakup);

        vec3 color = mix(deepColor, waterColor, body);
        color = mix(color, highlightColor, highlight);
        float alpha = (baseAlpha + body * 0.18 + highlight * highlightAlpha) * opacity;
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function updateWaterMaterialTuning(material: THREE.ShaderMaterial, tuning: WaterEffectTuning) {
  material.uniforms.bandScale.value = tuning.bandScale;
  material.uniforms.bandWidth.value = tuning.bandWidth;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.distortion.value = tuning.distortion;
  material.uniforms.verticalDistortion.value = tuning.verticalDistortion;
  material.uniforms.distortionVariation.value = tuning.distortionVariation;
  material.uniforms.bandBreakup.value = tuning.bandBreakup;
  material.uniforms.bandVariation.value = tuning.bandVariation;
  material.uniforms.bandOverlap.value = tuning.bandOverlap;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.highlightAlpha.value = tuning.highlightAlpha;
  material.uniforms.deepColor.value.set(tuning.deepColor);
  material.uniforms.waterColor.value.set(tuning.waterColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createLavaMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      flowScale: { value: DEFAULT_LAVA_EFFECT_TUNING.flowScale },
      speed: { value: DEFAULT_LAVA_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_LAVA_EFFECT_TUNING.directionDegrees) },
      distortion: { value: DEFAULT_LAVA_EFFECT_TUNING.distortion },
      crust: { value: DEFAULT_LAVA_EFFECT_TUNING.crust },
      glow: { value: DEFAULT_LAVA_EFFECT_TUNING.glow },
      ember: { value: DEFAULT_LAVA_EFFECT_TUNING.ember },
      panFollow: { value: DEFAULT_LAVA_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_LAVA_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_LAVA_EFFECT_TUNING.baseAlpha },
      darkColor: { value: new THREE.Color(DEFAULT_LAVA_EFFECT_TUNING.darkColor) },
      lavaColor: { value: new THREE.Color(DEFAULT_LAVA_EFFECT_TUNING.lavaColor) },
      hotColor: { value: new THREE.Color(DEFAULT_LAVA_EFFECT_TUNING.hotColor) },
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
      uniform float flowScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float distortion;
      uniform float crust;
      uniform float glow;
      uniform float ember;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 darkColor;
      uniform vec3 lavaColor;
      uniform vec3 hotColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;
      varying vec2 vUv;

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
          value *= 2.04;
          amplitude *= 0.5;
        }
        return total;
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
        float motion = time * speed;
        uv.x -= motion * 0.82;
        uv.y += sin(uv.x * 2.2 + motion * 2.6) * 0.08 * distortion;

        float molten = fbm(uv * flowScale + vec2(motion * 0.7, -motion * 0.18));
        float rolling = fbm(uv * flowScale * 0.48 - vec2(motion * 0.23, motion * 0.31));
        float crackNoise = fbm(uv * flowScale * 1.9 + vec2(motion * 0.12, motion * 0.08));
        float veins = smoothstep(0.54 + crust * 0.2, 0.95, molten + rolling * 0.55);
        float hot = smoothstep(0.62, 0.98, crackNoise * 0.52 + veins * 0.72);
        float crustMask = smoothstep(0.18, 0.78, crust - molten * 0.62 + rolling * 0.35);
        float emberNoise = randomValue(floor(uv * flowScale * 8.0) + floor(time * speed * 4.0));
        float emberMask = smoothstep(0.96 - ember * 0.22, 1.0, emberNoise) * smoothstep(0.45, 0.9, molten);

        vec3 color = mix(lavaColor, darkColor, crustMask);
        color = mix(color, lavaColor, veins * (0.45 + glow * 0.35));
        color = mix(color, hotColor, hot * glow);
        color = mix(color, hotColor, emberMask * ember);
        float alpha = (baseAlpha + veins * 0.24 + hot * glow * 0.24 + emberMask * ember * 0.2) * opacity;
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function updateLavaMaterialTuning(material: THREE.ShaderMaterial, tuning: LavaEffectTuning) {
  material.uniforms.flowScale.value = tuning.flowScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.distortion.value = tuning.distortion;
  material.uniforms.crust.value = tuning.crust;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.ember.value = tuning.ember;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.darkColor.value.set(tuning.darkColor);
  material.uniforms.lavaColor.value.set(tuning.lavaColor);
  material.uniforms.hotColor.value.set(tuning.hotColor);
}

function createFireMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      flameScale: { value: DEFAULT_FIRE_EFFECT_TUNING.flameScale },
      speed: { value: DEFAULT_FIRE_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_FIRE_EFFECT_TUNING.directionDegrees) },
      turbulence: { value: DEFAULT_FIRE_EFFECT_TUNING.turbulence },
      tongues: { value: DEFAULT_FIRE_EFFECT_TUNING.tongues },
      tongueVariation: { value: DEFAULT_FIRE_EFFECT_TUNING.tongueVariation },
      breakup: { value: DEFAULT_FIRE_EFFECT_TUNING.breakup },
      flameStretch: { value: DEFAULT_FIRE_EFFECT_TUNING.flameStretch },
      flicker: { value: DEFAULT_FIRE_EFFECT_TUNING.flicker },
      ember: { value: DEFAULT_FIRE_EFFECT_TUNING.ember },
      heat: { value: DEFAULT_FIRE_EFFECT_TUNING.heat },
      panFollow: { value: DEFAULT_FIRE_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_FIRE_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_FIRE_EFFECT_TUNING.baseAlpha },
      emberColor: { value: new THREE.Color(DEFAULT_FIRE_EFFECT_TUNING.emberColor) },
      flameColor: { value: new THREE.Color(DEFAULT_FIRE_EFFECT_TUNING.flameColor) },
      hotColor: { value: new THREE.Color(DEFAULT_FIRE_EFFECT_TUNING.hotColor) },
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
      uniform float flameScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float turbulence;
      uniform float tongues;
      uniform float tongueVariation;
      uniform float breakup;
      uniform float flameStretch;
      uniform float flicker;
      uniform float ember;
      uniform float heat;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 emberColor;
      uniform vec3 flameColor;
      uniform vec3 hotColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;
      varying vec2 vUv;

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
          value *= 2.06;
          amplitude *= 0.52;
        }
        return total;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 165.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float motion = time * speed;

        vec2 flameUv = uv;
        flameUv.x -= motion * 0.94;

        float stretch = mix(0.78, 1.65, flameStretch);
        vec2 stretchedUv = vec2(flameUv.x, flameUv.y * stretch);

        float broadWarpA = fbm(stretchedUv * vec2(flameScale * 0.16, flameScale * 0.14) + vec2(motion * 0.18, -motion * 0.09)) - 0.5;
        float broadWarpB = fbm(stretchedUv * vec2(flameScale * 0.24, flameScale * 0.19) - vec2(motion * 0.08, motion * 0.16)) - 0.5;
        float fineWarp = fbm(stretchedUv * vec2(flameScale * 0.74, flameScale * 0.58) + vec2(-motion * 0.22, motion * 0.25)) - 0.5;
        vec2 warpedUv = stretchedUv;
        warpedUv.x += (broadWarpA * 0.95 + fineWarp * 0.2) * turbulence * (0.18 + tongueVariation * 0.72);
        warpedUv.y += (broadWarpB * 0.7 + fineWarp * 0.18) * turbulence * (0.12 + tongueVariation * 0.58);

        float longNoise = fbm(warpedUv * vec2(flameScale * 0.26, flameScale * 0.54) + vec2(motion * 0.44, -motion * 0.15));
        float columnNoise = fbm(warpedUv * vec2(flameScale * mix(0.32, 0.72, tongues), flameScale * 1.28) - vec2(motion * 0.18, motion * 0.44));
        float forkNoise = fbm(warpedUv * vec2(flameScale * 0.72, flameScale * 1.86) + vec2(-motion * 0.35, motion * 0.21));
        float fineNoise = fbm(warpedUv * vec2(flameScale * 1.82, flameScale * 2.65) + vec2(motion * 0.27, motion * 0.58));

        float largeChunkScale = mix(0.55, 1.45, breakup);
        float chunkNoise = fbm(warpedUv * vec2(flameScale * largeChunkScale * 0.28, flameScale * largeChunkScale * 0.36) + vec2(motion * 0.09, -motion * 0.06));
        float chunkGate = smoothstep(mix(0.18, 0.46, breakup), mix(0.82, 0.62, breakup), chunkNoise + longNoise * 0.18);

        float tongueField = smoothstep(0.2, 0.86, columnNoise * 0.58 + forkNoise * 0.34 + broadWarpA * 0.18);
        tongueField = mix(0.64, tongueField, tongues);

        float flickerPulse = 0.8 + sin(time * speed * 16.0 + longNoise * 5.0 + broadWarpB * 3.0) * 0.13 * flicker + fineNoise * 0.24 * flicker;
        float flameBody = smoothstep(0.31, 0.86, longNoise * 0.38 + columnNoise * 0.28 + forkNoise * 0.24 + fineNoise * 0.14 + tongueField * 0.22);
        flameBody *= mix(1.0, chunkGate, breakup);
        flameBody *= flickerPulse;
        flameBody = clamp(flameBody, 0.0, 1.0);

        float hotCore = smoothstep(0.58, 0.98, flameBody + fineNoise * 0.26 + heat * 0.2);
        float emberNoise = randomValue(floor(flameUv * flameScale * vec2(7.0, 9.0)) + floor(time * speed * 8.0));
        float emberMask = smoothstep(0.94 - ember * 0.28, 1.0, emberNoise) * smoothstep(0.22, 0.88, flameBody);

        vec3 color = mix(emberColor, flameColor, flameBody);
        color = mix(color, hotColor, hotCore * heat);
        color = mix(color, hotColor, emberMask * ember);
        float alpha = (baseAlpha + flameBody * 0.38 + hotCore * heat * 0.18 + emberMask * ember * 0.18) * opacity;
        alpha *= smoothstep(0.04, 0.18, flameBody + emberMask * 0.4);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function updateFireMaterialTuning(material: THREE.ShaderMaterial, tuning: FireEffectTuning) {
  material.uniforms.flameScale.value = tuning.flameScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.turbulence.value = tuning.turbulence;
  material.uniforms.tongues.value = tuning.tongues;
  material.uniforms.tongueVariation.value = tuning.tongueVariation;
  material.uniforms.breakup.value = tuning.breakup;
  material.uniforms.flameStretch.value = tuning.flameStretch;
  material.uniforms.flicker.value = tuning.flicker;
  material.uniforms.ember.value = tuning.ember;
  material.uniforms.heat.value = tuning.heat;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.emberColor.value.set(tuning.emberColor);
  material.uniforms.flameColor.value.set(tuning.flameColor);
  material.uniforms.hotColor.value.set(tuning.hotColor);
}

function createSmokeMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      cloudScale: { value: DEFAULT_SMOKE_EFFECT_TUNING.cloudScale },
      speed: { value: DEFAULT_SMOKE_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_SMOKE_EFFECT_TUNING.directionDegrees) },
      turbulence: { value: DEFAULT_SMOKE_EFFECT_TUNING.turbulence },
      softness: { value: DEFAULT_SMOKE_EFFECT_TUNING.softness },
      density: { value: DEFAULT_SMOKE_EFFECT_TUNING.density },
      lift: { value: DEFAULT_SMOKE_EFFECT_TUNING.lift },
      panFollow: { value: DEFAULT_SMOKE_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_SMOKE_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_SMOKE_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_SMOKE_EFFECT_TUNING.shadowColor) },
      smokeColor: { value: new THREE.Color(DEFAULT_SMOKE_EFFECT_TUNING.smokeColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_SMOKE_EFFECT_TUNING.highlightColor) },
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
      uniform float softness;
      uniform float density;
      uniform float lift;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 smokeColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;
      varying vec2 vUv;

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

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 210.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float motion = time * speed;
        uv.x -= motion * 0.64;
        uv.y -= motion * lift;

        float swirlA = fbm(uv * cloudScale * 0.46 + vec2(motion * 0.11, -motion * 0.08));
        float swirlB = fbm(uv * cloudScale * 0.92 - vec2(motion * 0.08, motion * 0.16));
        vec2 turbulentUv = uv;
        turbulentUv.x += (swirlA - 0.5) * turbulence * 0.44;
        turbulentUv.y += (swirlB - 0.5) * turbulence * 0.36;

        float cloudLarge = fbm(turbulentUv * cloudScale * 0.58 + vec2(motion * 0.18, -motion * 0.05));
        float cloudMedium = fbm(turbulentUv * cloudScale * 1.18 - vec2(motion * 0.11, motion * 0.07));
        float cloudFine = fbm(turbulentUv * cloudScale * 2.25 + vec2(-motion * 0.04, motion * 0.09));
        float cloud = cloudLarge * 0.58 + cloudMedium * 0.3 + cloudFine * 0.12;
        float threshold = mix(0.68, 0.28, density);
        float feather = mix(0.08, 0.34, softness);
        float body = smoothstep(threshold - feather, threshold + feather, cloud);
        float highlight = smoothstep(0.58, 0.92, cloudLarge * 0.75 + cloudFine * 0.25);
        float shadow = smoothstep(0.16, 0.62, 1.0 - cloudMedium);
        vec3 color = mix(shadowColor, smokeColor, body);
        color = mix(color, highlightColor, highlight * softness * 0.55);
        float alpha = (baseAlpha + body * density * 0.44 + highlight * 0.08) * opacity;
        alpha *= smoothstep(0.02, 0.12, body + density * 0.2);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function updateSmokeMaterialTuning(material: THREE.ShaderMaterial, tuning: SmokeEffectTuning) {
  material.uniforms.cloudScale.value = tuning.cloudScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.turbulence.value = tuning.turbulence;
  material.uniforms.softness.value = tuning.softness;
  material.uniforms.density.value = tuning.density;
  material.uniforms.lift.value = tuning.lift;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.smokeColor.value.set(tuning.smokeColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createFogMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      cloudScale: { value: DEFAULT_FOG_EFFECT_TUNING.cloudScale },
      speed: { value: DEFAULT_FOG_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_FOG_EFFECT_TUNING.directionDegrees) },
      turbulence: { value: DEFAULT_FOG_EFFECT_TUNING.turbulence },
      softness: { value: DEFAULT_FOG_EFFECT_TUNING.softness },
      density: { value: DEFAULT_FOG_EFFECT_TUNING.density },
      lift: { value: DEFAULT_FOG_EFFECT_TUNING.lift },
      panFollow: { value: DEFAULT_FOG_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_FOG_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_FOG_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_FOG_EFFECT_TUNING.shadowColor) },
      smokeColor: { value: new THREE.Color(DEFAULT_FOG_EFFECT_TUNING.smokeColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_FOG_EFFECT_TUNING.highlightColor) },
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
      uniform float softness;
      uniform float density;
      uniform float lift;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 smokeColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;
      varying vec2 vUv;

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
          amplitude *= 0.54;
        }
        return total;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 260.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float motion = time * speed;

        vec2 driftUv = uv;
        driftUv.x -= motion * 0.34;
        driftUv.y -= motion * lift * 0.26;

        float sheetA = fbm(driftUv * vec2(cloudScale * 0.24, cloudScale * 0.1) + vec2(motion * 0.05, -motion * 0.015));
        float sheetB = fbm(driftUv * vec2(cloudScale * 0.16, cloudScale * 0.16) - vec2(motion * 0.035, motion * 0.025));
        float sheetC = fbm(driftUv * vec2(cloudScale * 0.34, cloudScale * 0.22) + vec2(-motion * 0.025, motion * 0.018));
        float veil = smoothstep(0.22, 0.88, sheetA * 0.48 + sheetB * 0.34 + sheetC * 0.18);

        float driftPatchA = fbm(driftUv * vec2(cloudScale * 0.42, cloudScale * 0.2) + vec2(motion * 0.08, motion * 0.02));
        float driftPatchB = fbm(driftUv * vec2(cloudScale * 0.22, cloudScale * 0.44) - vec2(motion * 0.03, motion * 0.055));
        float broadPatch = smoothstep(0.34, 0.88, driftPatchA * 0.62 + driftPatchB * 0.38 + veil * 0.16);

        vec2 wispUv = driftUv;
        wispUv.x += (sheetB - 0.5) * turbulence * 0.32;
        wispUv.y += (sheetA - 0.5) * turbulence * 0.18;
        float eddyA = fbm(wispUv * cloudScale * 0.72 + vec2(motion * 0.08, motion * 0.03));
        float eddyB = fbm(wispUv * cloudScale * 1.2 - vec2(motion * 0.045, motion * 0.055));
        float wisps = smoothstep(0.42, 0.92, eddyA * 0.5 + eddyB * 0.36 + broadPatch * 0.24);
        wisps *= mix(0.58, 1.0, turbulence);

        float thinBreaks = fbm(driftUv * vec2(cloudScale * 1.65, cloudScale * 0.32) + vec2(-motion * 0.12, motion * 0.02));
        float body = clamp(veil * 0.5 + broadPatch * 0.22 + wisps * 0.36 - thinBreaks * (0.2 + softness * 0.16), 0.0, 1.0);
        body = smoothstep(0.12, mix(0.9, 0.42, density), body);

        float highlight = smoothstep(0.54, 0.96, sheetA * 0.62 + thinBreaks * 0.38) * softness;
        vec3 color = mix(shadowColor, smokeColor, body);
        color = mix(color, highlightColor, highlight * 0.34);
        float alpha = (baseAlpha + body * density * 0.34 + broadPatch * 0.06 + highlight * 0.05) * opacity;
        alpha *= smoothstep(0.02, 0.2, body + density * 0.16);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function updateFogMaterialTuning(material: THREE.ShaderMaterial, tuning: FogEffectTuning) {
  material.uniforms.cloudScale.value = tuning.cloudScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.turbulence.value = tuning.turbulence;
  material.uniforms.softness.value = tuning.softness;
  material.uniforms.density.value = tuning.density;
  material.uniforms.lift.value = tuning.lift;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.smokeColor.value.set(tuning.smokeColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function positionWaterMesh(mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>, width: number, height: number, scale: number) {
  mesh.position.x = width / 2;
  mesh.position.y = height / 2;
  mesh.scale.x = width * scale;
  mesh.scale.y = height * scale;
}

function drawWaterFallback(ctx: CanvasRenderingContext2D, bounds: ScreenBounds, layerOpacity: number) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity)) * 0.18;
  ctx.fillStyle = "rgb(0, 145, 190)";
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawLavaFallback(ctx: CanvasRenderingContext2D, bounds: ScreenBounds, layerOpacity: number) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity)) * 0.42;
  ctx.fillStyle = "rgb(216, 67, 21)";
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawFireFallback(ctx: CanvasRenderingContext2D, bounds: ScreenBounds, layerOpacity: number) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity)) * 0.36;
  ctx.fillStyle = "rgb(249, 115, 22)";
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawSmokeFallback(ctx: CanvasRenderingContext2D, bounds: ScreenBounds, layerOpacity: number) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity)) * 0.24;
  ctx.fillStyle = "rgb(140, 152, 165)";
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawFogFallback(ctx: CanvasRenderingContext2D, bounds: ScreenBounds, layerOpacity: number) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity)) * 0.18;
  ctx.fillStyle = "rgb(190, 204, 216)";
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}
