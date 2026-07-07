import { describe, expect, it } from "vitest";
import {
  getGmMapAutoFitAction,
  getVideoMapDeferredErrorAction,
  getVideoMapImmediateErrorAction,
  shouldFitGmCameraToVideoMap
} from "../../../src/renderer/components/scene/map/sceneMapViewportPolicy";

describe("scene map viewport policy", () => {
  it("routes GM map auto-fit decisions", () => {
    expect(
      getGmMapAutoFitAction({
        canShowMap: true,
        fittedSignature: null,
        hasCanvas: true,
        hasMapAsset: true,
        hasScene: true,
        mapAssetId: "map-1",
        mode: "gm",
        sceneId: "scene-1",
        viewportHeight: 800,
        viewportWidth: 1200
      })
    ).toEqual({ kind: "fit-ready-map", signature: "scene-1:map-1", viewportWidth: 1200, viewportHeight: 800 });
    expect(
      getGmMapAutoFitAction({
        canShowMap: false,
        fittedSignature: null,
        hasCanvas: true,
        hasMapAsset: false,
        hasScene: true,
        mapAssetId: null,
        mode: "gm",
        sceneId: "scene-1",
        viewportHeight: 800,
        viewportWidth: 1200
      })
    ).toEqual({ kind: "reset-empty-map", signature: "scene-1:no-map" });
  });

  it("skips GM map auto-fit when the viewport or ownership is not ready", () => {
    const base = {
      canShowMap: true,
      fittedSignature: null,
      hasCanvas: true,
      hasMapAsset: true,
      hasScene: true,
      mapAssetId: "map-1",
      mode: "gm" as const,
      sceneId: "scene-1",
      viewportHeight: 800,
      viewportWidth: 1200
    };

    expect(getGmMapAutoFitAction({ ...base, mode: "player" })).toEqual({ kind: "none" });
    expect(getGmMapAutoFitAction({ ...base, fittedSignature: "scene-1:map-1" })).toEqual({ kind: "none" });
    expect(getGmMapAutoFitAction({ ...base, viewportWidth: 0 })).toEqual({ kind: "none" });
    expect(getGmMapAutoFitAction({ ...base, hasCanvas: false })).toEqual({ kind: "none" });
  });

  it("allows video map fitting only for a ready GM video with matching asset and viewport", () => {
    const base = {
      hasScene: true,
      isVideoMap: true,
      mapAssetId: "map-1",
      mode: "gm" as const,
      videoHeight: 1080,
      videoMapAssetId: "map-1",
      videoWidth: 1920,
      viewportHeight: 800,
      viewportWidth: 1200
    };

    expect(shouldFitGmCameraToVideoMap(base)).toBe(true);
    expect(shouldFitGmCameraToVideoMap({ ...base, mode: "player" })).toBe(false);
    expect(shouldFitGmCameraToVideoMap({ ...base, videoMapAssetId: "other-map" })).toBe(false);
    expect(shouldFitGmCameraToVideoMap({ ...base, videoWidth: 0 })).toBe(false);
    expect(shouldFitGmCameraToVideoMap({ ...base, viewportHeight: 0 })).toBe(false);
  });

  it("maps video error events to immediate or deferred load-status actions", () => {
    expect(getVideoMapImmediateErrorAction(2)).toEqual({ kind: "set-status", status: "ready" });
    expect(getVideoMapImmediateErrorAction(0)).toEqual({ kind: "defer-error" });
    expect(getVideoMapDeferredErrorAction({ activeVideoIndex: 0, currentStatus: "loading", index: 0, readyState: 2 })).toEqual({
      kind: "set-status",
      status: "ready"
    });
    expect(getVideoMapDeferredErrorAction({ activeVideoIndex: 0, currentStatus: "loading", index: 0, readyState: 0 })).toEqual({
      kind: "set-status",
      status: "error"
    });
    expect(getVideoMapDeferredErrorAction({ activeVideoIndex: 1, currentStatus: "loading", index: 0, readyState: 0 })).toEqual({ kind: "none" });
    expect(getVideoMapDeferredErrorAction({ activeVideoIndex: 0, currentStatus: "ready", index: 0, readyState: 0 })).toEqual({ kind: "none" });
  });
});
