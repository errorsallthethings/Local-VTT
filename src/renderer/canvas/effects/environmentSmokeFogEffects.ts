import * as THREE from "three";
import {
  DEFAULT_FOG_EFFECT_TUNING,
  DEFAULT_SMOKE_EFFECT_TUNING,
  type FogEffectTuning,
  type SmokeEffectTuning
} from "./environmentEffectTuningDefaults";
import { drawFogFallback, drawSmokeFallback } from "./environmentEffectFallbacks";
import { degreesToRadians, type ScreenBounds } from "./environmentEffectRendererMath";
import {
  disposeEnvironmentEffectRuntime,
  getSharedEffectPlaneGeometry,
  getSharedEnvironmentEffectRenderer,
  positionEnvironmentEffectMesh,
  updateEnvironmentEffectCameraUniforms,
  type EnvironmentEffectRuntime
} from "./environmentEffectRuntime";

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

let smokeRuntime: EnvironmentEffectRuntime | null = null;
let fogRuntime: EnvironmentEffectRuntime | null = null;

export function disposeSmokeFogEffectRuntimes(): void {
  disposeEnvironmentEffectRuntime(smokeRuntime);
  disposeEnvironmentEffectRuntime(fogRuntime);
  smokeRuntime = null;
  fogRuntime = null;
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

  drawSmokeFallback(ctx, bounds, layerOpacity * 0.28);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.42;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.61 + 14.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
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
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.32;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.47 + 31.1;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
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

function getSmokeRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!smokeRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createSmokeMaterial(0.82);
    const materialB = createSmokeMaterial(0.36);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
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

function getFogRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!fogRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createFogMaterial(0.68);
    const materialB = createFogMaterial(0.28);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
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
        float alpha = (max(baseAlpha * 0.68, 0.08) + body * density * 0.5 + highlight * 0.1) * opacity;
        alpha *= mix(0.48, 1.0, smoothstep(0.01, 0.12, body + density * 0.24 + baseAlpha * 0.32));
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


