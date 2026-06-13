import { useEffect, useMemo, useState } from "react";
import type { Asset, DisplayCalibration, GridSettings, MapTransform, Scene } from "../../../shared/localvtt";

export interface MapCalibrationBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapCalibrationDraft {
  fitMode: MapTransform["fitMode"];
  mapGridColumns: number;
  mapGridRows: number;
  alignGridToMap: boolean;
  boxColumns: number;
  boxRows: number;
}

interface MapCalibrationAssistantProps {
  scene: Scene;
  mapAsset: Asset | null;
  calibration: DisplayCalibration;
  calibrationBox: MapCalibrationBox | null;
  onApply: (draft: MapCalibrationDraft) => void;
  onStartBoxCapture: () => void;
  onOpenPlayerViewSetup: () => void;
}

export function MapCalibrationAssistant({ scene, mapAsset, calibration, calibrationBox, onApply, onStartBoxCapture, onOpenPlayerViewSetup }: MapCalibrationAssistantProps) {
  const canAlignGridToMap = mapAsset?.mediaType === "image" && scene.grid.type !== "gridless";
  const [draft, setDraft] = useState<MapCalibrationDraft>(() => getDraftFromScene(scene, canAlignGridToMap));

  useEffect(() => {
    setDraft(getDraftFromScene(scene, canAlignGridToMap));
  }, [canAlignGridToMap, scene]);

  useEffect(() => {
    if (calibrationBox) {
      setDraft((currentDraft) => ({ ...currentDraft, alignGridToMap: false }));
    }
  }, [calibrationBox]);

  const preview = useMemo(() => getGridPreview(draft, scene.grid), [draft, scene.grid]);
  const hasBoxCalibration = Boolean(calibrationBox) && draft.boxColumns > 0 && draft.boxRows > 0;
  const hasDraftChanges =
    scene.mapTransform.fitMode !== "manual" ||
    draft.mapGridColumns !== scene.grid.mapGridColumns ||
    draft.mapGridRows !== scene.grid.mapGridRows ||
    draft.alignGridToMap ||
    hasBoxCalibration;

  return (
    <section className="panel calibration-assistant">
      <h2>Map Calibration</h2>
      <div className="inline-help">
        Choose how Local VTT should line up the scene grid with the map image. Advanced map fit controls stay in the Map layer.
      </div>

      <div className="settings-section">
        <div className="settings-section-heading">
          <strong>Player View</strong>
          <span>Reference</span>
        </div>
        <div className="calibration-readout">
          Display: {calibration.selectedDisplayLabel ?? "None"}{calibration.openPlayerViewFullscreen ? ", fullscreen" : ""}
          <br />
          Physical scale: {calibration.physicalScaleEnabled ? `${calibration.pixelsPerInch} PPI, ${calibration.inchesPerGridCell} in/cell` : "Off"}
        </div>
        <button type="button" onClick={onOpenPlayerViewSetup}>
          Open Player View Setup
        </button>
      </div>

      <div className="control-divider" />

      <div className="settings-section">
        <div className="settings-section-heading">
          <strong>Map Grid Size</strong>
          <span>Whole map</span>
        </div>
        <div className="panel-subgrid">
          <label>
            Columns
            <input
              type="number"
              min={1}
              value={draft.mapGridColumns}
              onChange={(event) => setDraft({ ...draft, mapGridColumns: Math.max(1, Number(event.target.value)) })}
            />
          </label>
          <label>
            Rows
            <input
              type="number"
              min={1}
              value={draft.mapGridRows}
              onChange={(event) => setDraft({ ...draft, mapGridRows: Math.max(1, Number(event.target.value)) })}
            />
          </label>
        </div>
        <div className="calibration-readout">
          Preview footprint: {preview.width}px x {preview.height}px at {formatNumber(scene.grid.sizePx)}px per cell.
          <br />
          Player View target cell: {getPlayerTargetCell(calibration)}.
        </div>
      </div>

      <div className="control-divider" />

      <div className="settings-section">
        <div className="settings-section-heading">
          <strong>Calibration Method</strong>
          <span>{draft.alignGridToMap ? "Full image" : "Drawn area"}</span>
        </div>
        {canAlignGridToMap && (
          <label className="calibration-method-option">
            <input
              type="radio"
              checked={draft.alignGridToMap}
              onChange={() => setDraft({ ...draft, alignGridToMap: true, fitMode: "manual" })}
            />
            <span>
              <strong>Use full image dimensions</strong>
              <small>Best when the map image is exactly cropped to its grid.</small>
            </span>
          </label>
        )}
        <label className="calibration-method-option">
          <input
            type="radio"
            checked={!draft.alignGridToMap}
            onChange={() => setDraft({ ...draft, alignGridToMap: false, fitMode: "manual" })}
          />
          <span>
            <strong>Match a drawn grid area</strong>
            <small>Best when the map already has a printed grid or needs fine alignment.</small>
          </span>
        </label>
        {!draft.alignGridToMap && (
          <button type="button" onClick={onStartBoxCapture}>
            Draw area on map
          </button>
        )}
        {calibrationBox ? (
          <>
            <div className="panel-subgrid">
              <label>
                Columns in area
                <input
                  type="number"
                  min={1}
                  value={draft.boxColumns}
                  onChange={(event) => setDraft({ ...draft, boxColumns: Math.max(1, Number(event.target.value)) })}
                />
              </label>
              <label>
                Rows in area
                <input
                  type="number"
                  min={1}
                  value={draft.boxRows}
                  onChange={(event) => setDraft({ ...draft, boxRows: Math.max(1, Number(event.target.value)) })}
                />
              </label>
            </div>
            <div className="calibration-readout">
              Apply will calculate grid cell size from the drawn area and align grid offsets to its top-left corner.
            </div>
          </>
        ) : !draft.alignGridToMap ? (
          <div className="calibration-readout">Drag over one printed square, or over a larger block such as 5 x 5 squares for better accuracy.</div>
        ) : null}
      </div>

      <div className="button-row">
        <button type="button" disabled={!hasDraftChanges} onClick={() => onApply(draft)}>
          Apply calibration
        </button>
        <button type="button" disabled={!hasDraftChanges} onClick={() => setDraft(getDraftFromScene(scene, canAlignGridToMap))}>
          Reset
        </button>
      </div>
    </section>
  );
}

function getDraftFromScene(scene: Scene, alignGridToMap: boolean): MapCalibrationDraft {
  return {
    fitMode: scene.mapTransform.fitMode,
    mapGridColumns: scene.grid.mapGridColumns,
    mapGridRows: scene.grid.mapGridRows,
    alignGridToMap,
    boxColumns: 1,
    boxRows: 1
  };
}

function getGridPreview(draft: MapCalibrationDraft, grid: GridSettings): { width: number; height: number } {
  return {
    width: Math.round(Math.max(1, draft.mapGridColumns) * Math.max(1, grid.sizePx)),
    height: Math.round(Math.max(1, draft.mapGridRows) * Math.max(1, grid.sizePx))
  };
}

function getPlayerTargetCell(calibration: DisplayCalibration): string {
  if (!calibration.physicalScaleEnabled) {
    return "physical scale off";
  }
  return `${Math.max(1, Math.round(calibration.pixelsPerInch * calibration.inchesPerGridCell))}px`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
