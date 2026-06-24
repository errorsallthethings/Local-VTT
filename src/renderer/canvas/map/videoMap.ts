import type { Scene } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";

export function getVideoTransform(camera: Camera, scene: Scene | null): string {
  if (!scene) {
    return `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
  }

  const transform = scene.mapTransform;
  return [
    `translate(${camera.x}px, ${camera.y}px)`,
    `scale(${camera.zoom})`,
    `translate(${transform.x}px, ${transform.y}px)`,
    `rotate(${transform.rotation}deg)`,
    `scale(${transform.scale})`
  ].join(" ");
}

export function shouldRestartVideo(video: HTMLVideoElement): boolean {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return false;
  }

  const restartAt = Math.max(video.duration * 0.8, video.duration - 0.2);
  return video.ended || (video.currentTime >= restartAt && video.currentTime > 1);
}

export function shouldPrepareVideoBuffer(video: HTMLVideoElement): boolean {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return false;
  }

  const prepareAt = Math.max(video.duration * 0.65, video.duration - 3);
  return video.currentTime >= prepareAt && video.currentTime < video.duration - 0.25;
}

export function formatVideoDebug(videos: Array<HTMLVideoElement | null>, activeIndex: number): string {
  const format = (label: string, video: HTMLVideoElement | null) => {
    if (!video) {
      return `${label}: missing`;
    }
    return `${label}: t=${video.currentTime.toFixed(2)} dur=${formatVideoDuration(video.duration)} paused=${String(video.paused)} ended=${String(video.ended)} ready=${video.readyState}`;
  };

  return [`Active=${activeIndex === 0 ? "Primary" : "Buffer"}`, format("Primary", videos[0] ?? null), format("Buffer", videos[1] ?? null)].join("\n");
}

function formatVideoDuration(duration: number): string {
  return Number.isFinite(duration) ? duration.toFixed(2) : "unknown";
}
