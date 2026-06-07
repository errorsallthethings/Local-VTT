import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { GridSettings, MeasurementUnit } from "../../../shared/localvtt";

interface MeasurementPanelProps {
  measurement: GridSettings["measurement"];
  onChange: (patch: Partial<GridSettings["measurement"]>) => void;
}

export function MeasurementPanel({ measurement, onChange }: MeasurementPanelProps) {
  const [distanceHelpOpen, setDistanceHelpOpen] = useState(false);

  return (
    <section className="panel">
      <h2>Measurement</h2>
      <div className="panel-subgrid">
        <label>
          Units per cell
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={measurement.unitsPerGridCell}
            onChange={(event) => onChange({ unitsPerGridCell: Number(event.target.value) })}
          />
        </label>
        <label>
          Unit
          <select value={measurement.unit} onChange={(event) => onChange({ unit: event.target.value as MeasurementUnit })}>
            <option value="feet">Feet</option>
            <option value="meters">Meters</option>
            <option value="miles">Miles</option>
          </select>
        </label>
      </div>
      <label className="measurement-distance-field">
        <span className="measurement-distance-label">
          Distance mode
          <button
            type="button"
            className="icon-button measurement-help-button"
            aria-label="Distance mode help"
            title="Distance mode help"
            onClick={() => setDistanceHelpOpen((open) => !open)}
          >
            <CircleHelp size={15} aria-hidden="true" />
          </button>
        </span>
        <select value={measurement.distanceMode} onChange={(event) => onChange({ distanceMode: event.target.value as GridSettings["measurement"]["distanceMode"] })}>
          <option value="euclidean">Euclidean</option>
          <option value="manhattan">Manhattan</option>
          <option value="grid">Grid snapped</option>
          <option value="diagonal-5-10">5/10/5/10 diagonals</option>
        </select>
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
