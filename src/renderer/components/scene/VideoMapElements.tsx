import type { MutableRefObject } from "react";
import type { Layer, Scene } from "../../../shared/localvtt";
import type { Camera } from "../../canvas/core";
import { getVideoTransform } from "../../canvas/map";

interface VideoMapElementsProps {
  activeVideoIndex: number;
  camera: Camera;
  mapAssetId: string;
  mapLayer: Layer | null;
  muted: boolean;
  paused: boolean;
  preparedVideoIndex: number | null;
  scene: Scene | null;
  urls: string[];
  videoRefs: MutableRefObject<Array<HTMLVideoElement | null>>;
  onCanPlay: (video: HTMLVideoElement, index: number) => void;
  onReady: (video: HTMLVideoElement, index: number) => void;
  onMetadataReady: (video: HTMLVideoElement, index: number) => void;
  onError: (video: HTMLVideoElement, index: number) => void;
  onPause: (index: number) => void;
}

export function VideoMapElements({
  activeVideoIndex,
  camera,
  mapAssetId,
  mapLayer,
  muted,
  paused,
  preparedVideoIndex,
  scene,
  urls,
  videoRefs,
  onCanPlay,
  onReady,
  onMetadataReady,
  onError,
  onPause
}: VideoMapElementsProps) {
  return (
    <>
      {getVideoMapElementPlans({
        activeVideoIndex,
        mapLayerOpacity: mapLayer?.opacity,
        paused,
        preparedVideoIndex,
        urls
      }).map((plan) => (
        <video
          key={plan.url}
          ref={(element) => {
            videoRefs.current[plan.index] = element;
          }}
          className="scene-video-map"
          src={plan.url}
          data-map-asset-id={mapAssetId}
          muted={muted}
          autoPlay={plan.autoPlay}
          playsInline
          preload="auto"
          style={{
            opacity: plan.opacity,
            transform: getVideoTransform(camera, scene)
          }}
          onCanPlay={(event) => onCanPlay(event.currentTarget, plan.index)}
          onLoadedMetadata={(event) => onMetadataReady(event.currentTarget, plan.index)}
          onLoadedData={(event) => onReady(event.currentTarget, plan.index)}
          onPlaying={(event) => onReady(event.currentTarget, plan.index)}
          onError={(event) => onError(event.currentTarget, plan.index)}
          onPause={() => onPause(plan.index)}
        />
      ))}
    </>
  );
}

export interface VideoMapElementPlan {
  autoPlay: boolean;
  index: number;
  opacity: number;
  url: string;
}

export function getVideoMapElementPlans({
  activeVideoIndex,
  mapLayerOpacity,
  paused,
  preparedVideoIndex,
  urls
}: {
  activeVideoIndex: number;
  mapLayerOpacity?: number;
  paused: boolean;
  preparedVideoIndex: number | null;
  urls: string[];
}): VideoMapElementPlan[] {
  return urls.flatMap((url, index) => {
    if (index !== activeVideoIndex && index !== preparedVideoIndex) {
      return [];
    }

    return [
      {
        autoPlay: index === activeVideoIndex && !paused,
        index,
        opacity: index === activeVideoIndex ? (mapLayerOpacity ?? 1) : 0,
        url
      }
    ];
  });
}
