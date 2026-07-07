import type { PointerEvent } from "react";
import { RotateCcw, Settings2 } from "lucide-react";
import type { WeatherTuningSettings } from "../../../../shared/localvtt";

export function WeatherCategoryRow({
  label,
  enabled,
  expanded,
  onEnabledChange,
  onExpand
}: {
  label: string;
  enabled: boolean;
  expanded: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onExpand: () => void;
}) {
  return (
    <div className={expanded ? "weather-category-row weather-category-row-active" : "weather-category-row"}>
      <span>{label}</span>
      <label className="fog-operation-switch weather-category-switch" title={`${enabled ? "Disable" : "Enable"} ${label}`}>
        <span>Off</span>
        <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        <span>On</span>
      </label>
      <button className={expanded ? "icon-button layer-settings-button layer-settings-active" : "icon-button layer-settings-button"} type="button" title={`${label} settings`} aria-label={`${label} settings`} onClick={onExpand}>
        <Settings2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function WeatherRangeRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onReset
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <div className="weather-setting-control weather-setting-control-with-value">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <output>{format(value)}</output>
        <button className="icon-button weather-reset-button" type="button" title={`Reset ${label.toLowerCase()}`} aria-label={`Reset weather ${label.toLowerCase()}`} onClick={onReset}>
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function WeatherDirectionDial({
  weather,
  onChange,
  onReset
}: {
  weather: WeatherTuningSettings;
  onChange: (patch: Partial<WeatherTuningSettings>) => void;
  onReset: () => void;
}) {
  const directionDegrees = Number.isFinite(weather.directionDegrees) ? weather.directionDegrees : 0;
  const strength = Number.isFinite(weather.driftStrength) ? Math.max(0, Math.min(1, weather.driftStrength)) : 0;
  const radians = (directionDegrees * Math.PI) / 180;
  const knobX = 50 + Math.cos(radians) * strength * 34;
  const knobY = 50 + Math.sin(radians) * strength * 34;
  const label = strength <= 0.02 ? "No drift" : `${Math.round(directionDegrees)} deg, ${Math.round(strength * 100)}%`;

  const updateFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    const distance = Math.hypot(x, y);
    const radius = rect.width / 2;
    const nextStrength = distance < radius * 0.16 ? 0 : Math.min(1, distance / (radius * 0.78));
    const nextDegrees = nextStrength === 0 ? directionDegrees : (Math.atan2(y, x) * 180) / Math.PI;
    onChange({
      driftStrength: nextStrength,
      directionDegrees: nextStrength === 0 ? directionDegrees : Math.round((nextDegrees + 360) % 360)
    });
  };

  return (
    <div className="weather-drift-control">
      <button
        type="button"
        className="weather-direction-dial"
        aria-label={`Weather drift: ${label}`}
        title="Drag the point to set weather drift. Click the center for no drift."
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event);
          }
        }}
      >
        <span className="weather-direction-ring" aria-hidden="true" />
        <span className="weather-direction-center" aria-hidden="true" />
        <span className="weather-direction-knob" style={{ left: `${knobX}%`, top: `${knobY}%` }} aria-hidden="true" />
      </button>
      <div className="weather-drift-meta">
        <span className="weather-drift-label">{label}</span>
        <button className="icon-button weather-reset-button" type="button" title="Reset drift" aria-label="Reset weather drift" onClick={onReset}>
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
