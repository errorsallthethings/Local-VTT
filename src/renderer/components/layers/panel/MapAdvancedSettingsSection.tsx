import { RotateCcw } from "lucide-react";
import type { Asset, GridSettings, MapTransform, Scene } from "../../../../shared/localvtt";
import { DEFAULT_GRID } from "../../../../shared/localvtt";
import { ColorSettingRow } from "../../controls/ColorPickerField";
import { MeasurementPanel } from "../../settings/MeasurementPanel";
import {
  getManualMapRotationPatch,
  getManualMapScalePatch,
  getResetMapTransformPatch
} from "./layerPanelMap";

export function MapAdvancedSettingsSection({
  mapAsset,
  onOpenGridColor,
  onUpdateGrid,
  onUpdateMapTransform,
  scene
}: {
  mapAsset: Asset | null;
  onOpenGridColor: () => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  scene: Scene;
}) {
  const visualGridEnabled = scene.grid.type !== "gridless";

  return (
    <>
      {visualGridEnabled && (
        <>
          <div className="map-settings-subsection-heading">Grid Appearance</div>
          <div className="settings-grid map-settings-grid">
            <label className="setting-row">
              <span>Opacity</span>
              <div className="grid-opacity-control">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={scene.grid.opacity}
                  onChange={(event) => onUpdateGrid({ opacity: Number(event.target.value) })}
                />
                <button
                  type="button"
                  className="icon-button grid-reset-button"
                  aria-label="Reset grid opacity"
                  title="Reset opacity"
                  disabled={scene.grid.opacity === DEFAULT_GRID.opacity}
                  onClick={() => onUpdateGrid({ opacity: DEFAULT_GRID.opacity })}
                >
                  <RotateCcw size={13} aria-hidden="true" />
                </button>
              </div>
            </label>
            <div className="setting-row">
              <span>Grid Offset</span>
              <div className="xy-inputs">
                <label>
                  X
                  <input type="number" value={scene.grid.offsetX} onChange={(event) => onUpdateGrid({ offsetX: Number(event.target.value) })} />
                </label>
                <label>
                  Y
                  <input type="number" value={scene.grid.offsetY} onChange={(event) => onUpdateGrid({ offsetY: Number(event.target.value) })} />
                </label>
              </div>
            </div>
            <label className="setting-row">
              <span>Thickness</span>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={scene.grid.lineThickness}
                onChange={(event) => onUpdateGrid({ lineThickness: Number(event.target.value) })}
              />
            </label>
            <ColorSettingRow label="Grid Color" value={scene.grid.color} onOpen={onOpenGridColor} />
          </div>
          <div className="control-divider" />
          <MeasurementPanel
            embedded
            measurement={scene.grid.measurement}
            onChange={(measurementPatch) => onUpdateGrid({ measurement: { ...scene.grid.measurement, ...measurementPatch } })}
          />
        </>
      )}
      {mapAsset && (
        <>
          <div className="control-divider" />
          <div className="map-settings-subsection-heading">Map Transform</div>
          <div className="settings-grid map-settings-grid">
            <div className="setting-row">
              <span>Map Position</span>
              <div className="xy-inputs">
                <label>
                  X
                  <input
                    type="number"
                    value={scene.mapTransform.x}
                    onChange={(event) => onUpdateMapTransform({ x: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Y
                  <input
                    type="number"
                    value={scene.mapTransform.y}
                    onChange={(event) => onUpdateMapTransform({ y: Number(event.target.value) })}
                  />
                </label>
              </div>
            </div>
            <label className="setting-row">
              <span>Scale</span>
              <input
                type="number"
                min={0.01}
                step={0.05}
                value={scene.mapTransform.scale}
                onChange={(event) => onUpdateMapTransform(getManualMapScalePatch(Number(event.target.value)))}
              />
            </label>
            <label className="setting-row">
              <span>Rotation</span>
              <input
                type="number"
                step={1}
                value={scene.mapTransform.rotation}
                onChange={(event) => onUpdateMapTransform(getManualMapRotationPatch(Number(event.target.value)))}
              />
            </label>
          </div>
          <div className="map-transform-note">Reset Transform restores the map to Manual, origin position, original scale, and no rotation.</div>
          <div className="map-advanced-actions">
            <button type="button" className="compact-button" onClick={() => onUpdateMapTransform(getResetMapTransformPatch())}>
              Reset Transform
            </button>
          </div>
        </>
      )}
    </>
  );
}
