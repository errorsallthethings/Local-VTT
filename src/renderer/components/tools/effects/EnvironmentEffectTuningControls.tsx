import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { ColorInput } from "../../controls/ColorPickerField";
import {
  getEffectTuningColorAriaLabel,
  getEffectTuningCopyLabel,
  getEffectTuningSliderReadout,
  parseEffectTuningSliderInput
} from "./environmentEffectTuningControlState";

export function EffectTuningSlider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="water-tuning-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(parseEffectTuningSliderInput(event.target.value, value))} />
      <strong>{getEffectTuningSliderReadout(value, suffix)}</strong>
    </label>
  );
}

export function EffectTuningColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="water-tuning-color">
      <span>{label}</span>
      <ColorInput value={value} onChange={onChange} aria-label={getEffectTuningColorAriaLabel(label)} />
    </label>
  );
}

export function EffectTuningReadout({ copyLabel, readout }: { copyLabel: string; readout: string }) {
  const label = getEffectTuningCopyLabel(copyLabel);

  return (
    <div className="water-tuning-readout-row">
      <div className="water-tuning-readout" title={readout}>{readout}</div>
      <button className="icon-button no-chrome" type="button" title={label} aria-label={label} onClick={() => void navigator.clipboard?.writeText(readout)}>
        <Copy size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function SettingsToggle({ open, label, onToggle }: { open: boolean; label: string; onToggle: () => void }) {
  return (
    <button className="tools-settings-toggle" type="button" aria-expanded={open} onClick={onToggle}>
      {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
      <strong>{label}</strong>
    </button>
  );
}
