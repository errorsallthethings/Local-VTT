import { FolderOpen, Grid2X2, MonitorUp, RefreshCw, SlidersHorizontal, TestTubeDiagonal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Asset, DisplayCalibration, GridType, PlayerViewTestPattern, Scene } from "../../../shared/localvtt";
import { loadImageDimensions } from "../../lib/assets";
import { getMapGridDimensionHint, getMapGridFitPreview, type MapGridFitPreview, type MapImageDimensions } from "../../lib/map";
import type { DisplayInfo } from "./PlayerDisplayScalePanel";
import { SettingsField, SettingsReadout } from "./SettingsSection";

type TestPatternGridMode = PlayerViewTestPattern["gridMode"];
export type WizardMapFitMode = "whole-map" | "fill-grid";

export function TableDisplaySetupWizard({
  scene,
  mapAsset,
  calibration,
  displays,
  onApplyDisplay,
  onFitMapToGrid,
  onUpdateSceneGrid,
  onRefreshDisplays,
  onShowTestPattern,
  onSendToPlayer,
  onImportMap,
  onOpenPlayerViewSetup,
  onOpenMapCalibrationAssistant
}: {
  scene: Scene;
  mapAsset: Asset | null;
  calibration: DisplayCalibration;
  displays: DisplayInfo[];
  onApplyDisplay: (nextDisplay: DisplayCalibration) => void;
  onRefreshDisplays: () => Promise<boolean | undefined>;
  onFitMapToGrid: (columns: number, rows: number, fitMode: WizardMapFitMode) => Promise<unknown>;
  onUpdateSceneGrid: (gridType: GridType, sizePx: number, display: DisplayCalibration) => void;
  onShowTestPattern: (gridMode: TestPatternGridMode, display: DisplayCalibration, cellSizePx: number) => Promise<unknown>;
  onSendToPlayer: () => void;
  onImportMap: () => void;
  onOpenPlayerViewSetup: () => void;
  onOpenMapCalibrationAssistant: () => void;
}) {
  const [displayDraft, setDisplayDraft] = useState<DisplayCalibration>(calibration);
  const [testGridMode, setTestGridMode] = useState<TestPatternGridMode>(getInitialTestGridMode(scene.grid.type, calibration));
  const [patternCellSize, setPatternCellSize] = useState(Math.max(24, Math.round(scene.grid.sizePx)));
  const [helpTopic, setHelpTopic] = useState<string | null>(null);
  const selectedDisplay = displays.find((display) => display.id === displayDraft.selectedDisplayId) ?? null;
  const gridHint = useMemo(() => getMapGridDimensionHint(mapAsset?.originalFileName ?? mapAsset?.name), [mapAsset]);
  const [mapGridColumns, setMapGridColumns] = useState(gridHint?.columns ?? scene.grid.mapGridColumns);
  const [mapGridRows, setMapGridRows] = useState(gridHint?.rows ?? scene.grid.mapGridRows);
  const [mapFitMode, setMapFitMode] = useState<WizardMapFitMode>("whole-map");
  const [mapImageDimensions, setMapImageDimensions] = useState<MapImageDimensions | null>(null);
  const [mapImageDimensionsError, setMapImageDimensionsError] = useState<string | null>(null);
  const hasDisplayChanges = JSON.stringify(displayDraft) !== JSON.stringify(calibration);
  const displayAspect = getDisplayAspect(selectedDisplay, displayDraft);
  const mapAspect = mapGridColumns / mapGridRows;
  const aspectDelta = Math.abs(mapAspect - displayAspect);
  const mapFitPreview = mapImageDimensions
    ? getMapGridFitPreview(scene, { mapGridColumns, mapGridRows, fitMode: "cover" }, mapImageDimensions)
    : null;

  useEffect(() => {
    setMapGridColumns(gridHint?.columns ?? scene.grid.mapGridColumns);
    setMapGridRows(gridHint?.rows ?? scene.grid.mapGridRows);
  }, [gridHint?.columns, gridHint?.rows, mapAsset?.id, scene.grid.mapGridColumns, scene.grid.mapGridRows]);

  useEffect(() => {
    let cancelled = false;
    setMapImageDimensions(null);
    setMapImageDimensionsError(null);
    if (!mapAsset?.absolutePath || mapAsset.mediaType !== "image") {
      return;
    }
    void loadImageDimensions(window.localVtt.toAssetUrl(mapAsset.absolutePath))
      .then((dimensions) => {
        if (!cancelled) {
          setMapImageDimensions(dimensions);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setMapImageDimensionsError(caught instanceof Error ? caught.message : "Unable to read the selected map image dimensions.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mapAsset?.absolutePath, mapAsset?.id, mapAsset?.mediaType]);

  const applyDisplayDraft = () => {
    onApplyDisplay(normalizeDisplayDraft(displayDraft));
  };

  const showTestPattern = async () => {
    const nextDisplay = normalizeDisplayDraft(displayDraft);
    if (hasDisplayChanges) {
      onApplyDisplay(nextDisplay);
    }
    await onShowTestPattern(testGridMode, nextDisplay, getPatternCellSize(testGridMode, patternCellSize, nextDisplay));
  };

  const applyGridToScene = () => {
    const nextDisplay = getDisplayForGridMode(testGridMode, normalizeDisplayDraft(displayDraft), patternCellSize);
    setDisplayDraft(nextDisplay);
    if (testGridMode === "none") {
      onUpdateSceneGrid("gridless", patternCellSize, nextDisplay);
      return;
    }
    onUpdateSceneGrid(testGridMode === "hex" ? "hex" : "square", getPatternCellSize(testGridMode, patternCellSize, nextDisplay), nextDisplay);
  };

  return (
    <section className="panel table-display-wizard">
      <h2>Table Display Setup</h2>
      <div className="inline-help">
        Walk through the common setup path for choosing the table display, checking the Player View output, and aligning the map grid.
      </div>

      <div className="wizard-step">
        <div className="wizard-step-heading">
          <span>1</span>
          <div>
            <strong>Choose Player View Display</strong>
            <small>Saved per campaign and used when Player View opens.</small>
          </div>
        </div>
        <SettingsField
          label="Display"
          help="Choose the TV or monitor where Player View should open. Refresh if a display was just connected or moved."
          helpId="wizard-display"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <div className="settings-control-cluster">
            <select
              value={displayDraft.selectedDisplayId ?? ""}
              onChange={(event) => {
                const nextDisplay = displays.find((display) => display.id === Number(event.target.value));
                setDisplayDraft({
                  ...displayDraft,
                  selectedDisplayId: nextDisplay?.id,
                  selectedDisplayLabel: nextDisplay ? getDisplayLabel(nextDisplay) : undefined,
                  screenResolutionWidth: nextDisplay?.nativeResolution.width ?? displayDraft.screenResolutionWidth,
                  screenResolutionHeight: nextDisplay?.nativeResolution.height ?? displayDraft.screenResolutionHeight
                });
              }}
            >
              <option value="">No Saved Display</option>
              {displays.map((display) => (
                <option value={display.id} key={display.id}>
                  {getDisplayLabel(display)}
                </option>
              ))}
            </select>
            <button className="icon-button settings-inline-icon-button" type="button" title="Refresh displays" aria-label="Refresh displays" onClick={() => void onRefreshDisplays()}>
              <RefreshCw size={14} aria-hidden="true" />
            </button>
          </div>
        </SettingsField>
        <SettingsField
          label="Fullscreen"
          help="Open Player View fullscreen on the selected display when the window is launched."
          helpId="wizard-fullscreen"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <label className="check settings-field-check">
            <input
              type="checkbox"
              checked={displayDraft.openPlayerViewFullscreen}
              onChange={(event) => setDisplayDraft({ ...displayDraft, openPlayerViewFullscreen: event.target.checked })}
            />
            Enabled
          </label>
        </SettingsField>
        <div className="wizard-action-row">
          <button type="button" disabled={!hasDisplayChanges} onClick={applyDisplayDraft}>
            <MonitorUp size={14} aria-hidden="true" />
            Set Display
          </button>
        </div>
      </div>

      <div className="control-divider" />

      <div className="wizard-step">
        <div className="wizard-step-heading">
          <span>2</span>
          <div>
            <strong>Set Table Grid</strong>
            <small>Choose the active scene grid and preview how it reads on the table display.</small>
          </div>
        </div>
        <SettingsReadout label="Current Target">
          <div className="calibration-readout">
            Display: {selectedDisplay ? getDisplayLabel(selectedDisplay) : displayDraft.selectedDisplayLabel ?? "No saved display"}
            <br />
            Test Cell: {getPatternCellSize(testGridMode, patternCellSize, displayDraft)}px. Scene grid: {formatGridType(scene.grid.type)}, {scene.grid.sizePx}px.
            {displayDraft.physicalScaleEnabled && (
              <>
                <br />
                Physical Scale: Player View keeps manual scene grid cells at {getTestPatternCellSize(displayDraft)}px. Fit presets keep their own fitted Player View sizing.
              </>
            )}
          </div>
        </SettingsReadout>
        <SettingsField
          label="Grid"
          help="Choose the kind of grid to preview and apply to the scene. The edge frame should touch every screen edge; if it does not, check the selected display or fullscreen setting."
          helpId="wizard-test-pattern"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <div className="wizard-segmented-control" role="group" aria-label="Test pattern grid mode">
            <button type="button" className={testGridMode === "none" ? "active" : ""} onClick={() => setTestGridMode("none")}>
              No Grid
            </button>
            <button type="button" className={testGridMode === "square" ? "active" : ""} onClick={() => setTestGridMode("square")}>
              Square
            </button>
            <button type="button" className={testGridMode === "hex" ? "active" : ""} onClick={() => setTestGridMode("hex")}>
              Hex
            </button>
            <button type="button" className={testGridMode === "physical-square" ? "active" : ""} onClick={() => setTestGridMode("physical-square")}>
              Physical
            </button>
          </div>
        </SettingsField>
        {testGridMode === "square" || testGridMode === "hex" ? (
          <SettingsField
            label="Cell Size"
            help="Set the grid cell size used by the test pattern and scene grid. Use Advanced Map Calibration later only when a map has a printed grid, border, or needs drawn-area alignment."
            helpId="wizard-cell-size"
            openHelpId={helpTopic}
            onToggleHelp={setHelpTopic}
          >
            <input
              type="number"
              min={24}
              max={400}
              step={1}
              value={patternCellSize}
              onChange={(event) => setPatternCellSize(Math.max(24, Number(event.target.value)))}
            />
          </SettingsField>
        ) : null}
        <div className="wizard-guidance-note">
          <strong>What to check:</strong> the edge frame should touch every display edge, the grid should match the game style, and the cell size should feel readable at the table.
        </div>
        <div className="wizard-action-row">
          <button type="button" onClick={applyGridToScene}>
            <Grid2X2 size={14} aria-hidden="true" />
            Set Grid
          </button>
          <button type="button" onClick={() => void showTestPattern()}>
            <TestTubeDiagonal size={14} aria-hidden="true" />
            Preview Pattern
          </button>
        </div>
      </div>

      <div className="control-divider" />

      <div className="wizard-step">
        <div className="wizard-step-heading">
          <span>3</span>
          <div>
            <strong>Fit Map</strong>
            <small>Show the whole image on Player View, or stretch the map to the active scene grid when dimensions are known.</small>
          </div>
        </div>
        {mapAsset ? (
          <>
            <SettingsReadout label="Map Asset">
              <div className="calibration-readout">
                {mapAsset.originalFileName || mapAsset.name}
                <br />
                Scene grid: {scene.grid.mapGridColumns} x {scene.grid.mapGridRows} cells.
              </div>
            </SettingsReadout>
            <SettingsReadout label="Map Grid">
              <div className="wizard-map-grid-box">
                <div className="settings-paired-inputs">
                  <label>
                    <span>Columns</span>
                    <input type="number" min={1} value={mapGridColumns} onChange={(event) => setMapGridColumns(Math.max(1, Number(event.target.value)))} />
                  </label>
                  <label>
                    <span>Rows</span>
                    <input type="number" min={1} value={mapGridRows} onChange={(event) => setMapGridRows(Math.max(1, Number(event.target.value)))} />
                  </label>
                </div>
                {gridHint ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMapGridColumns(gridHint.columns);
                      setMapGridRows(gridHint.rows);
                    }}
                  >
                    <Grid2X2 size={14} aria-hidden="true" />
                    Detect Size
                  </button>
                ) : (
                  <small>No size detected in the filename.</small>
                )}
              </div>
            </SettingsReadout>
            <SettingsField
              label="Fit Mode"
              help="Fit Whole Map shows the complete image on Player View by updating the shared scene grid and map transform. Stretch to Grid uses the map columns and rows to size the image to the scene grid, even if the image distorts."
              helpId="wizard-map-fit"
              openHelpId={helpTopic}
              onToggleHelp={setHelpTopic}
            >
              <div className="wizard-segmented-control wizard-segmented-control-two" role="group" aria-label="Map fit mode">
                <button type="button" className={mapFitMode === "whole-map" ? "active" : ""} onClick={() => setMapFitMode("whole-map")}>
                  Fit Whole Map
                </button>
                <button type="button" className={mapFitMode === "fill-grid" ? "active" : ""} onClick={() => setMapFitMode("fill-grid")}>
                  Stretch to Grid
                </button>
              </div>
            </SettingsField>
            <SettingsReadout label="Display Fit">
              <div className="calibration-readout">
                Map shape: {formatAspect(mapAspect)}. Display shape: {formatAspect(displayAspect)}.
                <br />
                {aspectDelta > 0.35 ? "This map and display are different shapes; showing the whole map will leave unused screen space, while filling the display will crop part of the map." : "This map and display are close enough that fitting should be straightforward."}
              </div>
            </SettingsReadout>
            <SettingsReadout label="Fit Result">
              <div className="calibration-readout">
                {mapFitPreview ? (
                  <>
                    Image: {formatPixels(mapFitPreview.sourceWidth)} x {formatPixels(mapFitPreview.sourceHeight)}px.
                    <br />
                    {mapFitMode === "fill-grid" && (
                      <>
                        Grid footprint: {mapFitPreview.columns} x {mapFitPreview.rows} cells = {formatPixels(mapFitPreview.targetWidth)} x {formatPixels(mapFitPreview.targetHeight)}px.
                        <br />
                      </>
                    )}
                    Map fit: {mapFitMode === "whole-map" ? "whole image will be shown on Player View using the shared scene grid, so tools and tokens follow the same cells." : getMapFitResultText(mapFitPreview)}
                    <br />
                  </>
                ) : mapImageDimensionsError ? (
                  mapImageDimensionsError
                ) : (
                  "Reading image dimensions..."
                )}
              </div>
            </SettingsReadout>
            <div className="wizard-action-row">
              <button type="button" onClick={() => void onFitMapToGrid(mapGridColumns, mapGridRows, mapFitMode)}>
                <Grid2X2 size={14} aria-hidden="true" />
                Apply Fit Mode
              </button>
            </div>
          </>
        ) : (
          <div className="wizard-hint-row">
            <div>
              <strong>No map asset</strong>
              <small>Import a map before calibrating the scene grid.</small>
            </div>
            <button type="button" onClick={onImportMap}>
              <FolderOpen size={14} aria-hidden="true" />
              Import Map
            </button>
          </div>
        )}
      </div>

      <div className="control-divider" />

      <div className="wizard-step">
        <div className="wizard-step-heading">
          <span>4</span>
          <div>
            <strong>Preview Player View</strong>
            <small>Show the active scene on the configured Player View for final confirmation.</small>
          </div>
        </div>
        <div className="wizard-action-row">
          <button type="button" onClick={onSendToPlayer}>
            <MonitorUp size={14} aria-hidden="true" />
            Preview Player View
          </button>
        </div>
        <div className="wizard-secondary-actions">
          <button type="button" onClick={onOpenPlayerViewSetup}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>
              <strong>Player View Setup</strong>
              <small>Change saved display, fullscreen, or physical table scale.</small>
            </span>
          </button>
          <button type="button" onClick={onOpenMapCalibrationAssistant}>
            <Grid2X2 size={14} aria-hidden="true" />
            <span>
              <strong>Advanced Map Calibration</strong>
              <small>Advanced alignment for printed grids, borders, or drawn calibration areas.</small>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

function normalizeDisplayDraft(display: DisplayCalibration): DisplayCalibration {
  if (display.mode !== "screen-size") {
    return display;
  }
  return {
    ...display,
    pixelsPerInch: Math.round(estimatePixelsPerInch(display.screenResolutionWidth, display.screenResolutionHeight, display.screenDiagonalInches))
  };
}

function getTestPatternCellSize(display: DisplayCalibration): number {
  return Math.max(24, Math.round(display.pixelsPerInch * display.inchesPerGridCell));
}

function getPatternCellSize(gridMode: TestPatternGridMode, patternCellSize: number, display: DisplayCalibration): number {
  return gridMode === "physical-square" ? getTestPatternCellSize(display) : Math.max(24, Math.round(patternCellSize));
}

function getDisplayForGridMode(gridMode: TestPatternGridMode, display: DisplayCalibration, patternCellSize: number): DisplayCalibration {
  if (gridMode === "physical-square") {
    return {
      ...display,
      physicalScaleEnabled: true,
      mode: "grid-cell",
      pixelsPerInch: getPatternCellSize(gridMode, patternCellSize, display),
      inchesPerGridCell: 1
    };
  }
  return { ...display, physicalScaleEnabled: false };
}

function getInitialTestGridMode(gridType: GridType, display: DisplayCalibration): TestPatternGridMode {
  if (gridType === "gridless") {
    return "none";
  }
  if (gridType === "hex") {
    return "hex";
  }
  return display.physicalScaleEnabled ? "physical-square" : "square";
}

function formatGridType(gridType: GridType): string {
  if (gridType === "gridless") {
    return "No grid";
  }
  return gridType === "hex" ? "Hex" : "Square";
}

function estimatePixelsPerInch(width: number, height: number, diagonal: number): number {
  if (diagonal <= 0) {
    return 96;
  }
  return Math.sqrt(width ** 2 + height ** 2) / diagonal;
}

function getDisplayLabel(display: DisplayInfo): string {
  return `${display.label} (${display.nativeResolution.width} x ${display.nativeResolution.height})`;
}

function getDisplayAspect(display: DisplayInfo | null, calibration: DisplayCalibration): number {
  const width = display?.nativeResolution.width ?? calibration.screenResolutionWidth;
  const height = display?.nativeResolution.height ?? calibration.screenResolutionHeight;
  return height > 0 ? width / height : 16 / 9;
}

function formatAspect(value: number): string {
  return `${value.toFixed(2)}:1`;
}

function formatPixels(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getMapFitResultText(preview: MapGridFitPreview): string {
  return `stretches to the grid footprint with ${preview.scaleX.toFixed(2)}x horizontal scale and ${preview.scaleY.toFixed(2)}x vertical scale.`;
}
