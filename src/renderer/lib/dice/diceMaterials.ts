import * as THREE from "three";
import type { ResolvedDiceResult } from "./diceRollLabels";
import { DICE_FACE_HIGHLIGHT_DURATION_MS } from "./diceRollDisplay";

export type FaceHighlightAnimationState = {
  opacity: number;
  progress: number;
  scale: number;
  visible: boolean;
};

export function applyResolvedDiceVisualState(dice: Array<{ die: THREE.Group }>, resolvedResult: ResolvedDiceResult): void {
  dice.forEach((entry, index) => {
    const kept = resolvedResult.dice[index]?.kept !== false;
    entry.die.traverse((object) => {
      if (object instanceof THREE.LineSegments) {
        setObjectMaterialOpacity(object, kept ? 0.36 : 0.16);
        return;
      }
      if (!(object instanceof THREE.Mesh)) {
        return;
      }
      const opacity = object.material instanceof THREE.MeshStandardMaterial ? (kept ? 1 : 0.42) : kept ? 0.92 : 0.38;
      setObjectMaterialOpacity(object, opacity);
    });
  });
}

export function setObjectMaterialOpacity(object: THREE.Mesh | THREE.LineSegments, opacity: number): void {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => {
    material.transparent = opacity < 1;
    material.opacity = opacity;
    material.needsUpdate = true;
  });
}

export function disposeObjectMaterialsAndGeometry(object: THREE.Object3D): void {
  object.traverse((entry) => {
    if (entry instanceof THREE.Mesh || entry instanceof THREE.LineSegments) {
      entry.geometry.dispose();
      const materials = Array.isArray(entry.material) ? entry.material : [entry.material];
      materials.forEach(disposeMaterial);
    }
  });
}

export function disposeMaterial(material: THREE.Material): void {
  const textureMaterial = material as THREE.Material & { map?: THREE.Texture | null };
  textureMaterial.map?.dispose();
  material.dispose();
}

export function getFaceHighlightAnimationState(startedAt: number, now: number, durationMs = DICE_FACE_HIGHLIGHT_DURATION_MS): FaceHighlightAnimationState {
  const progress = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
  const pulse = Math.sin(progress * Math.PI * 5) * (1 - progress);
  return {
    opacity: 0.18 + Math.max(0, pulse) * 0.32,
    progress,
    scale: 1 + Math.max(0, pulse) * 0.16,
    visible: progress < 1
  };
}
