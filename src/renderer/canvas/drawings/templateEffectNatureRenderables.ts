import * as THREE from "three";
import type { Point } from "../../../shared/localvtt";
import { addLightningLine } from "./templateEffectRenderableLines";
import { createTemplateEffectImage } from "./templateEffectRenderableRuntime";

export function createNatureThornImage(): HTMLCanvasElement | null {
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

export function createRadiantLightImage(): HTMLCanvasElement | null {
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

export function createWaterDropletImage(): HTMLCanvasElement | null {
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

export function createWebStrandImage(): HTMLCanvasElement | null {
  return createTemplateEffectImage(0x5a1d, (scene, random) => {
    for (let index = 0; index < 5; index += 1) {
      addWebCluster(scene, -0.76 + random() * 1.52, -0.76 + random() * 1.52, 0.22 + random() * 0.34, random);
    }
    for (let index = 0; index < 20; index += 1) {
      addWebStrayThread(scene, -0.92 + random() * 1.84, -0.92 + random() * 1.84, 0.18 + random() * 0.42, random);
    }
  });
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
