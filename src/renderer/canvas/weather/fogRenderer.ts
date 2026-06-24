import * as THREE from "three";
import type { Camera } from "../core/camera";
import type { WeatherSettings } from "../../../shared/localvtt";
import { FOG_PRESETS, createFogBanks, createFogDensityTexture, createFogHazeMesh, getQualityMultiplier, hash, isFogEffect, smoothstep, updateFogHazeMesh, type FogBank, type FogPreset, type WeatherArea, type WeatherBounds } from "./weatherCore";

export class FogRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  private haze: THREE.Mesh | null = null;
  private fog: THREE.InstancedMesh | null = null;
  private densityTexture: THREE.CanvasTexture | null = null;
  private banks: FogBank[] = [];
  private signature = "";
  private matrix = new THREE.Matrix4();
  private position = new THREE.Vector3();
  private quaternion = new THREE.Quaternion();
  private scale = new THREE.Vector3();

  draw(ctx: CanvasRenderingContext2D, area: WeatherArea, weather: WeatherSettings, camera: Camera, now: number, opacity: number, clipPath: Path2D) {
    if (!isFogEffect(weather.effect)) {
      return;
    }
    const bounds = area.clip;
    const preset = FOG_PRESETS[weather.effect];
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

  private rebuild(bounds: WeatherBounds, weather: WeatherSettings, preset: FogPreset) {
    this.scene.clear();
    this.haze = createFogHazeMesh(bounds);
    this.haze.renderOrder = 0;
    this.scene.add(this.haze);

    const count = Math.round(preset.bankCount * getQualityMultiplier(weather) * (0.75 + weather.intensity * 0.8));
    this.banks = createFogBanks(bounds, weather, preset, count);
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const alphaAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    const seedAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    const textureAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    geometry.setAttribute("fogAlpha", alphaAttribute);
    geometry.setAttribute("fogSeed", seedAttribute);
    geometry.setAttribute("fogTextureIndex", textureAttribute);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      uniforms: {
        globalOpacity: { value: 0 },
        cloudMap: { value: this.getDensityTexture() },
        fogTint: { value: new THREE.Color(weather.color) },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float fogAlpha;
        attribute float fogSeed;
        attribute float fogTextureIndex;
        varying vec2 vUv;
        varying float vAlpha;
        varying float vSeed;
        varying float vTextureIndex;

        void main() {
          vUv = uv;
          vAlpha = fogAlpha;
          vSeed = fogSeed;
          vTextureIndex = fogTextureIndex;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float globalOpacity;
        uniform sampler2D cloudMap;
        uniform vec3 fogTint;
        uniform float time;
        varying vec2 vUv;
        varying float vAlpha;
        varying float vSeed;
        varying float vTextureIndex;

        void main() {
          float tile = floor(vTextureIndex + 0.5);
          float tileX = mod(tile, 3.0);
          float tileY = floor(tile / 3.0);
          vec2 atlasUv = (vUv + vec2(tileX, tileY)) / 3.0;
          float textureAlpha = texture2D(cloudMap, atlasUv).r;
          float mistAlpha = pow(textureAlpha, 1.82) * 0.42;
          float alpha = clamp(mistAlpha * vAlpha * globalOpacity * 0.26, 0.0, 0.14);
          vec3 neutralFog = mix(vec3(0.68, 0.71, 0.72), vec3(0.86, 0.88, 0.88), textureAlpha);
          vec3 fogColor = mix(neutralFog, fogTint, 0.55);
          gl_FragColor = vec4(fogColor, alpha);
        }
      `
    });

    this.fog = new THREE.InstancedMesh(geometry, material, count);
    this.fog.frustumCulled = false;
    this.fog.renderOrder = 1;
    this.scene.add(this.fog);
  }

  private update(bounds: WeatherBounds, weather: WeatherSettings, preset: FogPreset, now: number, layerOpacity: number) {
    updateFogHazeMesh(this.haze, weather, preset, now, layerOpacity);
    if (!this.fog) {
      return;
    }
    const material = this.fog.material;
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.globalOpacity.value = weather.opacity * preset.opacity * layerOpacity;
      material.uniforms.fogTint.value.set(weather.color);
      material.uniforms.time.value = now * 0.001 * Math.max(0.12, weather.speed);
    }

    const elapsed = now * 0.001 * weather.speed;
    const driftRadians = (weather.directionDegrees * Math.PI) / 180;
    const noDrift = weather.driftStrength <= 0.02;
    const driftStrength = noDrift ? 0 : Math.max(0.08, weather.driftStrength);
    const directionX = Math.cos(driftRadians);
    const directionY = Math.sin(driftRadians);
    const crossX = -directionY;
    const crossY = directionX;
    const alphaAttribute = this.fog.geometry.getAttribute("fogAlpha") as THREE.InstancedBufferAttribute;
    const seedAttribute = this.fog.geometry.getAttribute("fogSeed") as THREE.InstancedBufferAttribute;
    const textureAttribute = this.fog.geometry.getAttribute("fogTextureIndex") as THREE.InstancedBufferAttribute;

    this.banks.forEach((bank, index) => {
      const progress = (bank.groupPhase + elapsed * bank.groupSpeed * (noDrift ? 0.035 : 0.026 + driftStrength * 0.03)) % 1;
      const fade = noDrift
        ? 0.18 + Math.pow(Math.sin(progress * Math.PI), 2) * 0.82
        : smoothstep(0, 0.12, progress) * (1 - smoothstep(0.86, 1, progress));
      const groupWave = Math.sin(elapsed * (0.24 + hash(bank.groupSeed + 13) * 0.18) + bank.groupPhase * Math.PI * 2);
      const localWave = Math.sin(elapsed * (0.42 + hash(bank.seed + 17) * 0.34) + bank.phase * Math.PI * 2);
      const localPush = Math.cos(elapsed * (0.28 + hash(bank.seed + 23) * 0.24) + bank.phase * Math.PI * 2);
      const flowX = noDrift ? 0 : directionX * bank.flowDistance * progress + crossX * bank.drift * groupWave * 0.22;
      const flowY = noDrift ? 0 : directionY * bank.flowDistance * progress + crossY * bank.drift * groupWave * 0.22;
      const localX = bank.localX + crossX * bank.localDrift * localWave * 1.25 + directionX * bank.localDrift * localPush * 0.34;
      const localY = bank.localY + crossY * bank.localDrift * localWave * 1.25 + directionY * bank.localDrift * localPush * 0.34;
      const rotation = bank.rotation + groupWave * 0.045 + localWave * 0.075;
      const scalePulse = 1 + Math.sin(elapsed * (0.24 + bank.speed * 0.1) + bank.phase * Math.PI * 2) * 0.055;
      this.position.set(bank.baseX + flowX + localX, bank.baseY + flowY + localY, 820 + index * 0.5);
      this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotation);
      this.scale.set(bank.radiusX * scalePulse * 1.18, bank.radiusY * scalePulse * 1.18, 1);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.fog?.setMatrixAt(index, this.matrix);
      alphaAttribute.setX(index, bank.alpha * fade);
      seedAttribute.setX(index, bank.seed);
      textureAttribute.setX(index, bank.textureIndex);
    });

    this.fog.instanceMatrix.needsUpdate = true;
    alphaAttribute.needsUpdate = true;
    seedAttribute.needsUpdate = true;
    textureAttribute.needsUpdate = true;
  }

  private getDensityTexture() {
    if (!this.densityTexture) {
      this.densityTexture = createFogDensityTexture();
    }
    return this.densityTexture;
  }
}

