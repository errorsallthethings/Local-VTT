import type { Asset, GridSettings, GridType, Scene } from "../../../../shared/localvtt";
import { ColorInput } from "../../controls/ColorPickerField";
import { DebouncedNumberInput } from "../../controls/DebouncedNumberInput";
import { getGridFootprint } from "./layerPanelFormat";
import {
  applyMapFitAction,
  getMapCellSizeAction,
  getMapGridDimensionAction,
  type MapFitActionHandlers
} from "./layerPanelMap";

interface MapGridSettingsSectionProps extends MapFitActionHandlers {
  mapAsset: Asset | null;
  scene: Scene;
}

export function MapGridSettingsSection({
  mapAsset,
  onApplyMapFitPreset,
  onUpdateGrid,
  onUpdateMapTransform,
  scene
}: MapGridSettingsSectionProps) {
  const visualGridEnabled = scene.grid.type !== "gridless";
  const gridFootprint = getGridFootprint(scene.grid);
  const dispatchMapFitAction = (action: Parameters<typeof applyMapFitAction>[0]) => {
    applyMapFitAction(action, { onApplyMapFitPreset, onUpdateGrid, onUpdateMapTransform });
  };

  return (
    <>
      <div className="map-settings-section-heading">
        <strong>Grid</strong>
        <small>Controls the active scene grid used by maps, tokens, rulers, and templates.</small>
      </div>
      <label className="setting-row">
        <span>Mode</span>
        <select value={scene.grid.type} onChange={(event) => onUpdateGrid({ type: event.target.value as GridType })}>
          <option value="gridless">Gridless</option>
          <option value="square">Square</option>
          <option value="hex">Hex</option>
        </select>
      </label>
      {visualGridEnabled && (
        <div className="settings-grid map-settings-grid">
          <label className="setting-row">
            <span>Cell Size</span>
            <DebouncedNumberInput
              value={scene.grid.sizePx}
              min={8}
              max={1000}
              delayMs={450}
              onCommit={(value) => {
                dispatchMapFitAction(getMapCellSizeAction(value, scene.mapTransform.fitMode, mapAsset));
              }}
            />
          </label>
          <div className="map-grid-dimension-fields setting-row">
            <span>Map Grid</span>
            <div className="map-grid-dimension-inputs">
              <label>
                <span>Columns</span>
                <input
                  type="number"
                  min={1}
                  value={scene.grid.mapGridColumns}
                  onChange={(event) => {
                    dispatchMapFitAction(getMapGridDimensionAction("mapGridColumns", Number(event.target.value), scene.mapTransform.fitMode));
                  }}
                />
              </label>
              <label>
                <span>Rows</span>
                <input
                  type="number"
                  min={1}
                  value={scene.grid.mapGridRows}
                  onChange={(event) => {
                    dispatchMapFitAction(getMapGridDimensionAction("mapGridRows", Number(event.target.value), scene.mapTransform.fitMode));
                  }}
                />
              </label>
            </div>
          </div>
          <div className="map-grid-footprint">
            {gridFootprint.width}px x {gridFootprint.height}px from {scene.grid.mapGridColumns} x {scene.grid.mapGridRows} cells.
          </div>
          <div className="control-divider map-settings-inline-divider" />
          <div className="map-settings-subsection-heading">Grid Coordinates</div>
          <label className="setting-row">
            <span>Labels</span>
            <input type="checkbox" checked={scene.grid.showCoordinates} onChange={(event) => onUpdateGrid({ showCoordinates: event.target.checked })} />
          </label>
          {scene.grid.showCoordinates && (
            <>
              <label className="setting-row">
                <span>Placement</span>
                <select value={scene.grid.coordinatePlacement} onChange={(event) => onUpdateGrid({ coordinatePlacement: event.target.value as GridSettings["coordinatePlacement"] })}>
                  <option value="inline">Inside Cells</option>
                  <option value="edge">Grid Edges</option>
                </select>
              </label>
              {scene.grid.type === "square" && scene.grid.coordinatePlacement === "inline" && (
                <label className="setting-row">
                  <span>Cell Position</span>
                  <select value={scene.grid.coordinateCellPosition} onChange={(event) => onUpdateGrid({ coordinateCellPosition: event.target.value as GridSettings["coordinateCellPosition"] })}>
                    <option value="top-left">Top Left</option>
                    <option value="center">Center</option>
                  </select>
                </label>
              )}
              <label className="setting-row">
                <span>X Axis Labels</span>
                <select value={scene.grid.coordinateXFormat} onChange={(event) => onUpdateGrid({ coordinateXFormat: event.target.value as GridSettings["coordinateXFormat"] })}>
                  <option value="alpha">A, B, C</option>
                  <option value="numeric">1, 2, 3</option>
                </select>
              </label>
              <label className="setting-row">
                <span>Y Axis Labels</span>
                <select value={scene.grid.coordinateYFormat} onChange={(event) => onUpdateGrid({ coordinateYFormat: event.target.value as GridSettings["coordinateYFormat"] })}>
                  <option value="numeric">1, 2, 3</option>
                  <option value="alpha">A, B, C</option>
                </select>
              </label>
              <div className="setting-row">
                <span>Label Size</span>
                <div className="map-grid-dimension-inputs">
                  <label>
                    <span>GM</span>
                    <input
                      type="number"
                      min={8}
                      max={48}
                      value={scene.grid.coordinateGmFontSize}
                      onChange={(event) => onUpdateGrid({ coordinateGmFontSize: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>Player</span>
                    <input
                      type="number"
                      min={8}
                      max={72}
                      value={scene.grid.coordinatePlayerFontSize}
                      onChange={(event) => onUpdateGrid({ coordinatePlayerFontSize: Number(event.target.value) })}
                    />
                  </label>
                </div>
              </div>
              <label className="setting-row">
                <span>Label Color</span>
                <ColorInput value={scene.grid.coordinateColor} onChange={(coordinateColor) => onUpdateGrid({ coordinateColor })} />
              </label>
            </>
          )}
        </div>
      )}
    </>
  );
}
