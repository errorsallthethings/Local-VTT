import * as THREE from "three";
import type { DrawingTemplateEffect, Point } from "../../../shared/localvtt";
import { addLightningLine } from "./templateEffectRenderableLines";
import { createTemplateEffectImage } from "./templateEffectRenderableRuntime";
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

function createPoisonBubbleImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x51f15e, (scene, random) => {
    for (let index = 0; index < 58; index += 1) {
      addPoisonCloudPuff(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.055 + random() * 0.19, random);
    }
    for (let index = 0; index < 28; index += 1) {
      const radius = 0.035 + random() * 0.13;
      const x = -0.82 + random() * 1.64;
      const y = -0.82 + random() * 1.64;
      addPoisonBubble(scene, x, y, radius, random);
    }
  });
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

function createAcidSpatterImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0xac1d, (scene, random) => {
    for (let index = 0; index < 6; index += 1) {
      addAcidBubble(scene, -0.86 + random() * 1.72, -0.86 + random() * 1.72, 0.035 + random() * 0.11, random);
    }
    for (let index = 0; index < 58; index += 1) {
      addAcidDroplet(scene, -0.92 + random() * 1.84, -0.92 + random() * 1.84, 0.007 + random() * 0.032, random);
    }
    for (let index = 0; index < 7; index += 1) {
      addAcidRing(scene, -0.86 + random() * 1.72, -0.86 + random() * 1.72, 0.045 + random() * 0.12, random);
    }
    for (let index = 0; index < 10; index += 1) {
      addAcidWave(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.18 + random() * 0.34, random);
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

function createColdShardImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0xc01df057, (scene, random) => {
    for (let index = 0; index < 34; index += 1) {
      const x = -0.84 + random() * 1.68;
      const y = -0.84 + random() * 1.68;
      const size = 0.04 + random() * 0.16;
      addColdShard(scene, x, y, size, random);
    }
    for (let index = 0; index < 30; index += 1) {
      const x = -0.82 + random() * 1.64;
      const y = -0.82 + random() * 1.64;
      const size = 0.025 + random() * 0.18;
      addColdStarburst(scene, x, y, size, random);
    }
  });
}

function createNatureThornImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x71a7e, (scene, random) => {
    for (let index = 0; index < 18; index += 1) {
      addNatureVine(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.22 + random() * 0.52, random);
    }
    for (let index = 0; index < 34; index += 1) {
      addNatureThorn(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.035 + random() * 0.08, random);
    }
    for (let index = 0; index < 26; index += 1) {
      addNatureLeaf(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.035 + random() * 0.09, random);
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

function createDarknessMistImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0xda2c, (scene, random) => {
    for (let index = 0; index < 58; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.05 + random() * 0.2;
      addDarkMistPuff(scene, x, y, radius, random);
    }
    for (let index = 0; index < 22; index += 1) {
      const x = -0.86 + random() * 1.72;
      const y = -0.86 + random() * 1.72;
      addDarknessTendril(scene, x, y, 0.16 + random() * 0.34, random);
    }
  });
}

function createRadiantLightImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0xad1a17, (scene, random) => {
    for (let index = 0; index < 18; index += 1) {
      addRadiantRay(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.24 + random() * 0.58, random);
    }
    for (let index = 0; index < 14; index += 1) {
      addRadiantStarburst(scene, -0.84 + random() * 1.68, -0.84 + random() * 1.68, 0.05 + random() * 0.18, random);
    }
    for (let index = 0; index < 32; index += 1) {
      addRadiantSpark(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.008 + random() * 0.026, random);
    }
  });
}

function createWaterDropletImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x0ce4, (scene, random) => {
    for (let index = 0; index < 10; index += 1) {
      addWaterRipple(scene, -0.86 + random() * 1.72, -0.86 + random() * 1.72, 0.38 + random() * 0.62, random);
    }
    for (let index = 0; index < 10; index += 1) {
      addWaterCurrent(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.42 + random() * 0.72, random);
    }
    for (let index = 0; index < 16; index += 1) {
      addWaterDroplet(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.018 + random() * 0.052, random);
    }
  });
}

function createWebStrandImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x5a1d, (scene, random) => {
    for (let index = 0; index < 5; index += 1) {
      addWebCluster(scene, -0.76 + random() * 1.52, -0.76 + random() * 1.52, 0.22 + random() * 0.34, random);
    }
    for (let index = 0; index < 20; index += 1) {
      addWebStrayThread(scene, -0.92 + random() * 1.84, -0.92 + random() * 1.84, 0.18 + random() * 0.42, random);
    }
  });
}

