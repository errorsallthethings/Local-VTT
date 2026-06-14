import * as THREE from "three";
import type { Camera } from "../camera";
import type { RainWeatherEffectType, WeatherSettings } from "../../../shared/localvtt";
import { createStreak, drawStormFlash, getCycleOffset, getDistanceToQuietArea, getMinimumWeatherDimension, getRainPreset, getWeatherDriftVector, getWeatherParticleCount, hash, smoothstep, type RainPreset, type RainStreak, type WeatherArea, type WeatherBounds } from "./weatherCore";

export class RainRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  private rain: THREE.LineSegments | null = null;
  private streaks: RainStreak[] = [];
  private positions = new Float32Array(0);
  private colors = new Float32Array(0);
  private signature = "";

  draw(ctx: CanvasRenderingContext2D, area: WeatherArea, weather: WeatherSettings, camera: Camera, now: number, opacity: number, clipPath: Path2D) {
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
    ctx.clip(clipPath, "evenodd");
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
    const count = getWeatherParticleCount(1050, preset.density, weather);
    this.streaks = Array.from({ length: count }, (_, index) => createStreak(area.clip, area.spawnPadding, preset, weather, index));
    this.positions = new Float32Array(count * 2 * 3);
    this.colors = new Float32Array(count * 2 * 3);

    const material = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.48 * preset.opacity,
      depthWrite: false,
      depthTest: false,
      vertexColors: true,
      blending: THREE.NormalBlending
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage));
    this.rain = new THREE.LineSegments(geometry, material);
    this.scene.add(this.rain);
  }

  private update(bounds: WeatherBounds, weather: WeatherSettings, preset: RainPreset, now: number, opacity: number) {
    if (!this.rain) {
      return;
    }
    const elapsed = now * 0.001;
    const color = new THREE.Color("#d9ecff");
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const drift = getWeatherDriftVector(weather);
    const maxWindDistance = getMinimumWeatherDimension(bounds) * 0.5 * drift.strength;

    let offset = 0;
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
      const x = anchorX + directionX * travel + drift.x * windDistance;
      const y = anchorY + directionY * travel + drift.y * windDistance;
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

      this.positions[offset] = x - driftX * 0.5;
      this.positions[offset + 1] = y - driftY * 0.5;
      this.positions[offset + 2] = nearZ;
      this.positions[offset + 3] = x + driftX * 0.5;
      this.positions[offset + 4] = y + driftY * 0.5;
      this.positions[offset + 5] = farZ;
      this.colors[offset] = color.r * alpha;
      this.colors[offset + 1] = color.g * alpha;
      this.colors[offset + 2] = color.b * alpha;
      this.colors[offset + 3] = color.r * alpha;
      this.colors[offset + 4] = color.g * alpha;
      this.colors[offset + 5] = color.b * alpha;
      offset += 6;
    }

    this.rain.geometry.attributes.position.needsUpdate = true;
    this.rain.geometry.attributes.color.needsUpdate = true;
  }
}

