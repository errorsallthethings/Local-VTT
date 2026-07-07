import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { GridSettings, MeasurementUnit } from "../../../shared/localvtt";

interface MeasurementPanelProps {
  measurement: GridSettings["measurement"];
  onChange: (patch: Partial<GridSettings["measurement"]>) => void;
  embedded?: boolean;
}

export function MeasurementPanel({ measurement, onChange, embedded = false }: MeasurementPanelProps) {
  const [distanceHelpOpen, setDistanceHelpOpen] = useState(false);
  const groupClassName = embedded ? "settings-grid" : "panel-subgrid";
  const rowClassName = embedded ? "setting-row" : undefined;

  return (
    <section className={embedded ? "measurement-panel measurement-panel-embedded" : "panel measurement-panel"}>
      <h2>Measurements</h2>
      <div className={groupClassName}>
        <label className={rowClassName}>
          <span>Units Per Cell</span>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={measurement.unitsPerGridCell}
            onChange={(event) => onChange({ unitsPerGridCell: Number(event.target.value) })}
          />
        </label>
        <label className={rowClassName}>
          <span>Unit</span>
          <select value={measurement.unit} onChange={(event) => onChange({ unit: event.target.value as MeasurementUnit })}>
            <option value="feet">Feet</option>
            <option value="meters">Meters</option>
            <option value="miles">Miles</option>
          </select>
        </label>
      </div>
      <label className={embedded ? "setting-row measurement-distance-field" : "measurement-distance-field"}>
        <span>Distance Mode</span>
        <span className="measurement-distance-control">
          <select value={measurement.distanceMode} onChange={(event) => onChange({ distanceMode: event.target.value as GridSettings["measurement"]["distanceMode"] })}>
            <option value="euclidean">Euclidean</option>
            <option value="manhattan">Manhattan</option>
            <option value="grid">Grid Snapped</option>
            <option value="diagonal-5-10">5/10/5/10 Diagonals</option>
          </select>
          <button
            type="button"
            className="icon-button measurement-help-button"
            aria-label="Distance Mode Help"
            title="Distance Mode Help"
            onClick={() => setDistanceHelpOpen((open) => !open)}
          >
            <CircleHelp size={15} aria-hidden="true" />
          </button>
        </span>
      </label>
      {distanceHelpOpen && (
        <div className="measurement-help-panel" role="note">
          <p>
            <strong>Euclidean</strong> measures straight-line distance.
          </p>
          <p>
            <strong>Manhattan</strong> counts horizontal plus vertical movement.
          </p>
          <p>
            <strong>Grid snapped</strong> counts the longest grid axis, useful for simple tactical movement.
          </p>
          <p>
            <strong>5/10/5/10 diagonals</strong> alternates diagonal steps between one and two cells.
          </p>
        </div>
      )}
    </section>
  );
}
