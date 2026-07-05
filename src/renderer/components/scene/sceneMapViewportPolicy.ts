import type { MapLoadStatus } from "../../canvas/map";

export const VIDEO_MAP_CURRENT_DATA_READY_STATE = 2;

export type GmMapAutoFitAction =
  | { kind: "fit-ready-map"; signature: string; viewportWidth: number; viewportHeight: number }
  | { kind: "reset-empty-map"; signature: string }
  | { kind: "none" };

export interface GmMapAutoFitPolicyOptions {
  canShowMap: boolean | undefined;
  fittedSignature: string | null;
  hasCanvas: boolean;
  hasMapAsset: boolean;
  hasScene: boolean;
  mapAssetId: string | null | undefined;
  mode: "gm" | "player";
  sceneId: string | null | undefined;
  viewportHeight: number;
  viewportWidth: number;
}

export function getGmMapAutoFitAction(options: GmMapAutoFitPolicyOptions): GmMapAutoFitAction {
  if (options.mode !== "gm" || !options.hasScene || !options.sceneId) {
    return { kind: "none" };
  }

  const signature = `${options.sceneId}:${options.mapAssetId ?? "no-map"}`;
  if (options.fittedSignature === signature || !options.hasCanvas || options.viewportWidth <= 0 || options.viewportHeight <= 0) {
    return { kind: "none" };
  }

  if (!options.canShowMap || !options.hasMapAsset) {
    return { kind: "reset-empty-map", signature };
  }

  return {
    kind: "fit-ready-map",
    signature,
    viewportWidth: options.viewportWidth,
    viewportHeight: options.viewportHeight
  };
}

export interface VideoMapFitPolicyOptions {
  hasScene: boolean;
  isVideoMap: boolean;
  mapAssetId: string | null | undefined;
  mode: "gm" | "player";
  videoHeight: number;
  videoMapAssetId: string | undefined;
  videoWidth: number;
  viewportHeight: number;
  viewportWidth: number;
}

export function shouldFitGmCameraToVideoMap(options: VideoMapFitPolicyOptions): boolean {
  return Boolean(
    options.mode === "gm" &&
      options.hasScene &&
      options.mapAssetId &&
      options.isVideoMap &&
      options.videoMapAssetId === options.mapAssetId &&
      options.videoWidth > 0 &&
      options.videoHeight > 0 &&
      options.viewportWidth > 0 &&
      options.viewportHeight > 0
  );
}

export type VideoMapLoadStatusAction =
  | { kind: "set-status"; status: MapLoadStatus }
  | { kind: "defer-error" }
  | { kind: "none" };

export function getVideoMapImmediateErrorAction(readyState: number): VideoMapLoadStatusAction {
  return readyState >= VIDEO_MAP_CURRENT_DATA_READY_STATE ? { kind: "set-status", status: "ready" } : { kind: "defer-error" };
}

export interface VideoMapDeferredErrorActionOptions {
  activeVideoIndex: number;
  currentStatus: MapLoadStatus;
  index: number;
  readyState: number;
}

export function getVideoMapDeferredErrorAction(options: VideoMapDeferredErrorActionOptions): VideoMapLoadStatusAction {
  if (options.readyState >= VIDEO_MAP_CURRENT_DATA_READY_STATE) {
    return { kind: "set-status", status: "ready" };
  }
  if (options.index !== options.activeVideoIndex || options.currentStatus === "ready") {
    return { kind: "none" };
  }
  return { kind: "set-status", status: "error" };
}
