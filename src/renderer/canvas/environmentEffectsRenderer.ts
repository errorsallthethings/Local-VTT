import * as THREE from "three";
import { DEFAULT_WATER_EFFECT_TUNING_SETTINGS, type WaterEffectTuningSettings } from "../../shared/localvtt";

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WaterEffectTuning = WaterEffectTuningSettings;

export const DEFAULT_WATER_EFFECT_TUNING: WaterEffectTuning = DEFAULT_WATER_EFFECT_TUNING_SETTINGS;

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
  runtime.meshA.material.uniforms.cameraOffset.value.set(cameraState.x, -cameraState.y);
  runtime.meshB.material.uniforms.cameraOffset.value.set(cameraState.x, -cameraState.y);
  runtime.meshA.material.uniforms.cameraZoom.value = cameraState.zoom;
  runtime.meshB.material.uniforms.cameraZoom.value = cameraState.zoom;
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
        float zoomFactor = pow(max(cameraZoom, 0.01), zoomScale);
        vec2 anchoredCoord = gl_FragCoord.xy - cameraOffset * panFollow;
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
  material.uniforms.panFollow.value = tuning.panFollow;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.highlightAlpha.value = tuning.highlightAlpha;
  material.uniforms.deepColor.value.set(tuning.deepColor);
  material.uniforms.waterColor.value.set(tuning.waterColor);
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
