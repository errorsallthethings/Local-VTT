import * as THREE from "three";
import type { DrawingTemplateEffect, Point } from "../../../shared/localvtt";
import { createTemplateEffectImage } from "./templateEffectRenderableRuntime";
import {
  createAcidSpatterImage,
  createColdShardImage,
  createDarknessMistImage,
  createPoisonBubbleImage
} from "./templateEffectHazardRenderables";
import {
  createNatureThornImage,
  createRadiantLightImage,
  createWaterDropletImage,
  createWebStrandImage
} from "./templateEffectNatureRenderables";
import {
  createFogCloudImage,
  createLightningForkImage,
  createStormCloudImage,
  createThunderWaveImage
} from "./templateEffectStormRenderables";
import type { TemplateEffectAssetEffect } from "./templateEffectAssets";
import type { TemplateEffectRenderable } from "./templateEffectPlacement";

interface TemplateEffectRenderableDefinition {
  createCanvas: () => HTMLCanvasElement | null;
  id: string;
}

const TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS: Record<TemplateEffectAssetEffect, TemplateEffectRenderableDefinition> = {
  acid: { id: "three-acid-spatter-v2", createCanvas: createAcidSpatterImage },
  arcane: { id: "three-arcane-glyphs-v2", createCanvas: createArcaneGlyphImage },
  cold: { id: "three-cold-shards-v1", createCanvas: createColdShardImage },
  darkness: { id: "three-darkness-mist-v1", createCanvas: createDarknessMistImage },
  fire: { id: "three-fire-tongues-v1", createCanvas: createFireTongueImage },
  fog: { id: "three-fog-clouds-v1", createCanvas: createFogCloudImage },
  lightning: { id: "three-lightning-forks-v1", createCanvas: createLightningForkImage },
  nature: { id: "three-nature-thorns-v6", createCanvas: createNatureThornImage },
  poison: { id: "three-poison-bubbles-v1", createCanvas: createPoisonBubbleImage },
  psychic: { id: "three-psychic-haze-v1", createCanvas: createPsychicHazeImage },
  radiant: { id: "three-radiant-light-v1", createCanvas: createRadiantLightImage },
  storm: { id: "three-storm-clouds-v1", createCanvas: createStormCloudImage },
  thunder: { id: "three-thunder-waves-v2", createCanvas: createThunderWaveImage },
  water: { id: "three-water-ripples-currents-droplets-v3", createCanvas: createWaterDropletImage },
  web: { id: "three-web-strands-v2", createCanvas: createWebStrandImage }
};

const templateEffectRenderableCache: Partial<Record<TemplateEffectAssetEffect, TemplateEffectRenderable[]>> = {};

export function getRegisteredTemplateEffectRenderableEffects(): TemplateEffectAssetEffect[] {
  return Object.keys(TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS).sort() as TemplateEffectAssetEffect[];
}

export function getTemplateEffectRenderables(effect: DrawingTemplateEffect): TemplateEffectRenderable[] {
  return effect === "plain" ? [] : getCachedTemplateEffectRenderables(effect);
}

export function getTemplateEffectRenderableAssetIds(): Record<TemplateEffectAssetEffect, string> {
  return Object.fromEntries(
    Object.entries(TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS).map(([effect, definition]) => [effect, definition.id])
  ) as Record<TemplateEffectAssetEffect, string>;
}

function getCachedTemplateEffectRenderables(effect: TemplateEffectAssetEffect): TemplateEffectRenderable[] {
  const cachedRenderables = templateEffectRenderableCache[effect];
  if (cachedRenderables) {
    return cachedRenderables;
  }

  const definition = TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS[effect];
  const canvas = definition.createCanvas();
  const renderables = canvas ? [createCanvasTemplateRenderable(definition.id, canvas)] : [];
  templateEffectRenderableCache[effect] = renderables;
  return renderables;
}

