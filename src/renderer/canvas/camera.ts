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