function addPoisonBubble(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshBasicMaterial({ color: 0x65a30d, transparent: true, opacity: 0.08 + random() * 0.26, depthWrite: false })
  );
  fill.position.set(x, y, 0);
  scene.add(fill);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.9, radius, 36),
    new THREE.MeshBasicMaterial({ color: 0xd9f99d, transparent: true, opacity: 0.24 + random() * 0.48, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(x, y, 0.01);
  scene.add(ring);

  const highlight = new THREE.Mesh(
    new THREE.CircleGeometry(radius * (0.16 + random() * 0.08), 16),
    new THREE.MeshBasicMaterial({ color: 0xf7fee7, transparent: true, opacity: 0.18 + random() * 0.42, depthWrite: false })
  );
  const highlightAngle = -Math.PI * 0.72 + random() * 0.38;
  highlight.position.set(x + Math.cos(highlightAngle) * radius * 0.38, y + Math.sin(highlightAngle) * radius * 0.38, 0.02);
  scene.add(highlight);
}

function addPoisonCloudPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0x365314 : 0x65a30d, transparent: true, opacity: 0.055 + random() * 0.15, depthWrite: false })
  );
  puff.position.set(x, y, 0.01);
  puff.scale.set(1 + random() * 0.9, 0.62 + random() * 0.62, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
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

function addAcidBubble(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * (0.86 + random() * 0.06), radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.35 ? 0xd9f99d : 0xfacc15, transparent: true, opacity: 0.34 + random() * 0.42, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(x, y, 0.03);
  scene.add(ring);
  addAcidDroplet(scene, x + (random() - 0.5) * radius * 0.6, y + (random() - 0.5) * radius * 0.6, radius * (0.18 + random() * 0.18), random);
}

function addAcidDroplet(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const droplet = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0xa3e635 : 0xfde047, transparent: true, opacity: 0.18 + random() * 0.58, depthWrite: false })
  );
  droplet.position.set(x, y, 0.04);
  droplet.scale.set(1 + random() * 0.75, 0.72 + random() * 0.42, 1);
  droplet.rotation.z = random() * Math.PI;
  scene.add(droplet);
}

function addAcidRing(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.94, radius, 34),
    new THREE.MeshBasicMaterial({ color: 0xbef264, transparent: true, opacity: 0.16 + random() * 0.3, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(x, y, 0.02);
  ring.scale.set(1 + random() * 0.5, 0.72 + random() * 0.32, 1);
  ring.rotation.z = random() * Math.PI;
  scene.add(ring);
}

function addAcidWave(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.06 + random() * 0.08);
  const points: Point[] = [];
  for (let index = 0; index < 7; index += 1) {
    const t = index / 6;
    const wave = Math.sin(t * Math.PI * (1.5 + random() * 0.8)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addLightningLine(scene, points, random() > 0.45 ? 0xbef264 : 0xfde047, 0.16 + random() * 0.28, 0.004 + random() * 0.005);
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

function addColdShard(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const length = size * (1.4 + random() * 1.2);
  const width = size * (0.18 + random() * 0.26);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0,
    length * 0.5,
    0,
    -width,
    -length * 0.14,
    0,
    0,
    -length * 0.5,
    0,
    width,
    -length * 0.08,
    0
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  const material = new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0xa5f3fc : 0xf0f9ff, transparent: true, opacity: 0.18 + random() * 0.34, side: THREE.DoubleSide, depthWrite: false });
  const shard = new THREE.Mesh(geometry, material);
  shard.position.set(x, y, 0);
  shard.rotation.z = random() * Math.PI * 2;
  scene.add(shard);
}

function addColdStarburst(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const material = new THREE.LineBasicMaterial({ color: random() > 0.35 ? 0xe0f2fe : 0x67e8f9, transparent: true, opacity: 0.08 + random() * 0.56 });
  const rayCount = 4 + Math.floor(random() * 4);
  const rotation = random() * Math.PI;
  for (let index = 0; index < rayCount; index += 1) {
    const angle = rotation + (Math.PI * index) / rayCount;
    const length = size * (0.72 + random() * 0.72);
    const points = [
      new THREE.Vector3(Math.cos(angle) * -length * 0.5, Math.sin(angle) * -length * 0.5, 0.03),
      new THREE.Vector3(Math.cos(angle) * length * 0.5, Math.sin(angle) * length * 0.5, 0.03)
    ];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone());
    line.position.set(x, y, 0);
    scene.add(line);
  }
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

function addDarkMistPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0x020617 : 0x1e293b, transparent: true, opacity: 0.08 + random() * 0.22, depthWrite: false })
  );
  puff.position.set(x, y, 0.02);
  puff.scale.set(1 + random() * 1.05, 0.54 + random() * 0.72, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
}