function createCanvasTemplateRenderable(id: string, canvas: HTMLCanvasElement): TemplateEffectRenderable {
  return {
    id,
    image: canvas,
    naturalHeight: canvas.height,
    naturalWidth: canvas.width
  };
}

function createPsychicHazeImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x951c1c, (scene, random) => {
    for (let index = 0; index < 16; index += 1) {
      addPsychicBand(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.28 + random() * 0.62, random);
    }
    for (let index = 0; index < 18; index += 1) {
      addPsychicStreak(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.18 + random() * 0.44, random);
    }
    for (let index = 0; index < 34; index += 1) {
      addPsychicSpark(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.01 + random() * 0.03, random);
    }
  });
}

function createArcaneGlyphImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0xa2ca3e, (scene, random) => {
    for (let index = 0; index < 14; index += 1) {
      addArcaneGlyph(scene, -0.84 + random() * 1.68, -0.84 + random() * 1.68, 0.08 + random() * 0.18, random);
    }
    for (let index = 0; index < 24; index += 1) {
      addArcaneRuneStroke(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.06 + random() * 0.16, random);
    }
    for (let index = 0; index < 30; index += 1) {
      addArcaneSpark(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.008 + random() * 0.024, random);
    }
  });
}

function createFireTongueImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0xf17e, (scene, random) => {
    for (let index = 0; index < 28; index += 1) {
      const x = -0.84 + random() * 1.68;
      const y = -0.84 + random() * 1.68;
      const size = 0.07 + random() * 0.2;
      addFireTongue(scene, x, y, size, random);
    }
    for (let index = 0; index < 42; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.008 + random() * 0.024;
      addFireEmber(scene, x, y, radius, random);
    }
  });
}

function addPsychicBand(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.07 + random() * 0.12);
  const colors = [0xf0abfc, 0x67e8f9, 0xf9a8d4, 0xc4b5fd];
  const color = colors[Math.floor(random() * colors.length) % colors.length];
  const points: Point[] = [];
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const wave = Math.sin(t * Math.PI * (1.1 + random() * 1.1)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addPsychicLine(scene, points, color, 0.22 + random() * 0.28, 0.012 + random() * 0.012);
}

function addPsychicStreak(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const skew = (random() - 0.5) * length * 0.16;
  const width = length * (0.035 + random() * 0.045);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -length * 0.5,
    -width,
    0,
    length * 0.5,
    -width + skew,
    0,
    length * 0.5,
    width + skew,
    0,
    -length * 0.5,
    width,
    0
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  const streak = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0xf0abfc : 0x22d3ee, transparent: true, opacity: 0.14 + random() * 0.26, side: THREE.DoubleSide, depthWrite: false })
  );
  streak.position.set(x, y, 0.03);
  streak.rotation.z = angle;
  scene.add(streak);
}

function addPsychicSpark(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const spark = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0xfdf4ff : 0x67e8f9, transparent: true, opacity: 0.16 + random() * 0.42, depthWrite: false })
  );
  spark.position.set(x, y, 0.05);
  spark.scale.set(1 + random() * 0.8, 0.64 + random() * 0.46, 1);
  spark.rotation.z = random() * Math.PI;
  scene.add(spark);
}

function addPsychicLine(scene: THREE.Scene, points: Point[], color: number, opacity: number, thickness: number) {
  const drawOffsets = [{ x: 0, y: 0 }, { x: thickness, y: 0 }, { x: -thickness, y: 0 }, { x: 0, y: thickness }, { x: 0, y: -thickness }];
  for (const offset of drawOffsets) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x + offset.x, point.y + offset.y, 0.04)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.max(0.08, Math.min(0.62, opacity / 1.5)) });
    scene.add(new THREE.Line(geometry, material));
  }
}

