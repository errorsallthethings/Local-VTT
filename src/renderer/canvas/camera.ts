export interface Camera {
  x: number;
  y: number;
  zoom: number;
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
