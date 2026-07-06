import * as THREE from "three";
import { createSeededRandom } from "./templateEffectGeometry";

export type TemplateEffectSceneBuilder = (scene: THREE.Scene, random: () => number) => void;

export function createTemplateEffectImage(seed: number, buildScene: TemplateEffectSceneBuilder): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    buildScene(scene, createSeededRandom(seed));
    renderer.render(scene, camera);
    return snapshotRendererCanvas(canvas);
  } catch {
    return null;
  } finally {
    if (scene) {
      disposeScene(scene);
    }
    if (renderer) {
      disposeTransientRenderer(renderer);
    }
  }
}

function disposeTransientRenderer(renderer: THREE.WebGLRenderer) {
  renderer.forceContextLoss();
  renderer.dispose();
}

function snapshotRendererCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const snapshot = document.createElement("canvas");
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  const snapshotContext = snapshot.getContext("2d");
  if (!snapshotContext) {
    return canvas;
  }
  snapshotContext.drawImage(canvas, 0, 0);
  return snapshot;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          material.dispose();
        }
      } else {
        object.material.dispose();
      }
    }
  });
}
