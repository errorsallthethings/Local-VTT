import * as THREE from "three";
import type { DiceVisualRoll } from "./dice";
import { formatD10StyleFaceLabel, getDieFaceLabels, getPolyhedralFaceLabelSize, shouldUnderlineFaceLabel } from "./diceFaceStyle";

export const D10_POLE_HEIGHT = 1.32;

export type FaceLabelPlacement = {
  label: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  size?: number;
  up?: THREE.Vector3;
  underline?: boolean;
};

export type GeometryTriangle = {
  normal: THREE.Vector3;
  center: THREE.Vector3;
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
};

export function getDieFaceLabelPlacements(die: DiceVisualRoll["die"], geometry: THREE.BufferGeometry): FaceLabelPlacement[] {
  if (die === "coin") {
    return [
      { label: "Heads", position: new THREE.Vector3(0, 0.175, 0), normal: new THREE.Vector3(0, 1, 0), size: 1.5 },
      { label: "Tails", position: new THREE.Vector3(0, -0.175, 0), normal: new THREE.Vector3(0, -1, 0), size: 1.5 }
    ];
  }
  if (die === "d2") {
    return [
      { label: "1", position: new THREE.Vector3(0, 0.175, 0), normal: new THREE.Vector3(0, 1, 0), size: 1.22 },
      { label: "2", position: new THREE.Vector3(0, -0.175, 0), normal: new THREE.Vector3(0, -1, 0), size: 1.22 }
    ];
  }
  if (die === "d4") {
    return getD4TopReadLabelPlacements(geometry);
  }
  if (die === "d6") {
    return [
      { label: "1", position: new THREE.Vector3(0, 0, 0.956), normal: new THREE.Vector3(0, 0, 1), size: 1.18 },
      { label: "2", position: new THREE.Vector3(0.956, 0, 0), normal: new THREE.Vector3(1, 0, 0), size: 1.18 },
      { label: "3", position: new THREE.Vector3(0, 0.956, 0), normal: new THREE.Vector3(0, 1, 0), size: 1.18 },
      { label: "4", position: new THREE.Vector3(0, -0.956, 0), normal: new THREE.Vector3(0, -1, 0), size: 1.18 },
      { label: "5", position: new THREE.Vector3(-0.956, 0, 0), normal: new THREE.Vector3(-1, 0, 0), size: 1.18 },
      { label: "6", position: new THREE.Vector3(0, 0, -0.956), normal: new THREE.Vector3(0, 0, -1), size: 1.18 }
    ];
  }
  const labels = getDieFaceLabels(die);
  const placements = getGeometryFacePlacements(geometry).slice(0, labels.length);
  if (die === "d10" || die === "d00") {
    return getD10StyleFacePlacements(die, placements);
  }
  return getOppositeSumFacePlacements(die, placements);
}

export function getOppositeSumFacePlacements(die: DiceVisualRoll["die"], placements: Array<Omit<FaceLabelPlacement, "label" | "size">>): FaceLabelPlacement[] {
  const oppositeSum = die === "d8" ? 9 : die === "d12" ? 13 : die === "d20" ? 21 : 0;
  const pairs = getOppositeFacePairs(placements);
  return pairs.flatMap(([first, second], index) => {
    const lowValue = index + 1;
    const highValue = oppositeSum - lowValue;
    const [lowPlacement, highPlacement] = first.position.y >= second.position.y ? [first, second] : [second, first];
    return [
      {
        ...lowPlacement,
        label: String(lowValue),
        size: getPolyhedralFaceLabelSize(die),
        up: die === "d8" ? getPoleFaceLabelUp(lowPlacement.position) : undefined,
        underline: shouldUnderlineFaceLabel(die, String(lowValue))
      },
      {
        ...highPlacement,
        label: String(highValue),
        size: getPolyhedralFaceLabelSize(die),
        up: die === "d8" ? getPoleFaceLabelUp(highPlacement.position) : undefined,
        underline: shouldUnderlineFaceLabel(die, String(highValue))
      }
    ];
  });
}

export function getD10StyleFacePlacements(die: "d10" | "d00", placements: Array<Omit<FaceLabelPlacement, "label" | "size">>): FaceLabelPlacement[] {
  const pairs = getOppositeFacePairs(placements);
  const oddValues = [1, 3, 5, 7, 9];
  return pairs.flatMap(([first, second], index) => {
    const oddValue = oddValues[index] ?? 9;
    const evenValue = 9 - oddValue;
    const [oddPlacement, evenPlacement] = first.position.y >= second.position.y ? [first, second] : [second, first];
    return [
      {
        ...oddPlacement,
        label: formatD10StyleFaceLabel(die, oddValue),
        size: getPolyhedralFaceLabelSize(die),
        up: getPoleFaceLabelUp(oddPlacement.position),
        underline: shouldUnderlineFaceLabel(die, formatD10StyleFaceLabel(die, oddValue))
      },
      {
        ...evenPlacement,
        label: formatD10StyleFaceLabel(die, evenValue),
        size: getPolyhedralFaceLabelSize(die),
        up: getPoleFaceLabelUp(evenPlacement.position),
        underline: shouldUnderlineFaceLabel(die, formatD10StyleFaceLabel(die, evenValue))
      }
    ];
  });
}

