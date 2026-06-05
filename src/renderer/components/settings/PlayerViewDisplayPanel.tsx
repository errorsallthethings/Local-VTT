import { useEffect, useState } from "react";
import type { DisplayCalibration } from "../../../shared/localvtt";
import type { DisplayInfo } from "./PlayerDisplayScalePanel";

interface PlayerViewDisplayPanelProps {
  calibration: DisplayCalibration;
  displays: DisplayInfo[];
  onApply: (calibration: DisplayCalibration) => void;
  onRefreshDisplays: () => Promise<boolean | undefined>;
}

export function PlayerViewDisplayPanel({ calibration, displays, onApply, onRefreshDisplays }: PlayerViewDisplayPanelProps) {
  const [draft, setDraft] = useState<DisplayCalibration>(calibration);

  useEffect(() => {
    setDraft(calibration);
  }, [calibration]);

  const selectedDisplay = displays.find((display) => display.id === draft.selectedDisplayId) ?? null;
  const hasDraftChanges = JSON.stringify(draft) !== JSON.stringify(calibration);

  return (
    <section className="panel">
      <h2>Player View Display</h2>
      <div className="inline-help">
        Choose a preferred table display for Player View. If the display is disconnected, Local VTT opens the window normally.
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
        <button disabled={!hasDraftChanges} onClick={() => onApply(draft)}>
          Apply
        </button>
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
          Clear
        </button>
      </div>
    </section>
  );
}

function getDisplayLabel(display: DisplayInfo): string {
  const name = display.label?.trim() ? display.label.trim() : `Display ${display.id}`;
  return `${name} - ${display.nativeResolution.width}x${display.nativeResolution.height}`;
}

function getDisplayDetails(display: DisplayInfo): string {
  return `${getDisplayLabel(display)}, bounds ${display.bounds.x},${display.bounds.y} ${display.bounds.width}x${display.bounds.height}, scale ${display.scaleFactor}`;
}
