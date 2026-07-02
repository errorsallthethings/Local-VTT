import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { applyResolvedDiceVisualState, disposeMaterial, disposeObjectMaterialsAndGeometry, setObjectMaterialOpacity, type ResolvedDiceResult } from "../../src/renderer/lib/dice";

function resolvedResult(kept: boolean): ResolvedDiceResult {
  return {
    label: "4",
    summary: "D6",
    result: 4,
    dice: [{ kept, label: "4", value: 4 }]
  };
}

describe("dice material helpers", () => {
  it("sets material opacity and transparency on meshes", () => {
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);

    setObjectMaterialOpacity(mesh, 0.42);

    expect(material.opacity).toBe(0.42);
    expect(material.transparent).toBe(true);

    mesh.geometry.dispose();
    material.dispose();
  });

  it("applies kept and dropped opacity to dice visual groups", () => {
    const keptGroup = new THREE.Group();
    const keptMeshMaterial = new THREE.MeshStandardMaterial();
    const keptLineMaterial = new THREE.LineBasicMaterial();
    keptGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), keptMeshMaterial));
    keptGroup.add(new THREE.LineSegments(new THREE.BufferGeometry(), keptLineMaterial));

    const droppedGroup = keptGroup.clone();
    const droppedMeshMaterial = new THREE.MeshStandardMaterial();
    const droppedLineMaterial = new THREE.LineBasicMaterial();
    droppedGroup.clear();
    droppedGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), droppedMeshMaterial));
    droppedGroup.add(new THREE.LineSegments(new THREE.BufferGeometry(), droppedLineMaterial));

    applyResolvedDiceVisualState([{ die: keptGroup }], resolvedResult(true));
    applyResolvedDiceVisualState([{ die: droppedGroup }], resolvedResult(false));

    expect(keptMeshMaterial.opacity).toBe(1);
    expect(keptLineMaterial.opacity).toBe(0.36);
    expect(droppedMeshMaterial.opacity).toBe(0.42);
    expect(droppedLineMaterial.opacity).toBe(0.16);

    disposeObjectMaterialsAndGeometry(keptGroup);
    disposeObjectMaterialsAndGeometry(droppedGroup);
  });

  it("disposes material textures and traversed object materials/geometries", () => {
    const texture = new THREE.Texture();
    const textureDispose = vi.spyOn(texture, "dispose");
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const materialDispose = vi.spyOn(material, "dispose");
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));

    disposeObjectMaterialsAndGeometry(group);

    expect(textureDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
  });

  it("disposes a standalone material texture", () => {
    const texture = new THREE.Texture();
    const textureDispose = vi.spyOn(texture, "dispose");
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const materialDispose = vi.spyOn(material, "dispose");

    disposeMaterial(material);

    expect(textureDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
  });
});
