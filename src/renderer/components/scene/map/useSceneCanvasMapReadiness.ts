import { useCallback, useEffect } from "react";
import type { Asset, Scene } from "../../../../shared/localvtt";
import { areCamerasEqual, type Camera } from "../../../canvas/core";
import { getCameraForMapFit, getReadyMapSourceForFit, type LoadedMap } from "../../../canvas/map";
import type { SceneCanvasReadiness } from "../../../canvas/scene";
import { getGmMapAutoFitAction } from "./sceneMapViewportPolicy";

interface MutableRef<T> {
  current: T;
}

type StateSetter<T> = (value: T | ((current: T) => T)) => void;

interface SceneCanvasMapReadinessOptions {
  activeVideoIndex: number;
  autoFitCameraRef: MutableRef<boolean>;
  canShowMap: boolean;
  canvasRef: MutableRef<HTMLCanvasElement | null>;
  fittedSceneCameraRef: MutableRef<string | null>;
  isVideoMap: boolean;
  loadedMap: LoadedMap | null;
  mapAsset: Asset | null | undefined;
  mode: "gm" | "player";
  onReady?: () => void;
  scene: Scene | null;
  sceneCanvasReadiness: SceneCanvasReadiness;
  setCamera: StateSetter<Camera>;
  videoRefs: MutableRef<Array<HTMLVideoElement | null>>;
}

export function useSceneCanvasMapReadiness({
  activeVideoIndex,
  autoFitCameraRef,
  canShowMap,
  canvasRef,
  fittedSceneCameraRef,
  isVideoMap,
  loadedMap,
  mapAsset,
  mode,
  onReady,
  scene,
  sceneCanvasReadiness,
  setCamera,
  videoRefs
}: SceneCanvasMapReadinessOptions): (viewportWidth: number, viewportHeight: number, force?: boolean) => boolean {
  const getCurrentReadyMapSourceForFit = useCallback(() => {
    if (!mapAsset || !canShowMap) {
      return null;
    }
    const activeVideo = isVideoMap ? (videoRefs.current[activeVideoIndex] ?? null) : null;
    return getReadyMapSourceForFit(loadedMap, mapAsset.id, activeVideo, isVideoMap);
  }, [activeVideoIndex, canShowMap, isVideoMap, loadedMap, mapAsset, videoRefs]);

  const fitGmCameraToReadyMap = useCallback(
    (viewportWidth: number, viewportHeight: number, force = false): boolean => {
      if (mode !== "gm" || !scene || !mapAsset || viewportWidth <= 0 || viewportHeight <= 0) {
        return false;
      }

      const fitSignature = `${scene.id}:${mapAsset.id}`;
      if (!force && fittedSceneCameraRef.current === fitSignature) {
        return false;
      }

      const mapSource = getCurrentReadyMapSourceForFit();
      if (!mapSource) {
        return false;
      }

      fittedSceneCameraRef.current = fitSignature;
      const nextCamera = getCameraForMapFit(scene, mapSource.width, mapSource.height, viewportWidth, viewportHeight);
      setCamera((currentCamera) => (areCamerasEqual(currentCamera, nextCamera) ? currentCamera : nextCamera));
      return true;
    },
    [fittedSceneCameraRef, getCurrentReadyMapSourceForFit, mapAsset, mode, scene, setCamera]
  );

  useEffect(() => {
    if (scene && sceneCanvasReadiness.ready) {
      onReady?.();
    }
  }, [onReady, scene, sceneCanvasReadiness.ready]);

  useEffect(() => {
    autoFitCameraRef.current = true;
    fittedSceneCameraRef.current = null;
  }, [autoFitCameraRef, fittedSceneCameraRef, mapAsset?.id, mode, scene?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const action = getGmMapAutoFitAction({
      canShowMap,
      fittedSignature: fittedSceneCameraRef.current,
      hasCanvas: Boolean(canvas),
      hasMapAsset: Boolean(mapAsset),
      hasScene: Boolean(scene),
      mapAssetId: mapAsset?.id,
      mode,
      sceneId: scene?.id,
      viewportHeight: rect?.height ?? 0,
      viewportWidth: rect?.width ?? 0
    });
    if (action.kind === "reset-empty-map") {
      fittedSceneCameraRef.current = action.signature;
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }
    if (action.kind === "fit-ready-map") {
      fitGmCameraToReadyMap(action.viewportWidth, action.viewportHeight);
    }
  }, [canShowMap, canvasRef, fitGmCameraToReadyMap, fittedSceneCameraRef, mapAsset, mode, scene, setCamera]);

  return fitGmCameraToReadyMap;
}
