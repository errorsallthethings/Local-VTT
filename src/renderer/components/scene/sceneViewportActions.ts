import { getCameraForWheelZoom, getCanvasViewportCenter, getRenderCamera, type Camera } from "../../canvas/core";

export function getSceneViewportCenterReport(
  element: Pick<HTMLElement, "getBoundingClientRect"> | null,
  camera: Camera,
  playerDisplayScale: number
) {
  return element ? getCanvasViewportCenter(element, getRenderCamera(camera, playerDisplayScale)) : null;
}

export function getSceneWheelZoomCamera({
  camera,
  clientX,
  clientY,
  deltaY,
  element,
  interactive
}: {
  camera: Camera;
  clientX: number;
  clientY: number;
  deltaY: number;
  element: Pick<HTMLElement, "getBoundingClientRect"> | null;
  interactive: boolean;
}): Camera | null {
  if (!interactive || !element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return getCameraForWheelZoom({
    camera,
    mouseX: clientX - rect.left,
    mouseY: clientY - rect.top,
    deltaY
  });
}
