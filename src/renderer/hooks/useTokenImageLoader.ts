import { useEffect, useRef, useState } from "react";
import { getReusableTokenImageState, parseTokenImageSourceKey } from "../canvas/tokens";

export function useTokenImageLoader(tokenImageSourceKey: string): {
  failedTokenImageIds: Set<string>;
  loadedTokenImages: Map<string, HTMLImageElement>;
} {
  const [loadedTokenImages, setLoadedTokenImages] = useState<Map<string, HTMLImageElement>>(() => new Map());
  const [failedTokenImageIds, setFailedTokenImageIds] = useState<Set<string>>(() => new Set());
  const loadedTokenImagesRef = useRef(loadedTokenImages);
  const loadedTokenImagePathsRef = useRef<Map<string, string>>(new Map());
  const failedTokenImageIdsRef = useRef(failedTokenImageIds);
  const failedTokenImagePathsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const tokenImageSources = parseTokenImageSourceKey(tokenImageSourceKey);
    if (tokenImageSources.length === 0) {
      const emptyImages = new Map<string, HTMLImageElement>();
      const emptyFailedIds = new Set<string>();
      loadedTokenImagesRef.current = emptyImages;
      loadedTokenImagePathsRef.current = new Map();
      failedTokenImageIdsRef.current = emptyFailedIds;
      failedTokenImagePathsRef.current = new Map();
      setLoadedTokenImages(emptyImages);
      setFailedTokenImageIds(emptyFailedIds);
      return;
    }

    let cancelled = false;
    const reusableState = getReusableTokenImageState(
      loadedTokenImagesRef.current,
      loadedTokenImagePathsRef.current,
      failedTokenImageIdsRef.current,
      failedTokenImagePathsRef.current,
      tokenImageSources
    );
    const nextImages = reusableState.loadedImages;
    const nextImagePaths = reusableState.loadedImagePaths;
    const nextFailedIds = reusableState.failedIds;
    const nextFailedPaths = reusableState.failedPaths;
    loadedTokenImagesRef.current = nextImages;
    loadedTokenImagePathsRef.current = nextImagePaths;
    failedTokenImageIdsRef.current = nextFailedIds;
    failedTokenImagePathsRef.current = nextFailedPaths;
    setLoadedTokenImages(new Map(nextImages));
    setFailedTokenImageIds(new Set(nextFailedIds));
    for (const source of reusableState.pendingSources) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) {
          return;
        }
        nextImages.set(source.id, image);
        nextImagePaths.set(source.id, source.path);
        nextFailedIds.delete(source.id);
        nextFailedPaths.delete(source.id);
        loadedTokenImagesRef.current = nextImages;
        loadedTokenImagePathsRef.current = nextImagePaths;
        failedTokenImageIdsRef.current = nextFailedIds;
        failedTokenImagePathsRef.current = nextFailedPaths;
        setLoadedTokenImages(new Map(nextImages));
        setFailedTokenImageIds(new Set(nextFailedIds));
      };
      image.onerror = () => {
        if (cancelled) {
          return;
        }
        nextImages.delete(source.id);
        nextImagePaths.delete(source.id);
        nextFailedIds.add(source.id);
        nextFailedPaths.set(source.id, source.path);
        loadedTokenImagesRef.current = nextImages;
        loadedTokenImagePathsRef.current = nextImagePaths;
        failedTokenImageIdsRef.current = nextFailedIds;
        failedTokenImagePathsRef.current = nextFailedPaths;
        setLoadedTokenImages(new Map(nextImages));
        setFailedTokenImageIds(new Set(nextFailedIds));
      };
      image.src = window.localVtt.toAssetUrl(source.path);
    }

    return () => {
      cancelled = true;
    };
  }, [tokenImageSourceKey]);

  return { failedTokenImageIds, loadedTokenImages };
}
