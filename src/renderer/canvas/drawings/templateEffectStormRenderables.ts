import * as THREE from "three";
import type { Point } from "../../../shared/localvtt";
import { addLightningBolt, addLightningLine } from "./templateEffectRenderableLines";
import { createTemplateEffectImage } from "./templateEffectRenderableRuntime";

export function createFogCloudImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0xf06c10d, (scene, random) => {
    for (let index = 0; index < 72; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.045 + random() * 0.17;
      addFogPuff(scene, x, y, radius, random);
    }
  });
}

export function createLightningForkImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x1e471e, (scene, random) => {
    for (let index = 0; index < 15; index += 1) {
      const start = { x: -0.88 + random() * 1.76, y: -0.88 + random() * 1.76 };
      const angle = random() * Math.PI * 2;
      const length = 0.92 + random() * 1.24;
      const end = {
        x: Math.max(-0.92, Math.min(0.92, start.x + Math.cos(angle) * length)),
        y: Math.max(-0.92, Math.min(0.92, start.y + Math.sin(angle) * length))
      };
      addLightningBolt(scene, start, end, 6 + Math.floor(random() * 6), 0.28 + random() * 0.5, random);
    }
  });
}

export function createStormCloudImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x570a, (scene, random) => {
    for (let index = 0; index < 64; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.045 + random() * 0.18;
      addStormPuff(scene, x, y, radius, random);
    }
    for (let index = 0; index < 16; index += 1) {
      const start = { x: -0.88 + random() * 1.76, y: -0.88 + random() * 1.76 };
      const angle = random() * Math.PI * 2;
      const length = 0.48 + random() * 0.78;
      const end = {
        x: Math.max(-0.92, Math.min(0.92, start.x + Math.cos(angle) * length)),
        y: Math.max(-0.92, Math.min(0.92, start.y + Math.sin(angle) * length))
      };
      addLightningBolt(scene, start, end, 4 + Math.floor(random() * 5), 0.16 + random() * 0.32, random);
    }
  });
}

export function createThunderWaveImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x7e2d, (scene, random) => {
    for (let index = 0; index < 10; index += 1) {
      addThunderArc(scene, -0.82 + random() * 1.64, -0.82 + random() * 1.64, 0.24 + random() * 0.48, random);
    }
    for (let index = 0; index < 14; index += 1) {
      addThunderWaveLine(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.36 + random() * 0.62, random);
    }
    for (let index = 0; index < 18; index += 1) {
      addThunderTick(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.08 + random() * 0.16, random);
    }
  });
}

function addFogPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.55 ? 0xf8fafc : 0xcbd5e1, transparent: true, opacity: 0.035 + random() * 0.115, depthWrite: false })
  );
  puff.position.set(x, y, 0.02);
  puff.scale.set(1 + random() * 0.9, 0.62 + random() * 0.62, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
}

function addStormPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0x1e3a8a : 0x64748b, transparent: true, opacity: 0.055 + random() * 0.16, depthWrite: false })
  );
  puff.position.set(x, y, 0.02);
  puff.scale.set(1 + random() * 0.9, 0.58 + random() * 0.72, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
}

function addThunderArc(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const arcCount = 2 + Math.floor(random() * 2);
  for (let index = 0; index < arcCount; index += 1) {
    const arcRadius = radius * (0.72 + index * 0.36 + random() * 0.08);
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(arcRadius * 0.94, arcRadius, 54, 1, random() * Math.PI * 2, Math.PI * (0.38 + random() * 0.55)),
      new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0xd8b4fe : 0xc084fc, transparent: true, opacity: 0.16 + random() * 0.3, side: THREE.DoubleSide, depthWrite: false })
    );
    arc.position.set(x, y, 0.03 + index * 0.002);
    arc.scale.set(1 + random() * 0.45, 0.7 + random() * 0.32, 1);
    arc.rotation.z = random() * Math.PI;
    scene.add(arc);
  }
}

function addThunderWaveLine(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.025 + random() * 0.045);
  const points: Point[] = [];
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const wave = Math.sin(t * Math.PI * (1.8 + random() * 1.2)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addLightningLine(scene, points, random() > 0.45 ? 0xc084fc : 0xf3e8ff, 0.18 + random() * 0.28, 0.004 + random() * 0.004);
}

function addThunderTick(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const points = [
    new THREE.Vector3(x - Math.cos(angle) * length * 0.5, y - Math.sin(angle) * length * 0.5, 0.04),
    new THREE.Vector3(x + Math.cos(angle) * length * 0.5, y + Math.sin(angle) * length * 0.5, 0.04)
  ];
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: random() > 0.5 ? 0xf3e8ff : 0xd8b4fe, transparent: true, opacity: 0.16 + random() * 0.42 })
    )
  );
}
