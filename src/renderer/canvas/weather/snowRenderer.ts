import * as THREE from "three";
import type { Camera } from "../camera";
import type { WeatherSettings } from "../../../shared/localvtt";
import { SNOW_PRESETS, createFrostEdgeMesh, createSnowParticle, getCycleOffset, getDistanceToQuietArea, getMinimumWeatherDimension, getQuietAreaBounds, getWeatherClipPath, getWeatherDriftVector, getWeatherParticleCount, hash, isSnowEffect, smoothstep, updateFrostEdgeMesh, type SnowParticle, type SnowPreset, type WeatherArea, type WeatherBounds } from "./weatherCore";

export class SnowRenderer {
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
    const count = getWeatherParticleCount(560, preset.density, weather);
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
    const drift = getWeatherDriftVector(weather);
    const baseSize = getMinimumWeatherDimension(bounds);
    const maxDriftDistance = baseSize * 0.5 * drift.strength;
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
      const lateralDistance = baseSize * (0.018 + preset.streak * 0.018 + drift.strength * 0.018) * wave;
      const swayDistance = baseSize * 0.012 * drift.strength * secondaryWave;
      const driftDistance = maxDriftDistance * Math.pow(fallProgress, 1.04) * (0.72 + hash(particle.seed + 746) * 0.48);
      const x = anchorX + directionX * travel + drift.x * driftDistance + crossX * (lateralDistance + swayDistance);
      const y = anchorY + directionY * travel + drift.y * driftDistance + crossY * (lateralDistance + swayDistance);
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

