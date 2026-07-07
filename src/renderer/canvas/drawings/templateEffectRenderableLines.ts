import * as THREE from "three";
import type { Point } from "../../../shared/localvtt";
import { distanceBetweenPoints } from "./drawingGeometry";

export function addLightningBolt(scene: THREE.Scene, start: Point, end: Point, segments: number, opacity: number, random: () => number) {
  const points = getJaggedBoltPoints(start, end, segments, 0.08 + random() * 0.07, random);
  addLightningLine(scene, points, 0xfacc15, opacity, 0.012);
  addLightningLine(scene, points, 0xfef08a, opacity * 0.78, 0.006);
  addLightningLine(scene, points, 0xeab308, opacity * 0.42, 0.018);
  for (let index = 1; index < points.length - 1; index += 1) {
    if (random() < 0.72) {
      const current = points[index];
      const previous = points[index - 1];
      const angle = Math.atan2(current.y - previous.y, current.x - previous.x) + (random() > 0.5 ? 1 : -1) * (0.72 + random() * 0.7);
      const length = distanceBetweenPoints(start, end) * (0.22 + random() * 0.34);
      const branchEnd = {
        x: Math.max(-0.96, Math.min(0.96, current.x + Math.cos(angle) * length)),
        y: Math.max(-0.96, Math.min(0.96, current.y + Math.sin(angle) * length))
      };
      addLightningLine(scene, getJaggedBoltPoints(current, branchEnd, 2 + Math.floor(random() * 3), 0.035 + random() * 0.04, random), 0xfef08a, opacity * (0.46 + random() * 0.24), 0.006);
    }
  }
}

export function addLightningLine(scene: THREE.Scene, points: Point[], color: number, opacity: number, thickness = 0) {
  const drawOffsets = thickness > 0 ? [{ x: 0, y: 0 }, { x: thickness, y: 0 }, { x: -thickness, y: 0 }, { x: 0, y: thickness }, { x: 0, y: -thickness }] : [{ x: 0, y: 0 }];
  for (const offset of drawOffsets) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x + offset.x, point.y + offset.y, 0.04)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.max(0.05, Math.min(0.88, opacity / Math.sqrt(drawOffsets.length))) });
    scene.add(new THREE.Line(geometry, material));
  }
}

function getJaggedBoltPoints(start: Point, end: Point, segments: number, jitter: number, random: () => number): Point[] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;
  const points: Point[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const offset = index === 0 || index === segments ? 0 : (random() - 0.5) * jitter;
    points.push({
      x: start.x + (end.x - start.x) * t + Math.cos(angle) * offset,
      y: start.y + (end.y - start.y) * t + Math.sin(angle) * offset
    });
  }
  return points;
}