function addDarknessTendril(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const points: Point[] = [];
  for (let index = 0; index < 5; index += 1) {
    const t = index / 4;
    const curl = Math.sin(t * Math.PI * 1.4 + random()) * length * 0.14;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * curl,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * curl
    });
  }
  addLightningLine(scene, points, 0x0f172a, 0.16 + random() * 0.28, 0.01 + random() * 0.012);
}

function addNatureVine(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.08 + random() * 0.12);
  const points: Point[] = [];
  for (let index = 0; index < 7; index += 1) {
    const t = index / 6;
    const curl = Math.sin(t * Math.PI * (1.2 + random() * 0.9)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * curl,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * curl
    });
  }
  addNatureVineLine(scene, points, 0x16a34a, 0.76 + random() * 0.18, 0.012 + random() * 0.008);
}

function addNatureVineLine(scene: THREE.Scene, points: Point[], color: number, opacity: number, thickness: number) {
  const drawOffsets = [{ x: 0, y: 0 }, { x: thickness, y: 0 }, { x: -thickness, y: 0 }, { x: 0, y: thickness }, { x: 0, y: -thickness }];
  for (const offset of drawOffsets) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x + offset.x, point.y + offset.y, 0.04)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.max(0.16, Math.min(0.94, opacity)) });
    scene.add(new THREE.Line(geometry, material));
  }
}

function addNatureThorn(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const height = size * (1.25 + random() * 0.95);
  const width = size * (0.28 + random() * 0.22);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([0, height * 0.62, 0, -width, -height * 0.38, 0, width, -height * 0.38, 0]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2]);
  const thorn = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0x92400e : 0x78350f, transparent: true, opacity: 0.42 + random() * 0.38, side: THREE.DoubleSide, depthWrite: false })
  );
  thorn.position.set(x, y, 0.04);
  thorn.rotation.z = random() * Math.PI * 2;
  scene.add(thorn);
}

function addNatureLeaf(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const shape = new THREE.Shape()
    .moveTo(0, size)
    .bezierCurveTo(size * 0.72, size * 0.48, size * 0.78, -size * 0.42, 0, -size)
    .bezierCurveTo(-size * 0.78, -size * 0.42, -size * 0.72, size * 0.48, 0, size);
  const leaf = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0x4ade80 : 0x22c55e, transparent: true, opacity: 0.18 + random() * 0.34, side: THREE.DoubleSide, depthWrite: false })
  );
  leaf.position.set(x, y, 0.03);
  leaf.rotation.z = random() * Math.PI * 2;
  leaf.scale.set(1 + random() * 0.55, 0.72 + random() * 0.32, 1);
  scene.add(leaf);
}

function addRadiantRay(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const width = length * (0.04 + random() * 0.055);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([0, length * 0.52, 0, -width, -length * 0.38, 0, width, -length * 0.38, 0]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2]);
  const ray = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: random() > 0.38 ? 0xfef3c7 : 0xfacc15, transparent: true, opacity: 0.08 + random() * 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  ray.position.set(x, y, 0.02);
  ray.rotation.z = random() * Math.PI * 2;
  scene.add(ray);
}

function addRadiantStarburst(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const material = new THREE.LineBasicMaterial({ color: random() > 0.35 ? 0xfff7ed : 0xfef08a, transparent: true, opacity: 0.18 + random() * 0.42 });
  const rayCount = 4 + Math.floor(random() * 4);
  const rotation = random() * Math.PI;
  for (let index = 0; index < rayCount; index += 1) {
    const angle = rotation + (Math.PI * index) / rayCount;
    const length = size * (0.72 + random() * 0.9);
    const points = [
      new THREE.Vector3(Math.cos(angle) * -length * 0.5, Math.sin(angle) * -length * 0.5, 0.04),
      new THREE.Vector3(Math.cos(angle) * length * 0.5, Math.sin(angle) * length * 0.5, 0.04)
    ];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone());
    line.position.set(x, y, 0);
    scene.add(line);
  }
}

