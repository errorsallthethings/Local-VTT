import { CloudFog, CloudRain, EllipsisVertical, Maximize2, Minimize2, MonitorUp, SlidersHorizontal, Snowflake, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Asset, Campaign, Scene } from "../../../shared/localvtt";

interface WorkspaceTopbarProps {
  campaign: Campaign | null;
  activeScene: Scene | null;
  mapAsset: Asset | null;
  playerMenuOpen: boolean;
  onSendToPlayer: () => void;
  onTogglePlayerMenu: () => void;
  onOpenPlayerDisplayScale: () => void;
  onOpenPlayerViewDisplay: () => void;
  onSetPlayerFullscreen: (fullscreen: boolean) => void;
  onClosePlayerView: () => void;
}

export function WorkspaceTopbar({
  campaign,
  activeScene,
  mapAsset,
  playerMenuOpen,
  onSendToPlayer,
  onTogglePlayerMenu,
  onOpenPlayerDisplayScale,
  onOpenPlayerViewDisplay,
  onSetPlayerFullscreen,
  onClosePlayerView
}: WorkspaceTopbarProps) {
  const title = activeScene?.name ?? (campaign ? "Select or Create a Scene" : "Create or Open a Campaign");
  const subtitle = activeScene
    ? mapAsset
      ? `${mapAsset.name} (${mapAsset.mediaType})`
      : "No map imported"
    : campaign
      ? "Choose a scene from the Scenes panel or add a new scene to start building."
      : "Create a campaign, add a scene, import a map, then send it to Player View.";

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title-row">
          <h2>{title}</h2>
          {activeScene && <ActiveWeatherIcons scene={activeScene} />}
        </div>
        <span>{subtitle}</span>
      </div>
      <div className="toolbar-groups">
        <div className="toolbar-block">
          <div className="toolbar-label">Player View</div>
          <div className="toolbar-group" aria-label="Player View actions">
            <button disabled={!activeScene} onClick={onSendToPlayer}>
              <MonitorUp size={16} aria-hidden="true" />
              Send
            </button>
            <div className="scene-menu-wrap player-view-menu-wrap">
              <button
                className="icon-button player-view-menu-button"
                disabled={!activeScene}
                aria-label="Player View actions"
                title={activeScene ? "Player View actions" : "Select a scene to use Player View actions"}
                onClick={onTogglePlayerMenu}
              >
                <EllipsisVertical size={16} aria-hidden="true" />
              </button>
              {playerMenuOpen && (
                <div className="scene-menu toolbar-menu">
                  <button onClick={() => onSetPlayerFullscreen(true)}>
                    <Maximize2 size={14} aria-hidden="true" />
                    Fullscreen
                  </button>
                  <button onClick={() => onSetPlayerFullscreen(false)}>
                    <Minimize2 size={14} aria-hidden="true" />
                    Exit fullscreen
                  </button>
                  <button onClick={onOpenPlayerViewDisplay}>
                    <MonitorUp size={14} aria-hidden="true" />
                    Player View Display
                  </button>
                  <button disabled={!activeScene} onClick={onOpenPlayerDisplayScale}>
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    Player Display Scale
                  </button>
                  <button className="danger-menu-item" onClick={onClosePlayerView}>
                    <X size={14} aria-hidden="true" />
                    Close window
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveWeatherIcons({ scene }: { scene: Scene }) {
  if (!scene.weather.enabled) {
    return null;
  }
  const activeEffects: Array<{ key: string; label: string; icon: ReactNode }> = [];
  if (scene.weather.effects.rain.enabled) {
    activeEffects.push({ key: "rain", label: getWeatherPatternLabel(scene.weather.effects.rain.pattern), icon: <CloudRain size={14} aria-hidden="true" /> });
  }
  if (scene.weather.effects.fog.enabled) {
    activeEffects.push({ key: "fog", label: getWeatherPatternLabel(scene.weather.effects.fog.pattern), icon: <CloudFog size={14} aria-hidden="true" /> });
  }
  if (scene.weather.effects.snow.enabled) {
    activeEffects.push({ key: "snow", label: getWeatherPatternLabel(scene.weather.effects.snow.pattern), icon: <Snowflake size={14} aria-hidden="true" /> });
  }

  if (activeEffects.length === 0) {
    return null;
  }

  return (
    <div className="active-weather-icons" aria-label="Active weather effects">
      {activeEffects.map((effect) => (
        <span key={effect.key} title={effect.label} aria-label={effect.label}>
          {effect.icon}
        </span>
      ))}
    </div>
  );
}

function getWeatherPatternLabel(pattern: string): string {
  switch (pattern) {
    case "light-rain":
      return "Light Rain";
    case "rain":
      return "Rain";
    case "heavy-rain":
      return "Heavy Rain";
    case "rain-storm":
      return "Rain Storm";
    case "light-fog":
      return "Light Fog";
    case "fog":
      return "Fog";
    case "heavy-fog":
      return "Heavy Fog";
    case "light-snow":
      return "Light Snow";
    case "snow":
      return "Snow";
    case "blizzard":
      return "Blizzard";
    default:
      return "Weather";
  }
}
