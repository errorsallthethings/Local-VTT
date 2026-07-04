import * as THREE from "three";
import {
  DEFAULT_FIRE_EFFECT_TUNING,
  DEFAULT_LAVA_EFFECT_TUNING,
  DEFAULT_LIGHTNING_EFFECT_TUNING,
  type FireEffectTuning,
  type LavaEffectTuning,
  type LightningEffectTuning
} from "./environmentEffectTuningDefaults";
import { drawFireFallback, drawLavaFallback, drawLightningFallback } from "./environmentEffectFallbacks";
import { degreesToRadians, type ScreenBounds } from "./environmentEffectRendererMath";
import {
  disposeEnvironmentEffectRuntime,
  getSharedEffectPlaneGeometry,
  getSharedEnvironmentEffectRenderer,
  positionEnvironmentEffectMesh,
  updateEnvironmentEffectCameraUniforms,
  type EnvironmentEffectRuntime
} from "./environmentEffectRuntime";

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

export const LIGHTNING_EFFECT_PRESETS = {
  arcingField: { ...DEFAULT_LIGHTNING_EFFECT_TUNING },
  stormSurge: {
    opacity: 0.94,
    arcScale: 0.5,
    speed: 0.77,
    directionDegrees: 26,
    boltDensity: 1,
    branchiness: 0.7,
    jitter: 0.01,
    glow: 1,
    strikeWidth: 1,
    segmentBreaks: 1,
    panFollow: 1,
    zoomScale: 0.85,
    baseAlpha: 0.32,
    backgroundColor: "#07111f",
    arcColor: "#facc15",
    coreColor: "#ffffff"
  },
  staticWeb: {
    opacity: 0.9,
    arcScale: 1.25,
    speed: 0.28,
    directionDegrees: 344,
    boltDensity: 0.66,
    branchiness: 0.86,
    jitter: 0.76,
    glow: 0.7,
    strikeWidth: 0.56,
    segmentBreaks: 0.72,
    panFollow: 1,
    zoomScale: 1.15,
    baseAlpha: 0.22,
    backgroundColor: "#080f24",
    arcColor: "#93c5fd",
    coreColor: "#f8fbff"
  }
} as const satisfies Record<string, LightningEffectTuning>;

let lavaRuntime: EnvironmentEffectRuntime | null = null;
let fireRuntime: EnvironmentEffectRuntime | null = null;
let lightningRuntime: EnvironmentEffectRuntime | null = null;

