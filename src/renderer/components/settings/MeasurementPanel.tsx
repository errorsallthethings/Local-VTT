import type { GridSettings, MeasurementUnit } from "../../../shared/localvtt";

interface MeasurementPanelProps {
  measurement: GridSettings["measurement"];
  onChange: (patch: Partial<GridSettings["measurement"]>) => void;
}

export function MeasurementPanel({ measurement, onChange }: MeasurementPanelProps) {
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
      <label>
        Distance mode
        <select value={measurement.distanceMode} onChange={(event) => onChange({ distanceMode: event.target.value as GridSettings["measurement"]["distanceMode"] })}>
          <option value="euclidean">Euclidean</option>
          <option value="manhattan">Manhattan</option>
          <option value="grid">Grid snapped</option>
          <option value="diagonal-5-10">5/10/5/10 diagonals</option>
        </select>
      </label>
    </section>
  );
}
