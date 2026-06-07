import { MonitorUp, Pause, Play, Settings, Volume2, VolumeX } from "lucide-react";
import type { Campaign, Scene, VideoPlaybackSettings } from "../../../shared/localvtt";

interface GmSettingsMenuProps {
  open: boolean;
  campaign: Campaign | null;
  activeScene: Scene | null;
  activeMapIsVideo: boolean;
  videoPlayback: VideoPlaybackSettings;
  onToggleOpen: () => void;
  onOpenPlayerDisplayScale: () => void;
  onOpenPlayerViewDisplay: () => void;
  onUpdateVideoPlayback: (patch: Partial<VideoPlaybackSettings>) => void;
}

export function GmSettingsMenu({
  open,
  campaign,
  activeScene,
  activeMapIsVideo,
  videoPlayback,
  onToggleOpen,
  onOpenPlayerDisplayScale,
  onOpenPlayerViewDisplay,
  onUpdateVideoPlayback
}: GmSettingsMenuProps) {
  return (
    <div className="gm-view-settings">
      <button className={open ? "tool-circle-button tool-active gm-settings-trigger" : "tool-circle-button gm-settings-trigger"} aria-label="GM view settings" title="GM view settings" onClick={onToggleOpen}>
        <Settings size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="gm-settings-menu">
          <button disabled={!campaign || !activeScene} onClick={onOpenPlayerDisplayScale}>
            <MonitorUp size={14} aria-hidden="true" />
            Player Display Scale
          </button>
          <button disabled={!campaign} onClick={onOpenPlayerViewDisplay}>
            <MonitorUp size={14} aria-hidden="true" />
            Player View Display
          </button>
          <button disabled={!activeMapIsVideo} onClick={() => onUpdateVideoPlayback({ diagnosticsVisible: !videoPlayback.diagnosticsVisible })}>
            <Settings size={14} aria-hidden="true" />
            {videoPlayback.diagnosticsVisible ? "Hide video diagnostics" : "Show video diagnostics"}
          </button>
          <button disabled={!activeMapIsVideo} onClick={() => onUpdateVideoPlayback({ paused: !videoPlayback.paused })}>
            {videoPlayback.paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            {videoPlayback.paused ? "Play video" : "Pause video"}
          </button>
          <button disabled={!activeMapIsVideo} onClick={() => onUpdateVideoPlayback({ muted: !videoPlayback.muted })}>
            {videoPlayback.muted ? <Volume2 size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />}
            {videoPlayback.muted ? "Unmute video" : "Mute video"}
          </button>
        </div>
      )}
    </div>
  );
}
