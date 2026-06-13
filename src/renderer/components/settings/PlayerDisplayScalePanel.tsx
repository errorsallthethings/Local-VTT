import { useEffect, useState } from "react";
import type { DisplayCalibration, Scene } from "../../../shared/localvtt";

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
  onRefreshDisplays
}: {
  scene: Scene;
  calibration: DisplayCalibration;
  displays: DisplayInfo[];
  onApply: (calibration: DisplayCalibration) => void;
  onRefreshDisplays: () => Promise<boolean | undefined>;
}) {
  const [draft, setDraft] = useState<DisplayCalibration>(calibration);

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
  const applyDraft = () => {
    onApply({
      ...(draft.mode === "screen-size" ? { ...draft, pixelsPerInch: Math.round(estimatedPpi) } : draft),
      physicalScaleEnabled: draft.physicalScaleEnabled
    });
  };

  return (
    <section className="panel">
      <h2>Player View Setup</h2>
      <div className="inline-help">
        Choose where Player View opens and how the scene grid should scale on that display. These settings do not change the GM View grid.
      </div>
      <div className="settings-section">
        <div className="settings-section-heading">
          <strong>Window</strong>
          <span>Saved per campaign</span>
        </div>
        <label>
          Preferred display
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
            <option value="">No saved display</option>
            {displays.map((display) => (
              <option value={display.id} key={display.id}>
                {getDisplayLabel(display)}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.openPlayerViewFullscreen}
            onChange={(event) => setDraft({ ...draft, openPlayerViewFullscreen: event.target.checked })}
          />
          Open fullscreen on selected display
        </label>
        <div className="calibration-readout">
          Saved display: {calibration.selectedDisplayLabel ?? "None"}
          <br />
          Current match: {selectedDisplay ? getDisplayDetails(selectedDisplay) : "Not connected or not selected"}
        </div>
        <div className="button-row">
          <button onClick={() => void onRefreshDisplays()}>Refresh displays</button>
          <button
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
            Clear display
          </button>
        </div>
      </div>
      <div className="control-divider" />
      <div className="settings-section">
        <div className="settings-section-heading">
          <strong>Table Scale</strong>
          <span>Player View only</span>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.physicalScaleEnabled}
            onChange={(event) => setDraft({ ...draft, physicalScaleEnabled: event.target.checked })}
          />
          Use physical display scale
        </label>

        {draft.physicalScaleEnabled ? (
          <>
            <label>
              Calibration mode
              <select value={draft.mode} onChange={(event) => setDraft({ ...draft, mode: event.target.value as DisplayCalibration["mode"] })}>
                <option value="manual">Manual pixels per inch</option>
                <option value="screen-size">Screen size estimate</option>
                <option value="grid-cell">Grid cell size</option>
              </select>
            </label>

            {draft.mode === "manual" && (
              <label>
                Pixels per inch
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={draft.pixelsPerInch}
                  onChange={(event) => setDraft({ ...draft, pixelsPerInch: Number(event.target.value) })}
                />
              </label>
            )}

            {draft.mode === "screen-size" && (
              <>
                <label>
                  Detected display
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
                    <option value="">Manual resolution</option>
                    {displays.map((display) => (
                      <option value={display.id} key={display.id}>
                        {getDisplayLabel(display)}
                      </option>
                    ))}
                  </select>
                </label>
                <button onClick={() => void onRefreshDisplays()}>Refresh displays</button>
                <div className="panel-subgrid">
                  <label>
                    Resolution width
                    <input
                      type="number"
                      min={1}
                      value={draft.screenResolutionWidth}
                      onChange={(event) => setDraft({ ...draft, screenResolutionWidth: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    Resolution height
                    <input
                      type="number"
                      min={1}
                      value={draft.screenResolutionHeight}
                      onChange={(event) => setDraft({ ...draft, screenResolutionHeight: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <div className="panel-subgrid">
                  <label>
                    Diagonal inches
                    <input
                      type="number"
                      min={1}
                      step={0.1}
                      value={draft.screenDiagonalInches}
                      onChange={(event) => setDraft({ ...draft, screenDiagonalInches: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    Aspect ratio
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
                <div className="calibration-readout">Estimated PPI from screen size: {estimatedPpi.toFixed(1)}</div>
                <button onClick={() => setDraft({ ...draft, pixelsPerInch: Math.round(estimatedPpi) })}>Use estimated PPI</button>
              </>
            )}

            {draft.mode === "grid-cell" && (
              <div className="panel-subgrid">
                <label>
                  Pixels per inch
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={draft.pixelsPerInch}
                    onChange={(event) => setDraft({ ...draft, pixelsPerInch: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Inches per cell
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={draft.inchesPerGridCell}
                    onChange={(event) => setDraft({ ...draft, inchesPerGridCell: Number(event.target.value) })}
                  />
                </label>
              </div>
            )}

            <div className="calibration-readout">
              Target player grid cell: {effectiveTargetCellSize} px for {draft.inchesPerGridCell} inch{draft.inchesPerGridCell === 1 ? "" : "es"}.
              <br />
              Current scene grid cell: {scene.grid.sizePx} px.
              <br />
              Player View scale after Apply: {playerScale.toFixed(2)}x.
            </div>

            <label>
              Scale label
              <input value={draft.defaultScaleLabel} onChange={(event) => setDraft({ ...draft, defaultScaleLabel: event.target.value })} />
            </label>
          </>
        ) : (
          <div className="calibration-readout">Physical table scale is off. Player View will use the scene grid size without trying to match real-world inches.</div>
        )}
      </div>
      <div className="button-row">
        <button disabled={!hasDraftChanges} onClick={applyDraft}>
          Apply setup
        </button>
        <button disabled={!hasDraftChanges} onClick={() => setDraft(calibration)}>
          Reset
        </button>
      </div>
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
