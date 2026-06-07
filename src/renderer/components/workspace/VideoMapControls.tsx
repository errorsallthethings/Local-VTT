import { Bug, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { VideoPlaybackSettings } from "../../../shared/localvtt";

interface VideoMapControlsProps {
  videoPlayback: VideoPlaybackSettings;
  onUpdateVideoPlayback: (patch: Partial<VideoPlaybackSettings>) => void;
}

export function VideoMapControls({ videoPlayback, onUpdateVideoPlayback }: VideoMapControlsProps) {
  return (
    <div className="video-map-controls" aria-label="Video map controls">
      <button
        className={videoPlayback.paused ? "icon-button video-map-control-active" : "icon-button"}
        aria-label={videoPlayback.paused ? "Play video map" : "Pause video map"}
        aria-pressed={videoPlayback.paused}
        title={videoPlayback.paused ? "Play video map" : "Pause video map"}
        onClick={() => onUpdateVideoPlayback({ paused: !videoPlayback.paused })}
      >
        {videoPlayback.paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
      </button>
      <button
        className={videoPlayback.muted ? "icon-button video-map-control-active" : "icon-button"}
        aria-label={videoPlayback.muted ? "Unmute video map" : "Mute video map"}
        aria-pressed={videoPlayback.muted}
        title={videoPlayback.muted ? "Unmute video map" : "Mute video map"}
        onClick={() => onUpdateVideoPlayback({ muted: !videoPlayback.muted })}
      >
        {videoPlayback.muted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
      </button>
      <button
        className={videoPlayback.diagnosticsVisible ? "icon-button video-map-control-active" : "icon-button"}
        aria-label={videoPlayback.diagnosticsVisible ? "Hide video diagnostics" : "Show video diagnostics"}
        aria-pressed={videoPlayback.diagnosticsVisible}
        title={videoPlayback.diagnosticsVisible ? "Hide video diagnostics" : "Show video diagnostics"}
        onClick={() => onUpdateVideoPlayback({ diagnosticsVisible: !videoPlayback.diagnosticsVisible })}
      >
        <Bug size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
