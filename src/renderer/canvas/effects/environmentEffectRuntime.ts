import * as THREE from "three";
import type { ScreenBounds } from "./environmentEffectRendererMath";
import { getEffectWorldOrigin, getEffectWorldSize } from "./environmentEffectRendererMath";

export type EnvironmentEffectRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  meshA: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  meshB: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  startedAt: number;
  width: number;
  height: number;
};

let sharedEnvironmentEffectRenderer: THREE.WebGLRenderer | null = null;
let sharedEffectPlaneGeometry: THREE.PlaneGeometry | null = null;

export function getSharedEnvironmentEffectRenderer(): THREE.WebGLRenderer | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!sharedEnvironmentEffectRenderer) {
    sharedEnvironmentEffectRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    sharedEnvironmentEffectRenderer.setPixelRatio(1);
  }

  return sharedEnvironmentEffectRenderer;
}

export function getSharedEffectPlaneGeometry(): THREE.PlaneGeometry {
  if (!sharedEffectPlaneGeometry) {
    sharedEffectPlaneGeometry = new THREE.PlaneGeometry(1, 1);
  }
  return sharedEffectPlaneGeometry;
}

export function disposeEnvironmentEffectRuntime(runtime: EnvironmentEffectRuntime | null): void {
  if (!runtime) {
    return;
  }
  runtime.meshA.material.dispose();
  runtime.meshB.material.dispose();
}

export function disposeSharedEnvironmentEffectRuntimeResources(): void {
  sharedEffectPlaneGeometry?.dispose();
  sharedEffectPlaneGeometry = null;
  sharedEnvironmentEffectRenderer?.dispose();
  sharedEnvironmentEffectRenderer = null;
}

export function updateEnvironmentEffectCameraUniforms(material: THREE.ShaderMaterial, bounds: ScreenBounds, cameraState: { x: number; y: number; zoom: number }): void {
  const origin = getEffectWorldOrigin(bounds, cameraState);
  material.uniforms.cameraOffset.value.set(cameraState.x, cameraState.y);
  material.uniforms.cameraZoom.value = cameraState.zoom;
  material.uniforms.effectOrigin.value.set(origin.x, origin.y);
  if (material.uniforms.effectSize) {
    const size = getEffectWorldSize(bounds, cameraState);
    material.uniforms.effectSize.value.set(size.width, size.height);
  }
}

export function positionEnvironmentEffectMesh(mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>, width: number, height: number, scale: number): void {
  mesh.position.x = width / 2;
  mesh.position.y = height / 2;
  mesh.scale.x = width * scale;
  mesh.scale.y = height * scale;
}
