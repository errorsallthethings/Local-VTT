import { useCallback, useEffect, type RefObject } from "react";
import type { Camera } from "../../canvas/core";
import { getSceneWheelZoomCamera } from "./sceneViewportActions";

interface SceneWheelZoomOptions {
  camera: Camera;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  interactive: boolean;
  onAutoFitCameraDisabled: () => void;
  onCameraChange: (camera: Camera) => void;
}

export function useSceneWheelZoom({
  camera,
  canvasRef,
  interactive,
  onAutoFitCameraDisabled,
  onCameraChange
}: SceneWheelZoomOptions) {
  const onWheel = useCallback((event: WheelEvent) => {
    if (!interactive) {
      return;
    }
    event.preventDefault();
    const nextCamera = getSceneWheelZoomCamera({
      camera,
      clientX: event.clientX,
      clientY: event.clientY,
      deltaY: event.deltaY,
      element: canvasRef.current,
      interactive
    });
    if (!nextCamera) {
      return;
    }

    onAutoFitCameraDisabled();
    onCameraChange(nextCamera);
  }, [camera, canvasRef, interactive, onAutoFitCameraDisabled, onCameraChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [canvasRef, onWheel]);
}
