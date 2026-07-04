import type { MouseEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Box,
  CloudFog,
  Crown,
  Grid3X3,
  Image,
  Layers,
  Lightbulb,
  Paintbrush,
  Settings2,
  Shield,
  Sparkles,
  User,
  UsersRound
} from "lucide-react";
import type { Layer } from "../../../../shared/localvtt";
import {
  getLayerDisplayName,
  getLayerRowClassName,
  getLayerSettingsButtonClassName,
  getLayerSettingsLabel,
  getLayerSettingsTitle,
  getLayerVisibilityButtonClassName,
  getLayerVisibilityLabel,
  getLayerVisibilityTitle
} from "./layerPanelState";

interface LayerPanelRowProps {
  layer: Layer;
  index: number;
  layerCount: number | null;
  layerOrderLocked: boolean;
  totalLayers: number;
  hasContents: boolean;
  hasSettings: boolean;
  settingsExpanded: boolean;
  children: ReactNode;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
  onToggleExpanded: (layerId: string) => void;
  onToggleGmVisibility: (layerId: string, visible: boolean) => void;
  onTogglePlayerVisibility: (layerId: string, visible: boolean) => void;
  onToggleSettings: (layerId: string) => void;
}

export function LayerPanelRow({
  layer,
  index,
  layerCount,
  layerOrderLocked,
  totalLayers,
  hasContents,
  hasSettings,
  settingsExpanded,
  children,
  onMoveLayer,
  onToggleExpanded,
  onToggleGmVisibility,
  onTogglePlayerVisibility,
  onToggleSettings
}: LayerPanelRowProps) {
  const layerName = getLayerDisplayName(layer);
  const onLayerRowClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!hasContents || (event.target as HTMLElement).closest("button,input,select,label,a")) {
      return;
    }
    onToggleExpanded(layer.id);
  };

  return (
    <div className={getLayerRowClassName(hasContents)} onClick={onLayerRowClick}>
      <span className="layer-kind-icon" title={layerName} aria-hidden="true">
        {getLayerIcon(layer)}
      </span>
      <span className="layer-name" title={layerName}>
        {layerName}
        {layerCount !== null && <span className="layer-count-badge" aria-label={`${layerCount} ${layerCount === 1 ? "item" : "items"}`}>{layerCount}</span>}
      </span>
      <button
        className={getLayerVisibilityButtonClassName(layer.visibleInGm)}
        aria-label={getLayerVisibilityLabel(layerName, "GM", layer.visibleInGm)}
        aria-pressed={layer.visibleInGm}
        title={getLayerVisibilityTitle(layer.visibleInGm, "GM")}
        onClick={() => onToggleGmVisibility(layer.id, !layer.visibleInGm)}
      >
        <Crown size={14} aria-hidden="true" />
      </button>
      <button
        className={getLayerVisibilityButtonClassName(layer.visibleInPlayer)}
        aria-label={getLayerVisibilityLabel(layerName, "Player", layer.visibleInPlayer)}
        aria-pressed={layer.visibleInPlayer}
        title={getLayerVisibilityTitle(layer.visibleInPlayer, "Player")}
        onClick={() => onTogglePlayerVisibility(layer.id, !layer.visibleInPlayer)}
      >
        <User size={14} aria-hidden="true" />
      </button>
      <button
        className={getLayerSettingsButtonClassName(settingsExpanded)}
        aria-label={getLayerSettingsLabel(layerName, hasSettings, settingsExpanded)}
        title={getLayerSettingsTitle(hasSettings, settingsExpanded)}
        disabled={!hasSettings}
        onClick={() => onToggleSettings(layer.id)}
      >
        <Settings2 size={15} aria-hidden="true" />
      </button>
      {!layerOrderLocked && (
        <div className="layer-order-controls">
          <button
            className="icon-button"
            aria-label={`Move ${layerName} up`}
            title="Move up"
            disabled={index === 0}
            onClick={() => onMoveLayer(layer.id, "up")}
          >
            <ArrowUp size={14} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            aria-label={`Move ${layerName} down`}
            title="Move down"
            disabled={index === totalLayers - 1}
            onClick={() => onMoveLayer(layer.id, "down")}
          >
            <ArrowDown size={14} aria-hidden="true" />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

function getLayerIcon(layer: Layer) {
  if ((layer.kind as string) === "weather") {
    return <Sparkles size={16} aria-hidden="true" />;
  }

  switch (layer.kind) {
    case "map":
      return <Image size={16} />;
    case "grid":
      return <Grid3X3 size={16} />;
    case "fog":
      return <CloudFog size={16} />;
    case "effects":
      return <Sparkles size={16} />;
    case "drawing":
      return <Paintbrush size={16} />;
    case "token":
      return <UsersRound size={16} />;
    case "foreground":
      return <Layers size={16} />;
    case "object":
      return <Box size={16} />;
    case "lighting":
      return <Lightbulb size={16} />;
    case "gm":
      return <Shield size={16} />;
    default:
      return <Sparkles size={16} />;
  }
}
