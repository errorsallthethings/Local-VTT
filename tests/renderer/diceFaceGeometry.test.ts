import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  compareFacePlacements,
  getD10StyleFacePlacements,
  getD4VertexLabels,
  getDieFaceLabelPlacements,
  getFaceLabelQuaternion,
  getGeometryFacePlacements,
  getGeometryTriangles,
  getOppositeFacePairs,
  getOppositeSumFacePlacements,
  getPoleFaceLabelUp,
  getVertexKey,
  type FaceLabelPlacement
} from "../../src/renderer/lib/dice";

function placement(x: number, y: number, z: number): Omit<FaceLabelPlacement, "label" | "size"> {
  const position = new THREE.Vector3(x, y, z);
  return { position, normal: position.clone().normalize() };
}

describe("dice face geometry helpers", () => {
  it("returns fixed face placements for coin, d2, and d6", () => {
    expect(getDieFaceLabelPlacements("coin", new THREE.BufferGeometry()).map((face) => face.label)).toEqual(["Heads", "Tails"]);
    expect(getDieFaceLabelPlacements("d2", new THREE.BufferGeometry()).map((face) => face.label)).toEqual(["1", "2"]);
    expect(getDieFaceLabelPlacements("d6", new THREE.BoxGeometry(1.9, 1.9, 1.9)).map((face) => face.label)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("extracts triangle and face placements from geometry", () => {
    const geometry = new THREE.TetrahedronGeometry(1.45, 0);

    expect(getGeometryTriangles(geometry)).toHaveLength(4);
    expect(getGeometryFacePlacements(geometry)).toHaveLength(4);
    expect(getDieFaceLabelPlacements("d4", geometry)).toHaveLength(12);

    geometry.dispose();
  });

  it("pairs opposite placements and sorts pairs by their readable side", () => {
    const placements = [placement(0, 1, 0), placement(0, -1, 0), placement(1, 0, 0), placement(-1, 0, 0)];
    const pairs = getOppositeFacePairs(placements);

    expect(pairs).toHaveLength(2);
    expect(pairs.map(([first, second]) => Math.round(first.normal.dot(second.normal)))).toEqual([-1, -1]);
    expect(compareFacePlacements(placements[0], placements[1])).toBeLessThan(0);
  });

  it("labels opposite-sum dice and d10-style dice", () => {
    const placements = [placement(0, 1, 0), placement(0, -1, 0), placement(1, 0, 0), placement(-1, 0, 0)];

    expect(getOppositeSumFacePlacements("d8", placements).map((face) => face.label)).toEqual(["1", "8", "2", "7"]);
    expect(getD10StyleFacePlacements("d10", placements).map((face) => face.label)).toEqual(["1", "8", "3", "6"]);
    expect(getD10StyleFacePlacements("d00", placements).map((face) => face.label)).toEqual(["10", "80", "30", "60"]);
  });

  it("creates deterministic D4 vertex labels and rounded vertex keys", () => {
    const vertices = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)];
    const labels = getD4VertexLabels(vertices);

    expect(getVertexKey(new THREE.Vector3(1 / 3, 2 / 3, 1))).toBe("0.3333,0.6667,1.0000");
    expect([...labels.values()]).toEqual(["1", "2", "3"]);
  });

  it("returns normalized label-up and face quaternions", () => {
    const faceQuaternion = getFaceLabelQuaternion(new THREE.Vector3(0, 0, 1));
    const upQuaternion = getFaceLabelQuaternion(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
    const poleUp = getPoleFaceLabelUp(new THREE.Vector3(1, 0.5, 0));

    expect(Math.hypot(faceQuaternion.x, faceQuaternion.y, faceQuaternion.z, faceQuaternion.w)).toBeCloseTo(1);
    expect(Math.hypot(upQuaternion.x, upQuaternion.y, upQuaternion.z, upQuaternion.w)).toBeCloseTo(1);
    expect(poleUp.length()).toBeCloseTo(1);
  });
});
