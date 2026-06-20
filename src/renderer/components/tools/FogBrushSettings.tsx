import { getPresetSelectValue, hasPresetValue } from "./toolPresetOptions";

const BRUSH_SIZE_PRESETS = [
  { label: "Extra Thin", value: 20 },
  { label: "Thin", value: 40 },
  { label: "Medium", value: 80 },
  { label: "Thick", value: 160 },
  { label: "Extra Thick", value: 240 }
];

export function FogBrushSettings({
  brushSize,
  customOpen,
  onBrushSizeChange,
  onCustomOpenChange
}: {
  brushSize: number;
  customOpen: boolean;
  onBrushSizeChange: (brushSize: number) => void;
  onCustomOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="tools-brush-size">
      <div className="tools-strip-select-field">
        <strong>Brush Size</strong>
        <div>
          <select
            aria-label="Fog brush size"
            title="Fog brush size"
            value={getPresetSelectValue(BRUSH_SIZE_PRESETS, brushSize, customOpen)}
            onChange={(event) => {
              if (event.target.value === "custom") {
                onCustomOpenChange(true);
                return;
              }
              onCustomOpenChange(false);
              onBrushSizeChange(Number(event.target.value));
            }}
          >
            {BRUSH_SIZE_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.value}>{preset.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      {(customOpen || !hasPresetValue(BRUSH_SIZE_PRESETS, brushSize)) && (
        <div className="tools-strip-advanced-slider tools-fog-brush-slider">
          <input aria-label="Fine tune fog brush size" title="Fine tune fog brush size" type="range" min={8} max={400} step={4} value={brushSize} onChange={(event) => onBrushSizeChange(Number(event.target.value))} />
          <span aria-label={`Fog brush size ${brushSize} pixels`}>{brushSize}px</span>
        </div>
      )}
    </div>
  );
}