export function getOppositeFacePairs(placements: Array<Omit<FaceLabelPlacement, "label" | "size">>): Array<[Omit<FaceLabelPlacement, "label" | "size">, Omit<FaceLabelPlacement, "label" | "size">]> {
  const available = [...placements].sort(compareFacePlacements);
  const pairs: Array<[Omit<FaceLabelPlacement, "label" | "size">, Omit<FaceLabelPlacement, "label" | "size">]> = [];
  while (available.length > 1) {
    const first = available.shift();
    if (!first) {
      break;
    }
    let oppositeIndex = 0;
    let oppositeDot = Number.POSITIVE_INFINITY;
    available.forEach((candidate, index) => {
      const dot = first.normal.dot(candidate.normal);
      if (dot < oppositeDot) {
        oppositeDot = dot;
        oppositeIndex = index;
      }
    });
    const [second] = available.splice(oppositeIndex, 1);
    pairs.push([first, second]);
  }
  return pairs.sort(([firstA, secondA], [firstB, secondB]) => compareFacePlacements(getPairSortPlacement(firstA, secondA), getPairSortPlacement(firstB, secondB)));
}

export function compareFacePlacements(first: Omit<FaceLabelPlacement, "label" | "size">, second: Omit<FaceLabelPlacement, "label" | "size">): number {
  return second.position.y - first.position.y || second.position.z - first.position.z || second.position.x - first.position.x;
}

export function getD4TopReadLabelPlacements(geometry: THREE.BufferGeometry): FaceLabelPlacement[] {
  const triangles = getGeometryTriangles(geometry);
  const vertexLabels = getD4VertexLabels(triangles.flatMap((triangle) => triangle.vertices));
  return triangles.flatMap((triangle) =>
    triangle.vertices.map((vertex) => ({
      label: vertexLabels.get(getVertexKey(vertex)) ?? "1",
      position: vertex.clone().lerp(triangle.center, 0.36).add(triangle.normal.clone().multiplyScalar(0.02)),
      normal: triangle.normal.clone(),
      size: 0.57,
      up: vertex.clone().sub(triangle.center).normalize()
    }))
  );
}

export function getPoleFaceLabelUp(position: THREE.Vector3): THREE.Vector3 {
  const pole = new THREE.Vector3(0, position.y >= 0 ? D10_POLE_HEIGHT : -D10_POLE_HEIGHT, 0);
  return pole.sub(position).normalize();
}

export function getD4VertexLabels(vertices: THREE.Vector3[]): Map<string, string> {
  const uniqueVertices = new Map<string, THREE.Vector3>();
  vertices.forEach((vertex) => uniqueVertices.set(getVertexKey(vertex), vertex.clone()));
  return new Map(
    [...uniqueVertices.entries()]
      .sort(([, a], [, b]) => b.y - a.y || b.z - a.z || b.x - a.x)
      .map(([key], index) => [key, String(index + 1)])
  );
}

export function getVertexKey(vertex: THREE.Vector3): string {
  return `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`;
}

export function getGeometryFacePlacements(geometry: THREE.BufferGeometry): Array<Omit<FaceLabelPlacement, "label" | "size">> {
  const triangles = getGeometryTriangles(geometry);
  const clusters: Array<{ normal: THREE.Vector3; center: THREE.Vector3; count: number }> = [];
  triangles.forEach(({ normal, center }) => {
    const cluster = clusters.find((candidate) => candidate.normal.dot(normal) > 0.996);
    if (cluster) {
      cluster.normal.add(normal).normalize();
      cluster.center.add(center);
      cluster.count += 1;
      return;
    }
    clusters.push({ normal: normal.clone(), center: center.clone(), count: 1 });
  });
  return clusters
    .map((cluster) => {
      const center = cluster.center.multiplyScalar(1 / cluster.count);
      const normal = cluster.normal.normalize();
      return {
        normal,
        position: center.add(normal.clone().multiplyScalar(0.018))
      };
    })
    .sort((a, b) => b.position.y - a.position.y || b.position.z - a.position.z || b.position.x - a.position.x);
}

export function getGeometryTriangles(geometry: THREE.BufferGeometry): GeometryTriangle[] {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const triangles: GeometryTriangle[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const readVertex = (vertexIndex: number, target: THREE.Vector3) => target.fromBufferAttribute(position, vertexIndex);
  const triangleCount = index ? index.count / 3 : position.count / 3;
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const vertexA = index ? index.getX(triangleIndex * 3) : triangleIndex * 3;
    const vertexB = index ? index.getX(triangleIndex * 3 + 1) : triangleIndex * 3 + 1;
    const vertexC = index ? index.getX(triangleIndex * 3 + 2) : triangleIndex * 3 + 2;
    readVertex(vertexA, a);
    readVertex(vertexB, b);
    readVertex(vertexC, c);
    const normal = edgeA.subVectors(b, a).cross(edgeB.subVectors(c, a)).normalize();
    const center = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3);
    if (normal.dot(center) < 0) {
      normal.multiplyScalar(-1);
    }
    if (normal.lengthSq() > 0) {
      triangles.push({ normal: normal.clone(), center, vertices: [a.clone(), b.clone(), c.clone()] });
    }
  }
  return triangles;
}

export function getFaceLabelQuaternion(normal: THREE.Vector3, up?: THREE.Vector3): THREE.Quaternion {
  const faceNormal = normal.clone().normalize();
  if (!up) {
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceNormal);
  }
  const labelUp = up.clone().projectOnPlane(faceNormal).normalize();
  if (labelUp.lengthSq() === 0) {
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceNormal);
  }
  const labelRight = labelUp.clone().cross(faceNormal).normalize();
  const matrix = new THREE.Matrix4().makeBasis(labelRight, labelUp, faceNormal);
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

function getPairSortPlacement(first: Omit<FaceLabelPlacement, "label" | "size">, second: Omit<FaceLabelPlacement, "label" | "size">): Omit<FaceLabelPlacement, "label" | "size"> {
  return first.position.y >= second.position.y ? first : second;
}
