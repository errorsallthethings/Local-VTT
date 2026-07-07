import { getMapOverlayMessage, isMapOverlayActive, isMapReady, type MapLoadStatus } from "../map";
import { areTokenImagesReady } from "../tokens";

export interface SceneCanvasReadinessOptions {
  canShowMap: boolean | undefined;
  canShowTokens: boolean | undefined;
  failedTokenImageIds: ReadonlySet<string>;
  hasMapAsset: boolean;
  loadedTokenImages: ReadonlyMap<string, unknown>;
  mapLoadStatus: MapLoadStatus;
  mapMediaType: "image" | "video" | undefined;
  tokenImageSourceKey: string;
}

export interface SceneCanvasReadiness {
  mapOverlayActive: boolean;
  mapOverlayMessage: string;
  mapReady: boolean;
  ready: boolean;
  tokensReady: boolean;
}

export function getSceneCanvasReadiness({
  canShowMap,
  canShowTokens,
  failedTokenImageIds,
  hasMapAsset,
  loadedTokenImages,
  mapLoadStatus,
  mapMediaType,
  tokenImageSourceKey
}: SceneCanvasReadinessOptions): SceneCanvasReadiness {
  const mapReady = isMapReady(canShowMap, hasMapAsset, mapLoadStatus);
  const tokensReady = areTokenImagesReady(canShowTokens, tokenImageSourceKey, loadedTokenImages, failedTokenImageIds);

  return {
    mapOverlayActive: isMapOverlayActive(canShowMap, hasMapAsset, mapLoadStatus),
    mapOverlayMessage: getMapOverlayMessage(mapLoadStatus, mapMediaType),
    mapReady,
    ready: mapReady && tokensReady,
    tokensReady
  };
}
