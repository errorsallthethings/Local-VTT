import { RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DisplayCalibration, Scene } from "../../../shared/localvtt";
import { CollapsibleSettingsSection, SettingsField, SettingsReadout } from "./SettingsSection";

export interface DisplayInfo {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  nativeResolution: { width: number; height: number };
  scaleFactor: number;
  rotation: number;
}

export function PlayerDisplayScalePanel({
  scene,
  calibration,
  displays,
  onApply,
  onRefreshDisplays,
  onFooterActionsChange
}: {
  scene: Scene;
  calibration: DisplayCalibration;
  displays: DisplayInfo[];
  onApply: (calibration: DisplayCalibration) => void;
  onRefreshDisplays: () => Promise<boolean | undefined>;
  onFooterActionsChange?: (actions: ReactNode | null) => void;
}) {
  const [draft, setDraft] = useState<DisplayCalibration>(calibration);
  const [windowOpen, setWindowOpen] = useState(false);
  const [tableScaleOpen, setTableScaleOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<string | null>(null);

  useEffect(() => {
    setDraft(calibration);
  }, [calibration]);

  const estimatedPpi = estimatePixelsPerInch(
    draft.screenResolutionWidth,
    draft.screenResolutionHeight,
    draft.screenDiagonalInches
  );
  const targetPlayerCellSize = Math.max(1, Math.round(draft.pixelsPerInch * draft.inchesPerGridCell));
  const effectiveTargetCellSize = draft.mode === "screen-size" ? Math.max(1, Math.round(estimatedPpi * draft.inchesPerGridCell)) : targetPlayerCellSize;
  const playerScale = scene.grid.sizePx > 0 ? effectiveTargetCellSize / scene.grid.sizePx : 1;
  const selectedDisplay = displays.find((display) => display.id === draft.selectedDisplayId) ?? null;
  const hasDraftChanges = JSON.stringify(draft) !== JSON.stringify(calibration);
  const applyDraft = useCallback(() => {
    onApply({
      ...(draft.mode === "screen-size" ? { ...draft, pixelsPerInch: Math.round(estimatedPpi) } : draft),
      physicalScaleEnabled: draft.physicalScaleEnabled
    });
  }, [draft, estimatedPpi, onApply]);

  const resetDraft = useCallback(() => setDraft(calibration), [calibration]);

  const footerActions = useMemo(
    () => (
      <>
        <button type="button" disabled={!hasDraftChanges} onClick={applyDraft}>
          Apply Setup
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
    <section className="panel">
      <h2>Player View Setup</h2>
      <div className="inline-help">
        Choose where Player View opens and how manual scene grids should scale on that display. Fit presets in Grid & Maps already calculate their Player View size and do not apply physical table scaling again.
      </div>
      <CollapsibleSettingsSection title="Player View Window" meta="Saved Per Campaign" open={windowOpen} onToggle={() => setWindowOpen((open) => !open)}>
        <SettingsReadout label="Display Status">
          <div className="calibration-readout">
            Saved Display: {calibration.selectedDisplayLabel ?? "None"}
            <br />
            Current Match: {selectedDisplay ? getDisplayDetails(selectedDisplay) : "Not connected or not selected"}
          </div>
        </SettingsReadout>
        <SettingsField
          label="Preferred Display"
          help="Choose the TV or monitor where Player View should open. Refresh if you plugged in or moved a display."
          helpId="preferred-display"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <div className="settings-control-cluster">
            <select
              value={draft.selectedDisplayId ?? ""}
              onChange={(event) => {
                const nextDisplay = displays.find((display) => display.id === Number(event.target.value));
                setDraft({
                  ...draft,
                  selectedDisplayId: nextDisplay?.id,
                  selectedDisplayLabel: nextDisplay ? getDisplayLabel(nextDisplay) : undefined
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
            <button
              className="icon-button settings-inline-icon-button"
              type="button"
              title="Clear Saved Display"
              aria-label="Clear Saved Display"
              disabled={!draft.selectedDisplayId && !draft.selectedDisplayLabel && !draft.openPlayerViewFullscreen}
              onClick={() =>
                setDraft({
                  ...draft,
                  selectedDisplayId: undefined,
                  selectedDisplayLabel: undefined,
                  openPlayerViewFullscreen: false
                })
              }
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </SettingsField>
        <SettingsField
          label="Fullscreen"
          help="Open Player View fullscreen on the selected display when the window is launched."
          helpId="fullscreen"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <label className="check settings-field-check">
            <input
              type="checkbox"
              checked={draft.openPlayerViewFullscreen}
              onChange={(event) => setDraft({ ...draft, openPlayerViewFullscreen: event.target.checked })}
            />
            Enabled
          </label>
        </SettingsField>
      </CollapsibleSettingsSection>
      <div className="control-divider" />
      <CollapsibleSettingsSection title="Table Scale" meta="Player View Only" open={tableScaleOpen} onToggle={() => setTableScaleOpen((open) => !open)}>
        <SettingsField
          label="Physical Scale"
          help="When enabled, Player View scales manual scene grids so a grid cell can represent a real tabletop size on the TV. Fit Whole Map, Stretch to Grid, and Image Size presets keep their own fitted Player View sizing."
          helpId="physical-scale"
          openHelpId={helpTopic}
          onToggleHelp={setHelpTopic}
        >
          <label className="check settings-field-check">
            <input
              type="checkbox"
              checked={draft.physicalScaleEnabled}
              onChange={(event) => setDraft({ ...draft, physicalScaleEnabled: event.target.checked })}
            />
            Enabled
          </label>
        </SettingsField>

        {draft.physicalScaleEnabled ? (
          <>
            <SettingsField
              label="Mode"
              help="Choose how Local VTT should calculate the Player View grid scale for the display."
              helpId="scale-mode"
              openHelpId={helpTopic}
              onToggleHelp={setHelpTopic}
            >
              <select value={draft.mode} onChange={(event) => setDraft({ ...draft, mode: event.target.value as DisplayCalibration["mode"] })}>
                <option value="screen-size">Screen Size Estimate</option>
                <option value="manual">Manual Pixels Per Inch</option>
                <option value="grid-cell">Grid Cell Size</option>
              </select>
            </SettingsField>

            {draft.mode === "manual" && (
              <SettingsField
                label="Pixels Per Inch"
                help="Enter the display's pixel density if you already know it. Higher values make each real inch use more screen pixels."
                helpId="manual-ppi"
                openHelpId={helpTopic}
                onToggleHelp={setHelpTopic}
              >
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={draft.pixelsPerInch}
                  onChange={(event) => setDraft({ ...draft, pixelsPerInch: Number(event.target.value) })}
                />
              </SettingsField>
            )}

            {draft.mode === "screen-size" && (
              <>
                <SettingsField
                  label="Detected Display"
                  help="Use a connected display to fill in its resolution automatically. You can still edit the resolution fields after selecting it."
                  helpId="detected-display"
                  openHelpId={helpTopic}
                  onToggleHelp={setHelpTopic}
                >
                  <div className="settings-control-cluster">
                    <select
                      value={draft.selectedDisplayId ?? ""}
                      onChange={(event) => {
                        const selectedDisplay = displays.find((display) => display.id === Number(event.target.value));
                        if (!selectedDisplay) {
                          setDraft({ ...draft, selectedDisplayId: undefined, selectedDisplayLabel: undefined });
                          return;
                        }
                        setDraft({
                          ...draft,
                          selectedDisplayId: selectedDisplay.id,
                          selectedDisplayLabel: getDisplayLabel(selectedDisplay),
                          screenResolutionWidth: selectedDisplay.nativeResolution.width,
                          screenResolutionHeight: selectedDisplay.nativeResolution.height
                        });
                      }}
                    >
                      <option value="">Manual Resolution</option>
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
                  label="TV Resolution"
                  help="The pixel width and height of the Player View display. This is used with diagonal size to estimate PPI."
                  helpId="tv-resolution"
                  openHelpId={helpTopic}
                  onToggleHelp={setHelpTopic}
                >
                  <div className="settings-paired-inputs">
                    <label>
                      <span>Width</span>
                      <input
                        type="number"
                        min={1}
                        value={draft.screenResolutionWidth}
                        onChange={(event) => setDraft({ ...draft, screenResolutionWidth: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      <span>Height</span>
                      <input
                        type="number"
                        min={1}
                        value={draft.screenResolutionHeight}
                        onChange={(event) => setDraft({ ...draft, screenResolutionHeight: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                </SettingsField>
                <SettingsField
                  label="TV Size"
                  help="The physical diagonal size and aspect ratio of the Player View display. Local VTT uses these to estimate pixel density."
                  helpId="tv-size"
                  openHelpId={helpTopic}
                  onToggleHelp={setHelpTopic}
                >
                  <div className="settings-paired-inputs">
                    <label>
                      <span>Diagonal</span>
                      <input
                        type="number"
                        min={1}
                        step={0.1}
                        value={draft.screenDiagonalInches}
                        onChange={(event) => setDraft({ ...draft, screenDiagonalInches: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      <span>Aspect</span>
                      <select
                        value={draft.screenAspectRatio}
                        onChange={(event) => setDraft({ ...draft, screenAspectRatio: event.target.value as DisplayCalibration["screenAspectRatio"] })}
                      >
                        <option value="16:9">16:9</option>
                        <option value="16:10">16:10</option>
                        <option value="4:3">4:3</option>
                        <option value="custom">Custom</option>
                      </select>
                    </label>
                  </div>
                </SettingsField>
                <SettingsReadout label="Estimated PPI">
                  <div className="calibration-readout">{estimatedPpi.toFixed(1)} pixels per inch</div>
                </SettingsReadout>
              </>
            )}

            {draft.mode === "grid-cell" && (
              <>
                <SettingsField
                  label="Pixels Per Inch"
                  help="The display pixel density to use for converting real inches into Player View pixels."
                  helpId="grid-cell-ppi"
                  openHelpId={helpTopic}
                  onToggleHelp={setHelpTopic}
                >
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={draft.pixelsPerInch}
                    onChange={(event) => setDraft({ ...draft, pixelsPerInch: Number(event.target.value) })}
                  />
                </SettingsField>
                <SettingsField
                  label="Cell Inches"
                  help="How large each grid cell should be on the physical table. For many tabletop maps, this is 1 inch."
                  helpId="cell-inches"
                  openHelpId={helpTopic}
                  onToggleHelp={setHelpTopic}
                >
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={draft.inchesPerGridCell}
                    onChange={(event) => setDraft({ ...draft, inchesPerGridCell: Number(event.target.value) })}
                  />
                </SettingsField>
              </>
            )}

            <SettingsReadout label="Result Preview">
              <div className="calibration-readout">
                Target player grid cell: {effectiveTargetCellSize} px for {draft.inchesPerGridCell} inch{draft.inchesPerGridCell === 1 ? "" : "es"}.
                <br />
                Current scene grid cell: {scene.grid.sizePx} px.
                <br />
                Manual Player View scale after Apply: {playerScale.toFixed(2)}x.
              </div>
            </SettingsReadout>
          </>
        ) : (
          <SettingsReadout label="Current Behavior">
            <div className="calibration-readout">Player View will use the scene grid size without trying to match real-world inches.</div>
          </SettingsReadout>
        )}
      </CollapsibleSettingsSection>
    </section>
  );
}

function estimatePixelsPerInch(width: number, height: number, diagonalInches: number): number {
  if (width <= 0 || height <= 0 || diagonalInches <= 0) {
    return 0;
  }
  return Math.sqrt(width ** 2 + height ** 2) / diagonalInches;
}

function getDisplayLabel(display: DisplayInfo): string {
  const name = display.label?.trim() ? display.label.trim() : `Display ${display.id}`;
  return `${name} - ${display.nativeResolution.width}x${display.nativeResolution.height}`;
}

function getDisplayDetails(display: DisplayInfo): string {
  return `${getDisplayLabel(display)}, bounds ${display.bounds.x},${display.bounds.y} ${display.bounds.width}x${display.bounds.height}, scale ${display.scaleFactor}`;
}
