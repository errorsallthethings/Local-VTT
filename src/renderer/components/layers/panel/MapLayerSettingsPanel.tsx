import { ChevronDown, ChevronRight, CircleHelp, Import, RotateCcw } from "lucide-react";
import type { Asset, GridSettings, GridType, MapTransform, Scene } from "../../../../shared/localvtt";
import { DEFAULT_GRID } from "../../../../shared/localvtt";
import { ColorInput, ColorSettingRow } from "../../controls/ColorPickerField";
import { DebouncedNumberInput } from "../../controls/DebouncedNumberInput";
import { MeasurementPanel } from "../../settings/MeasurementPanel";
import { getGridFootprint } from "./layerPanelFormat";
import {
  getManualMapRotationPatch,
  getManualMapScalePatch,
  getMapCellSizeAction,
  getMapFitHelpText,
  getMapFitModeAction,
  getMapGridDimensionAction,
  getResetMapTransformPatch,
  type MapFitAction
} from "./layerPanelMap";

export function MapLayerSettingsPanel({
  scene,
  mapAsset,
  mapFitHelpOpen,
  mapAdvancedOpen,
  onToggleMapFitHelp,
  onToggleMapAdvanced,
  onUpdateGrid,
  onUpdateMapTransform,
  onApplyMapFitPreset,
  onOpenGridColor,
  onImportMap
}: {
  scene: Scene;
  mapAsset: Asset | null;
  mapFitHelpOpen: boolean;
  mapAdvancedOpen: boolean;
  onToggleMapFitHelp: () => void;
  onToggleMapAdvanced: () => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onApplyMapFitPreset: (fitMode: Exclude<MapTransform["fitMode"], "manual">, gridPatch?: Partial<GridSettings>) => void;
  onOpenGridColor: () => void;
  onImportMap: () => void;
}) {
  const visualGridEnabled = scene.grid.type !== "gridless";
  const gridFootprint = getGridFootprint(scene.grid);
  const applyMapFitAction = (action: MapFitAction) => {
    if (action.type === "apply-fit-preset") {
      onApplyMapFitPreset(action.fitMode, action.gridPatch);
    } else if (action.type === "update-map-transform") {
      onUpdateMapTransform(action.mapTransformPatch);
    } else {
      onUpdateGrid(action.gridPatch);
    }
  };

  const renderGridSettings = () => (
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
        <>
          <div className="settings-grid map-settings-grid">
            <label className="setting-row">
              <span>Cell Size</span>
              <DebouncedNumberInput
                value={scene.grid.sizePx}
                min={8}
                max={1000}
                delayMs={450}
                onCommit={(value) => {
                  applyMapFitAction(getMapCellSizeAction(value, scene.mapTransform.fitMode, mapAsset));
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
                      applyMapFitAction(getMapGridDimensionAction("mapGridColumns", Number(event.target.value), scene.mapTransform.fitMode));
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
                      applyMapFitAction(getMapGridDimensionAction("mapGridRows", Number(event.target.value), scene.mapTransform.fitMode));
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
        </>
      )}
    </>
  );

  const renderGridAdvancedSettings = () => (
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

  const renderMapFitControl = () => (
    <div className="setting-row map-fit-mode-row">
      <span className="fog-default-label">
        Fit Preset
        <button
          type="button"
          className="icon-button measurement-help-button"
          aria-label="Map Fit Help"
          title="Map Fit Help"
          onClick={onToggleMapFitHelp}
        >
          <CircleHelp size={15} aria-hidden="true" />
        </button>
      </span>
      <select
        value={scene.mapTransform.fitMode}
        onChange={(event) => {
          applyMapFitAction(getMapFitModeAction(event.target.value as MapTransform["fitMode"]));
        }}
      >
        <option value="manual">Manual</option>
        <option value="contain">Fit Whole Map</option>
        <option value="cover">Stretch to Grid</option>
        <option value="actual-size">Image Size</option>
      </select>
    </div>
  );

  return (
    <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
      {renderGridSettings()}
      <div className="control-divider" />
      <div className="map-settings-section-heading">
        <strong>Map</strong>
        <small>{mapAsset ? "Controls the current map asset and fit preset." : "Import a map asset to enable map fitting and transforms."}</small>
      </div>
      {mapAsset ? (
        <>
          {renderMapFitControl()}
          {mapFitHelpOpen && (
            <div className="settings-help-panel layer-settings-help-panel" role="note">
              {getMapFitHelpText().map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          )}
        </>
      ) : (
        <button className="import-map-next-step" onClick={onImportMap}>
          <Import size={16} aria-hidden="true" />
          Import Map
        </button>
      )}
      <div className="map-advanced-panel">
        <button type="button" className="map-advanced-toggle" aria-expanded={mapAdvancedOpen} onClick={onToggleMapAdvanced}>
          {mapAdvancedOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
          <strong>Advanced Settings</strong>
        </button>
        {mapAdvancedOpen && <div className="map-advanced-body">{renderGridAdvancedSettings()}</div>}
      </div>
    </div>
  );
}
