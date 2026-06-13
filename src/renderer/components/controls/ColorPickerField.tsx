import { useEffect, useRef, useState } from "react";
import type { CSSProperties, InputHTMLAttributes, KeyboardEvent } from "react";

export const COLOR_PRESETS = [
  { label: "Blue", value: "#7aa2f7" },
  { label: "Green", value: "#4cbf78" },
  { label: "Amber", value: "#d99a35" },
  { label: "Red", value: "#d76f6f" },
  { label: "Purple", value: "#b48ead" },
  { label: "Neutral", value: "#9aa6b7" }
];

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

interface ColorSettingRowProps {
  label: string;
  value: string;
  onOpen: () => void;
}

interface ColorInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "defaultValue"> {
  value: string;
  onChange: (value: string) => void;
}

export function ColorInput({ value, onChange, onBlur, onKeyDown, ...props }: ColorInputProps) {
  const [draftValue, setDraftValue] = useState(value);
  const draftRef = useRef(draftValue);

  useEffect(() => {
    setDraftValue(value);
    draftRef.current = value;
  }, [value]);

  const commitDraft = () => {
    if (draftRef.current !== value) {
      onChange(draftRef.current);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitDraft();
    }
    onKeyDown?.(event);
  };

  return (
    <input
      {...props}
      type="color"
      value={draftValue}
      onChange={(event) => {
        draftRef.current = event.target.value;
        setDraftValue(event.target.value);
      }}
      onBlur={(event) => {
        commitDraft();
        onBlur?.(event);
      }}
      onKeyDown={handleKeyDown}
    />
  );
}

export function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
  return (
    <div className="color-picker-field">
      <label>
        <span>{label}</span>
        <ColorInput value={value} onChange={onChange} />
      </label>
      <div className="color-swatch-row" aria-label={`${label} presets`}>
        {COLOR_PRESETS.map((preset) => (
          <button
            className={preset.value.toLowerCase() === value.toLowerCase() ? "color-swatch selected" : "color-swatch"}
            key={preset.value}
            type="button"
            aria-label={`${preset.label} preset`}
            title={preset.label}
            style={{ "--swatch-color": preset.value } as CSSProperties}
            onClick={() => onChange(preset.value)}
          />
        ))}
      </div>
    </div>
  );
}

export function ColorSettingRow({ label, value, onOpen }: ColorSettingRowProps) {
  return (
    <div className="setting-row color-setting-row">
      <span>{label}</span>
      <button type="button" className="color-setting-button" title={`${label}: ${value}`} onClick={onOpen}>
        <span className="color-setting-preview" style={{ "--swatch-color": value } as CSSProperties} aria-hidden="true" />
        <span>{value.toUpperCase()}</span>
      </button>
    </div>
  );
}
