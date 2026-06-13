import { useEffect, useMemo, useState } from "react";
import type { Asset, DisplayCalibration, GridSettings, MapTransform, Scene } from "../../../shared/localvtt";

export interface MapCalibrationDraft {
  fitMode: MapTransform["fitMode"];
  mapGridColumns: number;
  mapGridRows: number;
  alignGridToMap: boolean;
}

interface MapCalibrationAssistantProps {
  scene: Scene;
  mapAsset: Asset | null;
  calibration: DisplayCalibration;
  onApply: (draft: MapCalibrationDraft) => void;
  onOpenPlayerViewSetup: () => void;
}

export function MapCalibrationAssistant({ scene, mapAsset, calibration, onApply, onOpenPlayerViewSetup }: MapCalibrationAssistantProps) {
  const canAlignGridToMap = mapAsset?.mediaType === "image" && scene.grid.type !== "gridless";
  const [draft, setDraft] = useState<MapCalibrationDraft>(() => getDraftFromScene(scene, canAlignGridToMap));

  useEffect(() => {
    setDraft(getDraftFromScene(scene, canAlignGridToMap));
  }, [canAlignGridToMap, scene]);

  const preview = useMemo(() => getGridPreview(draft, scene.grid), [draft, scene.grid]);
  const effectiveFitMode = draft.alignGridToMap ? "manual" : draft.fitMode;
  const fitModeBreaksGridAlignment = scene.grid.type !== "gridless" && effectiveFitMode !== "manual";
  const hasDraftChanges =
    effectiveFitMode !== scene.mapTransform.fitMode ||
    draft.mapGridColumns !== scene.grid.mapGridColumns ||
    draft.mapGridRows !== scene.grid.mapGridRows ||
    draft.alignGridToMap;

  return (
    <section className="panel calibration-assistant">
      <h2>Map Calibration Assistant</h2>
      <div className="inline-help">
        Apply the core Player View map setup in one pass. Advanced position, offsets, and image-dimension fitting remain available in the Map and Grid layers.
      </div>

      <div className="settings-section">
        <div className="settings-section-heading">
          <strong>Display</strong>
          <span>Campaign setting</span>
        </div>
        <div className="calibration-readout">
          Saved display: {calibration.selectedDisplayLabel ?? "None"}
          <br />
          Fullscreen: {calibration.openPlayerViewFullscreen ? "On" : "Off"}
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
          <strong>Map Fit</strong>
          <span>{mapAsset ? mapAsset.mediaType : "No map"}</span>
        </div>
        <label>
          Fit mode
          <select
            value={effectiveFitMode}
            disabled={draft.alignGridToMap}
            onChange={(event) => setDraft({ ...draft, fitMode: event.target.value as MapTransform["fitMode"] })}
          >
            <option value="contain">Fit contain</option>
            <option value="cover">Fit cover</option>
            <option value="actual-size">Actual size</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <div className="calibration-readout">{getFitModeHelp(effectiveFitMode)}</div>
        {fitModeBreaksGridAlignment && (
          <div className="calibration-warning">
            Viewport fit modes resize the map independently from the scene grid. Use Manual for grid-aligned battle maps.
          </div>
        )}
      </div>

      <div className="control-divider" />

      <div className="settings-section">
        <div className="settings-section-heading">
          <strong>Grid</strong>
          <span>Scene setting</span>
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
        {canAlignGridToMap && (
          <label className="check">
            <input
              type="checkbox"
              checked={draft.alignGridToMap}
              onChange={(event) => setDraft({ ...draft, alignGridToMap: event.target.checked, fitMode: event.target.checked ? "manual" : draft.fitMode })}
            />
            Grid-align image map
          </label>
        )}
        {draft.alignGridToMap && (
          <div className="calibration-readout">
            Apply will use the image dimensions to calculate grid cell size, set map fit to Manual, reset map transform, and set grid offsets to 0.
          </div>
        )}
      </div>

      <div className="button-row">
        <button type="button" disabled={!hasDraftChanges || fitModeBreaksGridAlignment} onClick={() => onApply(draft)}>
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
    alignGridToMap
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

function getFitModeHelp(fitMode: MapTransform["fitMode"]): string {
  switch (fitMode) {
    case "contain":
      return "Shows the whole map in Player View without cropping.";
    case "cover":
      return "Fills Player View and may crop map edges.";
    case "actual-size":
      return "Draws the map at native pixel size and centers it.";
    case "manual":
      return "Uses the current manual map position, scale, and rotation from Map Settings.";
  }
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
