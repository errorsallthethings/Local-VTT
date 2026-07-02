import { useMemo } from "react";
import { Circle, Eye, EyeOff, Pentagon, Square, SquareDashed, Trash2 } from "lucide-react";
import type { Scene, WeatherSettings } from "../../../../shared/localvtt";
import { getSelectedItemIds } from "../../../lib/scene";
import { formatEnvironmentShapeLabel } from "./layerPanelFormat";
import { hasEnabledWeatherEffect } from "./layerPanelWeather";

const EMPTY_SELECTED_IDS: string[] = [];

export function WeatherMaskList({
  scene,
  selectedWeatherMaskId,
  selectedWeatherMaskIds = EMPTY_SELECTED_IDS,
  onSelectWeatherMask,
  onUpdateWeather
}: {
  scene: Scene;
  selectedWeatherMaskId: string | null;
  selectedWeatherMaskIds?: string[];
  onSelectWeatherMask: (maskId: string | null) => void;
  onUpdateWeather: (patch: Partial<WeatherSettings>) => void;
}) {
  const selectedIds = useMemo(() => getSelectedItemIds(selectedWeatherMaskId, selectedWeatherMaskIds), [selectedWeatherMaskId, selectedWeatherMaskIds]);
  return (
    <div className="layer-detail-controls weather-mask-list effects-layer-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Weather Masks</span>
        <small>{scene.weather.masks.length}</small>
      </div>
      {scene.weather.masks.length > 0 ? (
        scene.weather.masks.map((mask) => {
          const label = mask.name?.trim() || "Weather Mask";
          const shapeLabel = formatEnvironmentShapeLabel(mask.kind);
          const isVisible = mask.visible ?? true;
          const isSelected = selectedIds.has(mask.id);
          return (
            <div
              className={["fog-shape-row", "weather-mask-row", isVisible ? "" : "fog-shape-row-muted", isSelected ? "fog-shape-row-selected" : ""]
                .filter(Boolean)
                .join(" ")}
              key={mask.id}
            >
              <span className="fog-shape-kind-icon" title={`${mask.kind} mask`} aria-hidden="true">
                {mask.kind === "circle" ? <Circle size={13} /> : mask.kind === "polygon" ? <Pentagon size={13} /> : <Square size={13} />}
              </span>
              <span className="fog-shape-name effect-row-name" title={label}>
                <strong>{label}</strong>
                <small>Weather exclusion - {shapeLabel}</small>
              </span>
              <button
                className={isVisible ? "icon-button fog-shape-action-button fog-shape-action-active" : "icon-button fog-shape-action-button"}
                aria-label={isVisible ? `Disable ${label}` : `Enable ${label}`}
                title={isVisible ? "Disable mask" : "Enable mask"}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectWeatherMask(mask.id);
                  onUpdateWeather({
                    masks: scene.weather.masks.map((candidate) => (candidate.id === mask.id ? { ...candidate, visible: !isVisible } : candidate))
                  });
                }}
              >
                {isVisible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
              </button>
              <button
                className={isSelected ? "icon-button fog-shape-action-button fog-shape-action-active" : "icon-button fog-shape-action-button"}
                aria-label={isSelected ? `Hide ${label} highlight` : `Highlight ${label}`}
                title={isSelected ? "Hide mask highlight" : "Highlight mask"}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectWeatherMask(isSelected ? null : mask.id);
                }}
              >
                <SquareDashed size={14} aria-hidden="true" />
              </button>
              <button
                className="icon-button fog-shape-action-button danger"
                aria-label={`Delete ${label}`}
                title="Delete weather mask"
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateWeather({ masks: scene.weather.masks.filter((candidate) => candidate.id !== mask.id) });
                  if (selectedWeatherMaskId === mask.id) {
                    onSelectWeatherMask(null);
                  }
                }}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })
      ) : (
        <div className="layer-empty-state">
          <strong>No Weather Masks</strong>
          <span>
            {scene.weather.enabled && hasEnabledWeatherEffect(scene.weather.effects)
              ? "Draw masks from Effects Tools to keep this scene's weather out of interiors."
              : "Choose a scene weather pattern in settings, then draw masks to exclude weather from covered areas."}
          </span>
        </div>
      )}
    </div>
  );
}
