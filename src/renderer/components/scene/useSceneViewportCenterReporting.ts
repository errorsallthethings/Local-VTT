import { useEffect, type RefObject } from "react";
import type { Scene } from "../../../shared/localvtt";
import type { Camera } from "../../canvas/core";
import { getSceneViewportCenterReport } from "./sceneViewportActions";

interface SceneViewportCenterReportingOptions {
  camera: Camera;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  mode: "gm" | "player";
  onViewportCenterChange?: (center: { x: number; y: number }) => void;
  playerDisplayScale: number;
  scene: Scene | null;
}

export function useSceneViewportCenterReporting({
  camera,
  canvasRef,
  mode,
  onViewportCenterChange,
  playerDisplayScale,
  scene
}: SceneViewportCenterReportingOptions) {
  useEffect(() => {
    if (mode !== "gm" || !scene || !onViewportCenterChange) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const reportCenter = () => {
      const center = getSceneViewportCenterReport(canvas, camera, playerDisplayScale);
      if (center) {
        onViewportCenterChange(center);
      }
    };

    reportCenter();
    const observer = new ResizeObserver(reportCenter);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [camera, canvasRef, mode, onViewportCenterChange, playerDisplayScale, scene]);
}
