import * as THREE from "three";
import type { Point } from "../../../shared/localvtt";
import { addLightningLine } from "./templateEffectRenderableLines";
import { createTemplateEffectImage } from "./templateEffectRenderableRuntime";

export function createAcidSpatterImage(): HTMLCanvasElement | null {
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

export function createColdShardImage(): HTMLCanvasElement | null {
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

export function createDarknessMistImage(): HTMLCanvasElement | null {
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

export function createPoisonBubbleImage(): HTMLCanvasElement | null {
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

function addColdShard(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const length = size * (1.4 + random() * 1.2);
  const width = size * (0.18 + random() * 0.26);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([0, length * 0.5, 0, -width, -length * 0.14, 0, 0, -length * 0.5, 0, width, -length * 0.08, 0]);
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