function addArcaneGlyph(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const group = new THREE.Group();
  const color = random() > 0.4 ? 0xc4b5fd : 0x818cf8;
  const opacity = 0.3 + random() * 0.36;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.92, radius, 42, 1, random() * Math.PI * 2, Math.PI * (0.72 + random() * 0.72)),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(ring);
  const inner = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.45, radius * 0.49, 32, 1, random() * Math.PI * 2, Math.PI * (0.38 + random() * 0.58)),
    new THREE.MeshBasicMaterial({ color: 0xede9fe, transparent: true, opacity: opacity * 0.7, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(inner);
  const spokeCount = 2 + Math.floor(random() * 3);
  for (let index = 0; index < spokeCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const start = { x: Math.cos(angle) * radius * 0.22, y: Math.sin(angle) * radius * 0.22 };
    const end = { x: Math.cos(angle) * radius * (0.66 + random() * 0.18), y: Math.sin(angle) * radius * (0.66 + random() * 0.18) };
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(start.x, start.y, 0.04), new THREE.Vector3(end.x, end.y, 0.04)]),
      new THREE.LineBasicMaterial({ color: 0xddd6fe, transparent: true, opacity: opacity * 0.8 })
    );
    group.add(line);
  }
  group.position.set(x, y, 0.03);
  group.rotation.z = random() * Math.PI * 2;
  scene.add(group);
}

function addArcaneRuneStroke(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const branchAngle = angle + (random() > 0.5 ? 1 : -1) * (0.7 + random() * 0.6);
  const center = new THREE.Vector3(x, y, 0.04);
  const half = length * 0.5;
  const points = [
    new THREE.Vector3(center.x - Math.cos(angle) * half, center.y - Math.sin(angle) * half, 0.04),
    new THREE.Vector3(center.x + Math.cos(angle) * half, center.y + Math.sin(angle) * half, 0.04)
  ];
  const material = new THREE.LineBasicMaterial({ color: random() > 0.45 ? 0xa78bfa : 0xe879f9, transparent: true, opacity: 0.3 + random() * 0.46 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  if (random() > 0.32) {
    const branchLength = length * (0.28 + random() * 0.34);
    const branchStart = points[random() > 0.5 ? 0 : 1];
    const branchEnd = new THREE.Vector3(branchStart.x + Math.cos(branchAngle) * branchLength, branchStart.y + Math.sin(branchAngle) * branchLength, 0.04);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([branchStart, branchEnd]), material.clone()));
  }
}

function addArcaneSpark(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const spark = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 12),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0xede9fe : 0xc084fc, transparent: true, opacity: 0.28 + random() * 0.5, depthWrite: false })
  );
  spark.position.set(x, y, 0.05);
  spark.scale.set(1 + random() * 0.8, 0.68 + random() * 0.42, 1);
  spark.rotation.z = random() * Math.PI;
  scene.add(spark);
}

function addFireTongue(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const height = size * (1.35 + random() * 1.15);
  const width = size * (0.32 + random() * 0.36);
  const curve = (random() - 0.5) * width * 1.15;
  const geometry = new THREE.ShapeGeometry(
    new THREE.Shape()
      .moveTo(0, height * 0.58)
      .bezierCurveTo(width + curve, height * 0.18, width * 0.45, -height * 0.34, 0, -height * 0.58)
      .bezierCurveTo(-width * 0.5 + curve, -height * 0.18, -width - curve, height * 0.18, 0, height * 0.58)
  );
  const material = new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0xf97316 : 0xfacc15, transparent: true, opacity: 0.16 + random() * 0.42, side: THREE.DoubleSide, depthWrite: false });
  const flame = new THREE.Mesh(geometry, material);
  flame.position.set(x, y, 0);
  flame.rotation.z = random() * Math.PI * 2;
  scene.add(flame);
}

function addFireEmber(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ember = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.38 ? 0xfef08a : 0xfb923c, transparent: true, opacity: 0.18 + random() * 0.52, depthWrite: false })
  );
  ember.position.set(x, y, 0.04);
  scene.add(ember);
}


