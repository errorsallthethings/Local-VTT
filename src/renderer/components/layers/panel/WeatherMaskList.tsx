import { useMemo } from "react";
import { Circle, Eye, EyeOff, Pentagon, Square, SquareDashed, Trash2 } from "lucide-react";
import type { Scene, WeatherSettings } from "../../../../shared/localvtt";
import { getSelectedItemIds } from "../../../lib/scene";
import {
  getLayerItemActionButtonClassName,
  getLayerItemHighlightLabel,
  getLayerItemHighlightTitle,
  getLayerItemRowClassName,
  getLayerItemToggleLabel,
  getLayerItemToggleTitle,
  patchLayerItemById,
  removeLayerItemById
} from "./layerItemRows";
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
              className={getLayerItemRowClassName({ visible: isVisible, selected: isSelected, variant: "weather-mask" })}
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
                className={getLayerItemActionButtonClassName(isVisible)}
                aria-label={getLayerItemToggleLabel(label, isVisible)}
                title={getLayerItemToggleTitle("mask", isVisible)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectWeatherMask(mask.id);
                  onUpdateWeather({
                    masks: patchLayerItemById(scene.weather.masks, mask.id, { visible: !isVisible })
                  });
                }}
              >
                {isVisible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
              </button>
              <button
                className={getLayerItemActionButtonClassName(isSelected)}
                aria-label={getLayerItemHighlightLabel(label, isSelected)}
                title={getLayerItemHighlightTitle("mask", isSelected)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectWeatherMask(isSelected ? null : mask.id);
                }}
              >
                <SquareDashed size={14} aria-hidden="true" />
              </button>
              <button
                className={getLayerItemActionButtonClassName(false, true)}
                aria-label={`Delete ${label}`}
                title="Delete weather mask"
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateWeather({ masks: removeLayerItemById(scene.weather.masks, mask.id) });
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
