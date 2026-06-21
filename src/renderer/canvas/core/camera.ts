export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface CameraPanDrag {
  x: number;
  y: number;
  camera: Camera;
}

export function getRenderCamera(camera: Camera, displayScale: number): Camera {
  return {
    x: camera.x,
    y: camera.y,
    zoom: camera.zoom * displayScale
  };
}

export function areCamerasEqual(a: Camera, b: Camera): boolean {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && Math.abs(a.zoom - b.zoom) < 0.0001;
}

export function getCameraForPanDrag(drag: CameraPanDrag, clientX: number, clientY: number): Camera {
  return {
    ...drag.camera,
    x: drag.camera.x + clientX - drag.x,
    y: drag.camera.y + clientY - drag.y
  };
}

export interface WheelZoomCameraOptions {
  camera: Camera;
  mouseX: number;
  mouseY: number;
  deltaY: number;
  minZoom?: number;
  maxZoom?: number;
}

export function getCameraForWheelZoom({
  camera,
  mouseX,
  mouseY,
  deltaY,
  minZoom = 0.08,
  maxZoom = 6
}: WheelZoomCameraOptions): Camera {
  const zoomFactor = deltaY < 0 ? 1.08 : 0.92;
  const nextZoom = Math.min(maxZoom, Math.max(minZoom, camera.zoom * zoomFactor));
  const worldX = (mouseX - camera.x) / camera.zoom;
  const worldY = (mouseY - camera.y) / camera.zoom;

  return {
    zoom: nextZoom,
    x: mouseX - worldX * nextZoom,
    y: mouseY - worldY * nextZoom
  };
}
