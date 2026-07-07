import * as THREE from "three";
import type { DiceVisualRoll } from "./dice";
import { D10_POLE_HEIGHT } from "./diceFaceGeometry";

export function createDieGeometry(die: DiceVisualRoll["die"]): THREE.BufferGeometry {
  if (die === "coin" || die === "d2") {
    return new THREE.CylinderGeometry(1.28, 1.28, 0.32, 48, 1);
  }
  if (die === "d4") {
    return new THREE.TetrahedronGeometry(1.45, 0);
  }
  if (die === "d6") {
    return new THREE.BoxGeometry(1.9, 1.9, 1.9);
  }
  if (die === "d8") {
    return new THREE.OctahedronGeometry(1.55, 0);
  }
  if (die === "d10" || die === "d00") {
    return createPentagonalTrapezohedronGeometry();
  }
  if (die === "d12") {
    return new THREE.DodecahedronGeometry(1.48, 0);
  }
  return new THREE.IcosahedronGeometry(1.48, 0);
}

export function getScaledGeometryPoints(geometry: THREE.BufferGeometry, scale: number): Float32Array {
  const position = geometry.getAttribute("position");
  const points = new Float32Array(position.count * 3);
  const vertex = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index).multiplyScalar(scale);
    points[index * 3] = vertex.x;
    points[index * 3 + 1] = vertex.y;
    points[index * 3 + 2] = vertex.z;
  }
  return points;
}

export function createPentagonalTrapezohedronGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const faces: number[] = [];
  const capHeight = D10_POLE_HEIGHT;
  const ringRadius = 1.08;
  const ringHeight = (capHeight * (1 - Math.cos(Math.PI / 5))) / (1 + Math.cos(Math.PI / 5));
  const top = new THREE.Vector3(0, capHeight, 0);
  const bottom = new THREE.Vector3(0, -capHeight, 0);
  const upper: THREE.Vector3[] = [];
  const lower: THREE.Vector3[] = [];
  for (let index = 0; index < 5; index += 1) {
    const upperAngle = (index / 5) * Math.PI * 2;
    const lowerAngle = upperAngle + Math.PI / 5;
    upper.push(new THREE.Vector3(Math.cos(upperAngle) * ringRadius, ringHeight, Math.sin(upperAngle) * ringRadius));
    lower.push(new THREE.Vector3(Math.cos(lowerAngle) * ringRadius, -ringHeight, Math.sin(lowerAngle) * ringRadius));
  }
  const points = [top, bottom, ...upper, ...lower];
  for (const point of points) {
    vertices.push(point.x, point.y, point.z);
  }
  for (let index = 0; index < 5; index += 1) {
    const next = (index + 1) % 5;
    const upperA = 2 + index;
    const upperB = 2 + next;
    const lowerA = 7 + index;
    const lowerPrev = 7 + ((index + 4) % 5);
    faces.push(0, upperA, lowerA, 0, lowerA, upperB, 1, lowerA, upperA, 1, upperA, lowerPrev);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}