export function disposeElementalEffectRuntimes(): void {
  disposeEnvironmentEffectRuntime(lavaRuntime);
  disposeEnvironmentEffectRuntime(fireRuntime);
  disposeEnvironmentEffectRuntime(lightningRuntime);
  lavaRuntime = null;
  fireRuntime = null;
  lightningRuntime = null;
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
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = 0;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.74 + 9.3;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
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

  drawFireFallback(ctx, bounds, layerOpacity * 0.36);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.36;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 1.31 + 11.4;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
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

export function drawEnvironmentLightningEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: LightningEffectTuning = DEFAULT_LIGHTNING_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getLightningRuntime(width, height);
  if (!runtime) {
    drawLightningFallback(ctx, bounds, layerOpacity);
    return;
  }

  drawLightningFallback(ctx, bounds, layerOpacity * 0.32);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = 0;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.77 + 17.2;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  _updateLightningMaterialTuning(runtime.meshA.material, tuning);
  _updateLightningMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

function getLavaRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!lavaRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createLavaMaterial(0.9);
    const materialB = createLavaMaterial(0.35);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
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

function getFireRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!fireRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createFireMaterial(0.86);
    const materialB = createFireMaterial(0.34);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
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

function getLightningRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!lightningRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = _createLightningMaterial(0.9);
    const materialB = _createLightningMaterial(0.35);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    lightningRuntime = {
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

  if (lightningRuntime.width !== width || lightningRuntime.height !== height) {
    lightningRuntime.width = width;
    lightningRuntime.height = height;
    lightningRuntime.camera.left = 0;
    lightningRuntime.camera.right = width;
    lightningRuntime.camera.top = 0;
    lightningRuntime.camera.bottom = height;
    lightningRuntime.camera.near = 0.1;
    lightningRuntime.camera.far = 5000;
    lightningRuntime.camera.updateProjectionMatrix();
  }

  return lightningRuntime;
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
        float alpha = (max(baseAlpha * 0.42, 0.08) + flameBody * 0.42 + hotCore * heat * 0.2 + emberMask * ember * 0.2) * opacity;
        float alphaGate = smoothstep(0.01, 0.12, flameBody + emberMask * 0.45 + baseAlpha * 0.35);
        alpha *= mix(0.48, 1.0, alphaGate);
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

function _createLightningMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      arcScale: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.arcScale },
      speed: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_LIGHTNING_EFFECT_TUNING.directionDegrees) },
      boltDensity: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.boltDensity },
      branchiness: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.branchiness },
      jitter: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.jitter },
      glow: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.glow },
      strikeWidth: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.strikeWidth },
      segmentBreaks: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.segmentBreaks },
      panFollow: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_LIGHTNING_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_LIGHTNING_EFFECT_TUNING.backgroundColor) },
      arcColor: { value: new THREE.Color(DEFAULT_LIGHTNING_EFFECT_TUNING.arcColor) },
      coreColor: { value: new THREE.Color(DEFAULT_LIGHTNING_EFFECT_TUNING.coreColor) },
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
      uniform float arcScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float boltDensity;
      uniform float branchiness;
      uniform float jitter;
      uniform float glow;
      uniform float strikeWidth;
      uniform float segmentBreaks;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 arcColor;
      uniform vec3 coreColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;
      varying vec2 vUv;

      const float PI = 3.14159265358979323846264;

      float perlin(vec3 P) {
        vec3 Pi = floor(P);
        vec3 Pf = P - Pi;
        vec3 PfMin1 = Pf - 1.0;

        Pi.xyz = Pi.xyz - floor(Pi.xyz * (1.0 / 69.0)) * 69.0;
        vec3 PiInc1 = step(Pi, vec3(69.0 - 1.5)) * (Pi + 1.0);

        vec4 Pt = vec4(Pi.xy, PiInc1.xy) + vec2(50.0, 161.0).xyxy;
        Pt *= Pt;
        Pt = Pt.xzxz * Pt.yyww;
        const vec3 largeFloats = vec3(635.298681, 682.357502, 668.926525);
        const vec3 zinc = vec3(48.500388, 65.294118, 63.934599);
        vec3 lowzMod = vec3(1.0 / (largeFloats + Pi.zzz * zinc));
        vec3 highzMod = vec3(1.0 / (largeFloats + PiInc1.zzz * zinc));
        vec4 hashx0 = fract(Pt * lowzMod.xxxx);
        vec4 hashx1 = fract(Pt * highzMod.xxxx);
        vec4 hashy0 = fract(Pt * lowzMod.yyyy);
        vec4 hashy1 = fract(Pt * highzMod.yyyy);
        vec4 hashz0 = fract(Pt * lowzMod.zzzz);
        vec4 hashz1 = fract(Pt * highzMod.zzzz);

        vec4 gradX0 = hashx0 - 0.49999;
        vec4 gradY0 = hashy0 - 0.49999;
        vec4 gradZ0 = hashz0 - 0.49999;
        vec4 gradX1 = hashx1 - 0.49999;
        vec4 gradY1 = hashy1 - 0.49999;
        vec4 gradZ1 = hashz1 - 0.49999;
        vec4 gradResults0 = inversesqrt(gradX0 * gradX0 + gradY0 * gradY0 + gradZ0 * gradZ0) * (vec2(Pf.x, PfMin1.x).xyxy * gradX0 + vec2(Pf.y, PfMin1.y).xxyy * gradY0 + Pf.zzzz * gradZ0);
        vec4 gradResults1 = inversesqrt(gradX1 * gradX1 + gradY1 * gradY1 + gradZ1 * gradZ1) * (vec2(Pf.x, PfMin1.x).xyxy * gradX1 + vec2(Pf.y, PfMin1.y).xxyy * gradY1 + PfMin1.zzzz * gradZ1);

        vec3 blend = Pf * Pf * Pf * (Pf * (Pf * 6.0 - 15.0) + 10.0);
        vec4 res0 = mix(gradResults0, gradResults1, blend.z);
        vec4 blend2 = vec4(blend.xy, vec2(1.0 - blend.xy));
        float finalValue = dot(res0, blend2.zxzx * blend2.wwyy);
        return finalValue * 1.1547005383792515;
      }

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float tokenMagicFbm(vec3 p, float localTime) {
        float v = 0.0;
        v += perlin(p * 0.9) * 1.5 * cos(PI * localTime * 0.48);
        v += perlin(p * 3.99) * 0.5 * sin(PI * localTime * 0.4);
        v += perlin(p * 8.01) * 0.4 * cos(PI * localTime * 0.4);
        v += perlin(p * 15.05) * 0.05 * sin(PI * localTime * 0.8);
        return v;
      }

      vec3 electricColor(vec2 filterCoord) {
        vec3 noiseVec = vec3(filterCoord, 1.0);
        vec3 result = vec3(0.0);
        float localPhase = perlin(vec3(filterCoord * 0.19 + vec2(31.0, 11.0), 2.0)) * 1.8;
        float motionTime = time * speed;
        float localTime = motionTime + localPhase + perlin(vec3(filterCoord * 0.07 + vec2(3.0, 41.0), motionTime * 0.025)) * 0.9;
        for (int i = 0; i < 5; ++i) {
          noiseVec = noiseVec.yxz;
          float branchPhase = float(i);
          float densityPassGate = i == 0 ? smoothstep(0.02, 0.18, boltDensity) : smoothstep(branchPhase * 0.17, branchPhase * 0.17 + 0.28, boltDensity);
          float branchGate = i == 0 ? 1.0 : smoothstep(branchPhase * 0.14, branchPhase * 0.14 + 0.28, branchiness);
          float branchOffset = perlin(vec3(filterCoord * (0.42 + branchPhase * 0.18) + branchPhase * 7.0, motionTime * 0.045)) * jitter * branchiness * 0.26;
          float divisor = max(abs(tokenMagicFbm(noiseVec + vec3(branchOffset, localTime / float(i + 4), -branchOffset * 0.55), localTime) * 120.0), 0.001);
          float t = abs(2.0 / divisor);
          result += t * vec3(float(i + 1) * 0.1 + 0.1, 0.5, 2.0) * branchGate * densityPassGate;
        }
        return result;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 128.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        uv *= arcScale * 0.46;
        float motionTime = time * speed;
        uv.x += motionTime * 0.12;
        vec2 broadWarp = vec2(
          perlin(vec3(uv * 0.27 + vec2(4.0, 13.0), motionTime * 0.06)),
          perlin(vec3(uv.yx * 0.31 + vec2(17.0, 2.0), motionTime * 0.055))
        );
        uv += broadWarp * jitter * 0.34;
        uv.y += sin(uv.x * (0.55 + branchiness * 1.15) + motionTime) * jitter * 0.12;

        vec3 electric = electricColor(uv) * arcColor * 1.55;
        float energy = max(max(electric.r, electric.g), electric.b);
        float normalizedEnergy = log(1.0 + energy * 0.82);
        normalizedEnergy = normalizedEnergy / (1.0 + normalizedEnergy);
        float wideBreakup = perlin(vec3(uv * 0.34 + vec2(23.0, 7.0), motionTime * 0.035)) * 0.5 + 0.5;
        float pocketBreakup = perlin(vec3(uv.yx * 0.83 + vec2(5.0, 29.0), motionTime * 0.05)) * 0.5 + 0.5;
        float breakup = clamp(wideBreakup * 0.72 + pocketBreakup * 0.42, 0.0, 1.0);
        float visibleEnergy = normalizedEnergy * mix(0.38, 1.18, breakup);
        float survivors = smoothstep(0.2, 0.78, visibleEnergy);
        float widthBoost = smoothstep(0.2 - strikeWidth * 0.12, 0.78, visibleEnergy) * survivors;
        float segmentNoise = perlin(vec3(vec2(uv.x * (1.8 + arcScale * 0.06), uv.y * 0.32) + vec2(61.0, 17.0), motionTime * 0.055)) * 0.5 + 0.5;
        float segmentNoiseFine = perlin(vec3(vec2(uv.x * (4.4 + arcScale * 0.09), uv.y * 0.74) + vec2(7.0, 73.0), motionTime * 0.08)) * 0.5 + 0.5;
        float segmentMask = smoothstep(0.24, 0.72, segmentNoise * 0.7 + segmentNoiseFine * 0.36);
        float segmentGate = mix(1.0, mix(0.38, 1.0, segmentMask), segmentBreaks);
        float shapedEnergy = pow(clamp(max(survivors, widthBoost * strikeWidth * 0.72) * segmentGate * normalizedEnergy * (1.2 + glow * 0.65), 0.0, 1.0), mix(2.35, 0.62, strikeWidth));
        vec3 color = mix(backgroundColor, electric, shapedEnergy);
        float coreShape = smoothstep(0.64, 1.0, shapedEnergy);
        color = mix(color, coreColor, coreShape * glow);
        float alpha = (baseAlpha * (0.32 + breakup * 0.18) + shapedEnergy * (0.98 + glow * 0.62)) * opacity;
        alpha *= mix(0.5, 1.0, smoothstep(0.01, 0.13, shapedEnergy + baseAlpha * 0.28));
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function _updateLightningMaterialTuning(material: THREE.ShaderMaterial, tuning: LightningEffectTuning) {
  material.uniforms.arcScale.value = tuning.arcScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.boltDensity.value = tuning.boltDensity;
  material.uniforms.branchiness.value = tuning.branchiness;
  material.uniforms.jitter.value = tuning.jitter;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.strikeWidth.value = tuning.strikeWidth;
  material.uniforms.segmentBreaks.value = tuning.segmentBreaks;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.arcColor.value.set(tuning.arcColor);
  material.uniforms.coreColor.value.set(tuning.coreColor);
}


