export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EnvironmentEffectCameraState {
  x: number;
  y: number;
  zoom: number;
}

export function getEffectWorldOrigin(bounds: ScreenBounds, cameraState: EnvironmentEffectCameraState) {
  const zoom = Math.max(cameraState.zoom, 0.01);
  return {
    x: (bounds.x - cameraState.x) / zoom,
    y: (bounds.y - cameraState.y) / zoom
  };
}

export function getEffectWorldSize(bounds: ScreenBounds, cameraState: EnvironmentEffectCameraState) {
  const zoom = Math.max(cameraState.zoom, 0.01);
  return {
    width: Math.max(bounds.width / zoom, 1),
    height: Math.max(bounds.height / zoom, 1)
  };
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
