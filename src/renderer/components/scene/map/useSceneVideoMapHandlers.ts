import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { Scene } from "../../../../shared/localvtt";
import type { MapLoadStatus } from "../../../canvas/map";
import {
  getVideoMapDeferredErrorAction,
  getVideoMapImmediateErrorAction,
  shouldFitGmCameraToVideoMap
} from "./sceneMapViewportPolicy";

interface SceneVideoMapHandlersOptions {
  activeVideoIndex: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  fitGmCameraToReadyMap: (viewportWidth: number, viewportHeight: number) => void;
  isVideoMap: boolean;
  mapAssetId: string | null | undefined;
  mode: "gm" | "player";
  playActiveWhenReady: (index: number) => void;
  scene: Scene | null;
  setVideoMapLoadStatus: Dispatch<SetStateAction<MapLoadStatus>>;
}

export interface SceneVideoMapHandlers {
  handleVideoMapCanPlay: (video: HTMLVideoElement, index: number) => void;
  handleVideoMapError: (video: HTMLVideoElement, index: number) => void;
  handleVideoMapMetadataReady: (video: HTMLVideoElement) => void;
  handleVideoMapReady: (video: HTMLVideoElement) => void;
}

export function getVideoMapViewportSize(element: Pick<HTMLElement, "getBoundingClientRect"> | null): { height: number; width: number } {
  const rect = element?.getBoundingClientRect();
  return {
    height: rect?.height ?? 0,
    width: rect?.width ?? 0
  };
}

export function useSceneVideoMapHandlers({
  activeVideoIndex,
  canvasRef,
  fitGmCameraToReadyMap,
  isVideoMap,
  mapAssetId,
  mode,
  playActiveWhenReady,
  scene,
  setVideoMapLoadStatus
}: SceneVideoMapHandlersOptions): SceneVideoMapHandlers {
  const fitGmCameraToVideoMap = useCallback((video: HTMLVideoElement) => {
    const viewport = getVideoMapViewportSize(canvasRef.current);
    if (
      !shouldFitGmCameraToVideoMap({
        hasScene: Boolean(scene),
        isVideoMap,
        mapAssetId,
        mode,
        videoHeight: video.videoHeight,
        videoMapAssetId: video.dataset.mapAssetId,
        videoWidth: video.videoWidth,
        viewportHeight: viewport.height,
        viewportWidth: viewport.width
      })
    ) {
      return;
    }

    fitGmCameraToReadyMap(viewport.width, viewport.height);
  }, [canvasRef, fitGmCameraToReadyMap, isVideoMap, mapAssetId, mode, scene]);

  const handleVideoMapCanPlay = useCallback((video: HTMLVideoElement, index: number) => {
    setVideoMapLoadStatus("ready");
    fitGmCameraToVideoMap(video);
    playActiveWhenReady(index);
  }, [fitGmCameraToVideoMap, playActiveWhenReady, setVideoMapLoadStatus]);

  const handleVideoMapReady = useCallback((video: HTMLVideoElement) => {
    setVideoMapLoadStatus("ready");
    fitGmCameraToVideoMap(video);
  }, [fitGmCameraToVideoMap, setVideoMapLoadStatus]);

  const handleVideoMapMetadataReady = useCallback((video: HTMLVideoElement) => {
    fitGmCameraToVideoMap(video);
  }, [fitGmCameraToVideoMap]);

  const handleVideoMapError = useCallback((video: HTMLVideoElement, index: number) => {
    const immediateAction = getVideoMapImmediateErrorAction(video.readyState);
    if (immediateAction.kind === "set-status") {
      setVideoMapLoadStatus(immediateAction.status);
      return;
    }
    window.setTimeout(() => {
      setVideoMapLoadStatus((status) => {
        const deferredAction = getVideoMapDeferredErrorAction({
          activeVideoIndex,
          currentStatus: status,
          index,
          readyState: video.readyState
        });
        return deferredAction.kind === "set-status" ? deferredAction.status : status;
      });
    }, 180);
  }, [activeVideoIndex, setVideoMapLoadStatus]);

  return {
    handleVideoMapCanPlay,
    handleVideoMapError,
    handleVideoMapMetadataReady,
    handleVideoMapReady
  };
}