function addRadiantSpark(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const spark = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0xfffbeb : 0xfde047, transparent: true, opacity: 0.18 + random() * 0.48, depthWrite: false })
  );
  spark.position.set(x, y, 0.05);
  spark.scale.set(1 + random() * 0.7, 0.7 + random() * 0.42, 1);
  spark.rotation.z = random() * Math.PI;
  scene.add(spark);
}

function addWaterRipple(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ringCount = 2 + Math.floor(random() * 2);
  for (let index = 0; index < ringCount; index += 1) {
    const ringRadius = radius * (0.34 + index * 0.64 + random() * 0.08);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ringRadius * 0.95, ringRadius, 44),
      new THREE.MeshBasicMaterial({ color: random() > 0.35 ? 0x7dd3fc : 0xbae6fd, transparent: true, opacity: 0.08 + random() * 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.set(x, y, 0.03 + index * 0.002);
    ring.scale.set(1 + random() * 0.42, 0.5 + random() * 0.34, 1);
    ring.rotation.z = random() * Math.PI;
    scene.add(ring);
  }
}

function addWaterCurrent(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.018 + random() * 0.034);
  const points: Point[] = [];
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const wave = Math.sin(t * Math.PI * (1.35 + random() * 1.2)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addLightningLine(scene, points, random() > 0.45 ? 0x38bdf8 : 0xbae6fd, 0.06 + random() * 0.16, 0.002 + random() * 0.003);
}

function addWaterDroplet(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const droplet = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 16),
    new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0x38bdf8 : 0xe0f2fe, transparent: true, opacity: 0.16 + random() * 0.38, depthWrite: false })
  );
  droplet.position.set(x, y, 0.04);
  droplet.scale.set(1 + random() * 0.6, 0.7 + random() * 0.38, 1);
  droplet.rotation.z = random() * Math.PI;
  scene.add(droplet);
}

function addWebCluster(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const hub = { x: x + (random() - 0.5) * radius * 0.35, y: y + (random() - 0.5) * radius * 0.35 };
  const spokeCount = 9 + Math.floor(random() * 5);
  const spokes: Point[][] = [];
  const rotation = random() * Math.PI * 2;
  for (let index = 0; index < spokeCount; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / spokeCount + (random() - 0.5) * 0.32;
    const length = radius * (0.74 + random() * 0.48);
    const end = {
      x: hub.x + Math.cos(angle) * length,
      y: hub.y + Math.sin(angle) * length
    };
    spokes.push([hub, end]);
    addWebThread(scene, [hub, end], 0.38 + random() * 0.32);
  }

  const ringCount = 3 + Math.floor(random() * 3);
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    const t = 0.22 + ringIndex * (0.64 / ringCount) + random() * 0.035;
    for (let spokeIndex = 0; spokeIndex < spokes.length; spokeIndex += 1) {
      if (random() < 0.18) {
        continue;
      }
      const current = interpolatePoint(spokes[spokeIndex][0], spokes[spokeIndex][1], t + (random() - 0.5) * 0.025);
      const nextSpoke = spokes[(spokeIndex + 1) % spokes.length];
      const next = interpolatePoint(nextSpoke[0], nextSpoke[1], t + (random() - 0.5) * 0.04);
      const mid = {
        x: (current.x + next.x) / 2 + (hub.x - (current.x + next.x) / 2) * (0.08 + random() * 0.08),
        y: (current.y + next.y) / 2 + (hub.y - (current.y + next.y) / 2) * (0.08 + random() * 0.08)
      };
      addWebThread(scene, [current, mid, next], 0.32 + random() * 0.28);
    }
  }
}

function addWebStrayThread(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const bend = (random() - 0.5) * length * 0.18;
  const start = { x: x - Math.cos(angle) * length * 0.5, y: y - Math.sin(angle) * length * 0.5 };
  const end = { x: x + Math.cos(angle) * length * 0.5, y: y + Math.sin(angle) * length * 0.5 };
  const mid = {
    x: x + Math.cos(angle + Math.PI / 2) * bend,
    y: y + Math.sin(angle + Math.PI / 2) * bend
  };
  addWebThread(scene, [start, mid, end], 0.26 + random() * 0.26);
}

function addWebThread(scene: THREE.Scene, points: Point[], opacity: number) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x, point.y, 0.04)));
  const material = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: Math.max(0.18, Math.min(0.76, opacity)) });
  scene.add(new THREE.Line(geometry, material));
}

function interpolatePoint(start: Point, end: Point, t: number): Point {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  };
}

