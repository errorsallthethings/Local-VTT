import { ChevronDown, ChevronRight } from "lucide-react";
import { ColorInput } from "../../controls/ColorPickerField";
import {
  getEffectTuningColorAriaLabel,
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

export function SettingsToggle({ open, label, onToggle }: { open: boolean; label: string; onToggle: () => void }) {
  return (
    <button className="tools-settings-toggle" type="button" aria-expanded={open} onClick={onToggle}>
      {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
      <strong>{label}</strong>
    </button>
  );
}
