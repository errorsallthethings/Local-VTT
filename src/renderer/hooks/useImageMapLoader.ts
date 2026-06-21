import { useEffect, useState } from "react";
import {
  closeCanvasImageSource,
  getInitialMapLoadStatus,
  prepareLoadedImageMap,
  type LoadedMap,
  type MapLoadStatus
} from "../canvas/map/mapSource";

interface UseImageMapLoaderOptions {
  assetId: string | undefined;
  assetRelativePath: string | undefined;
  assetUrl: string | null;
  mediaType: "image" | "video" | undefined;
}

export function useImageMapLoader({ assetId, assetRelativePath, assetUrl, mediaType }: UseImageMapLoaderOptions): {
  loadedMap: LoadedMap | null;
  mapLoadStatus: MapLoadStatus;
} {
  const [loadedMap, setLoadedMap] = useState<LoadedMap | null>(null);
  const [mapLoadStatus, setMapLoadStatus] = useState<MapLoadStatus>("idle");

  useEffect(() => {
    if (!assetUrl || !assetId || mediaType === "video") {
      setLoadedMap(null);
      setMapLoadStatus(getInitialMapLoadStatus(mediaType, assetUrl));
      return;
    }

    let cancelled = false;
    const imageAssetId = assetId;
    const imageAssetPath = assetRelativePath ?? "";
    const image = new Image();
    image.decoding = "async";
    setLoadedMap(null);
    setMapLoadStatus("loading");
    image.onload = () => {
      void prepareLoadedImageMap(image, imageAssetPath)
        .then((preparedMap) => {
          if (cancelled) {
            closeCanvasImageSource(preparedMap.optimizedSource);
            return;
          }
          setLoadedMap({
            assetId: imageAssetId,
            originalSource: image,
            optimizedSource: preparedMap.optimizedSource,
            sourceWidth: image.naturalWidth || image.width,
            sourceHeight: image.naturalHeight || image.height,
            optimizedScale: preparedMap.optimizedScale,
            animate: imageAssetPath.toLowerCase().endsWith(".gif"),
            mediaType: "image",
            ready: true
          });
          setMapLoadStatus("ready");
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setLoadedMap(null);
          setMapLoadStatus("error");
        });
    };
    image.onerror = () => {
      if (cancelled) {
        return;
      }
      setLoadedMap(null);
      setMapLoadStatus("error");
    };
    image.src = assetUrl;
    return () => {
      cancelled = true;
    };
  }, [assetId, assetRelativePath, assetUrl, mediaType]);

  useEffect(() => {
    return () => {
      if (loadedMap) {
        closeCanvasImageSource(loadedMap.optimizedSource);
      }
    };
  }, [loadedMap]);

  return { loadedMap, mapLoadStatus };
}
