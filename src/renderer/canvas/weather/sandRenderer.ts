import * as THREE from "three";
import type { Camera } from "../camera";
import type { WeatherSettings } from "../../../shared/localvtt";
import { SAND_PRESETS, createSandParticle, createSandVeilMesh, getMinimumWeatherDimension, getWeatherDriftVector, getWeatherParticleCount, isSandEffect, smoothstep, updateSandVeilMesh, type SandParticle, type SandPreset, type WeatherArea, type WeatherBounds } from "./weatherCore";

export class SandRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  private veil: THREE.Mesh | null = null;
  private sand: THREE.Points | null = null;
  private particles: SandParticle[] = [];
  private positions = new Float32Array(0);
  private colors = new Float32Array(0);
  private sizes = new Float32Array(0);
  private alphas = new Float32Array(0);
  private signature = "";

  draw(ctx: CanvasRenderingContext2D, area: WeatherArea, weather: WeatherSettings, camera: Camera, now: number, opacity: number, clipPath: Path2D) {
    if (!isSandEffect(weather.effect)) {
      return;
    }
    const bounds = area.clip;
    const preset = SAND_PRESETS[weather.effect];
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
      weather.directionDegrees.toFixed(0),
      weather.driftStrength.toFixed(2),
      weather.color,
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
    ctx.clip(clipPath, "evenodd");
    ctx.drawImage(renderer.domElement, 0, 0, width, height);
    ctx.restore();
  }

  private getRenderer(width: number, height: number) {
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(1);
      this.camera.position.set(0, 0, 1800);
      this.camera.lookAt(0, 0, 0);
    }
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = height;
    this.camera.near = 0.1;
    this.camera.far = 4000;
    this.camera.updateProjectionMatrix();
    return this.renderer;
  }

  private rebuild(bounds: WeatherBounds, weather: WeatherSettings, preset: SandPreset) {
    this.scene.clear();
    this.veil = createSandVeilMesh(bounds);
    this.veil.renderOrder = 0;
    this.scene.add(this.veil);

    const count = getWeatherParticleCount(620, preset.density, weather);
    this.particles = Array.from({ length: count }, (_, index) => createSandParticle(bounds, weather, index));
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.alphas = new Float32Array(count);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      vertexColors: true,
      blending: THREE.NormalBlending,
      uniforms: {
        globalOpacity: { value: 0 }
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
          center.x *= 1.75;
          float distanceFromCenter = length(center);
          float softGrain = 1.0 - smoothstep(0.18, 0.5, distanceFromCenter);
          if (softGrain <= 0.0) {
            discard;
          }
          gl_FragColor = vec4(vColor, softGrain * vAlpha * globalOpacity);
        }
      `
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("particleSize", new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("particleAlpha", new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage));
    this.sand = new THREE.Points(geometry, material);
    this.sand.renderOrder = 1;
    this.scene.add(this.sand);
  }

  private update(bounds: WeatherBounds, weather: WeatherSettings, preset: SandPreset, now: number, layerOpacity: number) {
    updateSandVeilMesh(this.veil, weather, preset, now, layerOpacity);
    if (!this.sand) {
      return;
    }
    const material = this.sand.material;
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.globalOpacity.value = preset.opacity * weather.opacity * layerOpacity;
    }
    const color = new THREE.Color(weather.color);
    const elapsed = now * 0.001 * weather.speed * preset.speed;
    const drift = getWeatherDriftVector(weather, 0.08);
    const directionX = drift.x;
    const directionY = drift.y;
    const crossX = -directionY;
    const crossY = directionX;
    const windForce = preset.windBase * (0.55 + drift.strength * 0.75);
    const travelDistance = Math.hypot(bounds.width, bounds.height) * (0.62 + windForce * 0.38);
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const baseSize = getMinimumWeatherDimension(bounds);

    let index = 0;
    for (const particle of this.particles) {
      const seedPhase = particle.seed * 0.001;
      const dustTime = elapsed * particle.speed * windForce + seedPhase * 20;
      const progress = (particle.phase + dustTime * (0.06 + drift.strength * 0.1 + preset.turbulence * 0.035)) % 1;
      const cycleFade = smoothstep(0, 0.12, progress) * (1 - smoothstep(0.82, 1, progress));
      const swirlPhase = seedPhase * Math.PI * 2;
      const swirlX = Math.sin(dustTime * (1.6 + preset.gustFrequency * 0.6) + swirlPhase) * preset.swirl;
      const swirlY = Math.cos(dustTime * (1.15 + preset.gustFrequency * 0.42) + swirlPhase) * preset.swirl;
      const gust = Math.sin(dustTime * (0.5 + preset.gustFrequency * 0.34) + particle.seed + progress * 5.5) * preset.gustAmplitude;
      const rawX = particle.baseX + directionX * travelDistance * progress;
      const rawY = particle.baseY + directionY * travelDistance * progress;
      const toCenterX = rawX - centerX;
      const toCenterY = rawY - centerY;
      const radialDistance = Math.max(1, Math.hypot(toCenterX, toCenterY));
      const tangentX = -toCenterY / radialDistance;
      const tangentY = toCenterX / radialDistance;
      const turbulenceDistance = baseSize * (0.014 + preset.turbulence * 0.024) * (0.55 + particle.depth * 0.9);
      const swirlDistance = baseSize * (0.03 + preset.swirl * 0.075);
      const x = rawX + crossX * turbulenceDistance * swirlX + tangentX * swirlDistance * swirlY + directionX * baseSize * 0.025 * gust;
      const y = rawY + crossY * turbulenceDistance * swirlX + tangentY * swirlDistance * swirlY + directionY * baseSize * 0.025 * gust;
      const alpha = particle.centerFade * cycleFade * (0.24 + particle.depth * 0.54) * (0.78 + preset.turbulence * 0.24);
      const size = Math.max(1.8, 2.8 * preset.size * weather.streakLength * particle.size * (0.9 + particle.depth * 1.55));
      const vertexOffset = index * 3;
      this.positions[vertexOffset] = x;
      this.positions[vertexOffset + 1] = y;
      this.positions[vertexOffset + 2] = 860 + particle.depth * 160;
      this.colors[vertexOffset] = color.r;
      this.colors[vertexOffset + 1] = color.g;
      this.colors[vertexOffset + 2] = color.b;
      this.sizes[index] = size;
      this.alphas[index] = alpha;
      index += 1;
    }

    this.sand.geometry.attributes.position.needsUpdate = true;
    this.sand.geometry.attributes.color.needsUpdate = true;
    this.sand.geometry.attributes.particleSize.needsUpdate = true;
    this.sand.geometry.attributes.particleAlpha.needsUpdate = true;
  }
}

