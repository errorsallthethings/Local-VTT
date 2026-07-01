import { Map } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Asset, DisplayCalibration, GridSettings, Scene } from "../../../shared/localvtt";
import type { MapCalibrationBox } from "../../canvas/map";
import { getMapCalibrationDraftFromScene, type MapCalibrationDraft } from "../../lib/map";
import { CollapsibleSettingsSection, SettingsField, SettingsReadout } from "./SettingsSection";

export type { MapCalibrationBox } from "../../canvas/map";
export type { MapCalibrationDraft } from "../../lib/map";

interface MapCalibrationAssistantProps {
  scene: Scene;
  mapAsset: Asset | null;
  calibration: DisplayCalibration;
  calibrationBox: MapCalibrationBox | null;
  onApply: (draft: MapCalibrationDraft) => void;
  onStartBoxCapture: () => void;
  onOpenPlayerViewSetup: () => void;
  onFooterActionsChange?: (actions: ReactNode | null) => void;
}

export function MapCalibrationAssistant({ scene, mapAsset, calibration, calibrationBox, onApply, onStartBoxCapture, onOpenPlayerViewSetup, onFooterActionsChange }: MapCalibrationAssistantProps) {
  const canAlignGridToMap = mapAsset?.mediaType === "image" && scene.grid.type !== "gridless";
  const [draft, setDraft] = useState<MapCalibrationDraft>(() => getMapCalibrationDraftFromScene(scene, canAlignGridToMap));
  const [playerViewOpen, setPlayerViewOpen] = useState(false);
  const [mapGridOpen, setMapGridOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<string | null>(null);

  useEffect(() => {
    setDraft(getMapCalibrationDraftFromScene(scene, canAlignGridToMap));
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
  const applyDraft = useCallback(() => onApply(draft), [draft, onApply]);
  const resetDraft = useCallback(() => setDraft(getMapCalibrationDraftFromScene(scene, canAlignGridToMap)), [canAlignGridToMap, scene]);
  const footerActions = useMemo(
    () => (
      <>
        <button type="button" disabled={!hasDraftChanges} onClick={applyDraft}>
          Apply Calibration
        </button>
        <button type="button" disabled={!hasDraftChanges} onClick={resetDraft}>
          Reset
        </button>
      </>
    ),
    [applyDraft, hasDraftChanges, resetDraft]
  );

  useEffect(() => {
    if (!onFooterActionsChange) {
      return;
    }
    onFooterActionsChange(footerActions);
    return () => onFooterActionsChange(null);
  }, [footerActions, onFooterActionsChange]);

  return (
    <section className="panel calibration-assistant">
      <h2 className="settings-panel-title">
        <Map size={18} aria-hidden="true" />
        Advanced Map Calibration
      </h2>
      <div className="inline-help">
        Use this when a map has a printed grid, border, padding, or needs drawn-area alignment. Use Grid & Maps for normal map fitting.
      </div>

      <CollapsibleSettingsSection title="Player View" meta="Reference" open={playerViewOpen} onToggle={() => setPlayerViewOpen((open) => !open)}>
        <SettingsReadout label="Player View Status">
          <div className="calibration-readout">
            Display: {calibration.selectedDisplayLabel ?? "None"}{calibration.openPlayerViewFullscreen ? ", fullscreen" : ""}
            <br />
            Physical Scale: {calibration.physicalScaleEnabled ? `${calibration.pixelsPerInch} PPI, ${calibration.inchesPerGridCell} in/cell` : "Off"}
          </div>
        </SettingsReadout>
        <button type="button" onClick={onOpenPlayerViewSetup}>
          Open Player View Setup
        </button>
      </CollapsibleSettingsSection>

      <div className="control-divider" />

      <CollapsibleSettingsSection title="Map Grid Size" meta="Whole Map" open={mapGridOpen} onToggle={() => setMapGridOpen((open) => !open)}>
        <SettingsField
          label="Map Grid"
          help="Enter how many grid columns and rows the full map image represents. This does not change the imported image itself."
          helpId="map-grid"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <div className="settings-paired-inputs">
            <label>
              <span>Columns</span>
              <input
                type="number"
                min={1}
                value={draft.mapGridColumns}
                onChange={(event) => setDraft({ ...draft, mapGridColumns: Math.max(1, Number(event.target.value)) })}
              />
            </label>
            <label>
              <span>Rows</span>
              <input
                type="number"
                min={1}
                value={draft.mapGridRows}
                onChange={(event) => setDraft({ ...draft, mapGridRows: Math.max(1, Number(event.target.value)) })}
              />
            </label>
          </div>
        </SettingsField>
        <SettingsReadout label="Grid Preview">
          <div className="calibration-readout">
            Preview Footprint: {preview.width}px x {preview.height}px at {formatNumber(scene.grid.sizePx)}px per cell.
            <br />
            Player View Target Cell: {getPlayerTargetCell(calibration)}.
          </div>
        </SettingsReadout>
      </CollapsibleSettingsSection>

      <div className="control-divider" />

      <CollapsibleSettingsSection title="Calibration Method" meta={draft.alignGridToMap ? "Full Image" : "Drawn Area"} open={methodOpen} onToggle={() => setMethodOpen((open) => !open)}>
        <SettingsField
          label="Method"
          help="Use full image dimensions when the map is cropped exactly to its printed grid. Use a drawn area when the map has borders, labels, or needs fine alignment."
          helpId="calibration-method"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <div className="calibration-method-group">
            {canAlignGridToMap && (
              <label className="calibration-method-option">
                <input
                  type="radio"
                  checked={draft.alignGridToMap}
                  onChange={() => setDraft({ ...draft, alignGridToMap: true, fitMode: "manual" })}
                />
                <span>
                  <strong>Use Full Image Dimensions</strong>
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
                <strong>Match Drawn Grid Area</strong>
                <small>Best when the map already has a printed grid or needs fine alignment.</small>
              </span>
            </label>
          </div>
        </SettingsField>
        {!draft.alignGridToMap && (
          <button type="button" onClick={onStartBoxCapture}>
            Draw Area On Map
          </button>
        )}
        {calibrationBox ? (
          <>
            <SettingsField
              label="Drawn Area"
              help="Enter how many printed grid columns and rows are inside the drawn square on the map."
              helpId="drawn-area"
              openHelpId={helpTopic}
              onToggleHelp={setHelpTopic}
            >
              <div className="settings-paired-inputs">
                <label>
                  <span>Columns</span>
                  <input
                    type="number"
                    min={1}
                    value={draft.boxColumns}
                    onChange={(event) => setDraft({ ...draft, boxColumns: Math.max(1, Number(event.target.value)) })}
                  />
                </label>
                <label>
                  <span>Rows</span>
                  <input
                    type="number"
                    min={1}
                    value={draft.boxRows}
                    onChange={(event) => setDraft({ ...draft, boxRows: Math.max(1, Number(event.target.value)) })}
                  />
                </label>
              </div>
            </SettingsField>
            <SettingsReadout label="Drawn Area Preview">
              <div className="calibration-readout">
                Apply will calculate grid cell size from the drawn area and align grid offsets to its top-left corner.
              </div>
            </SettingsReadout>
          </>
        ) : !draft.alignGridToMap ? (
          <SettingsReadout label="Drawn Area">
            <div className="calibration-readout">Drag over one printed square, or over a larger block such as 5 x 5 squares for better accuracy.</div>
          </SettingsReadout>
        ) : null}
      </CollapsibleSettingsSection>
    </section>
  );
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
