import { ColorInput } from "../../controls/ColorPickerField";
import { getPresetSelectValue, hasPresetValue } from "./toolPresetOptions";
import type { PingKind } from "../../../../shared/localvtt";

type CanvasTool = "ruler" | "ping" | "laser" | "arrow";

const PING_SIZE_PRESETS = [
  { label: "Extra Small", value: 0.65 },
  { label: "Small", value: 0.85 },
  { label: "Medium", value: 1 },
  { label: "Large", value: 1.5 },
  { label: "Extra Large", value: 2.25 }
];

const PING_KIND_OPTIONS = [
  { label: "Sonar", value: "sonar" },
  { label: "Radius", value: "radius" },
  { label: "Attention", value: "attention" }
] as const satisfies Array<{ label: string; value: PingKind }>;

const LASER_THICKNESS_PRESETS = [
  { label: "Extra Thin", value: 8 },
  { label: "Thin", value: 14 },
  { label: "Medium", value: 20 },
  { label: "Thick", value: 32 },
  { label: "Extra Thick", value: 48 }
];

export function TableToolSettings({
  activeCanvasTool,
  pingSize,
  pingColor,
  pingKind,
  laserThickness,
  laserColor,
  pingSizeCustomOpen,
  laserThicknessCustomOpen,
  onPingSizeChange,
  onPingColorChange,
  onPingKindChange,
  onLaserThicknessChange,
  onLaserColorChange,
  onPingSizeCustomOpenChange,
  onLaserThicknessCustomOpenChange
}: {
  activeCanvasTool: CanvasTool | null;
  pingSize: number;
  pingColor: string;
  pingKind: PingKind;
  laserThickness: number;
  laserColor: string;
  pingSizeCustomOpen: boolean;
  laserThicknessCustomOpen: boolean;
  onPingSizeChange: (pingSize: number) => void;
  onPingColorChange: (color: string) => void;
  onPingKindChange: (kind: PingKind) => void;
  onLaserThicknessChange: (thickness: number) => void;
  onLaserColorChange: (color: string) => void;
  onPingSizeCustomOpenChange: (open: boolean) => void;
  onLaserThicknessCustomOpenChange: (open: boolean) => void;
}) {
  if (activeCanvasTool === "ping") {
    return (
      <div className="tools-section-tools">
        <div className="tools-ping-settings-panel">
          <label className="tools-strip-field tools-strip-color-field">
            <span>Color</span>
            <ColorInput className="tools-ping-color" value={pingColor} aria-label="Ping color" title="Ping color" onChange={onPingColorChange} />
          </label>
          <div className="tools-strip-select-field">
            <strong>Type</strong>
            <div>
              <select aria-label="Ping type" title="Ping type" value={pingKind} onChange={(event) => onPingKindChange(event.target.value as PingKind)}>
                {PING_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="tools-strip-select-field">
            <strong>Size</strong>
            <div>
              <select
                aria-label="Sonar size"
                title="Sonar size"
                value={getPresetSelectValue(PING_SIZE_PRESETS, pingSize, pingSizeCustomOpen)}
                onChange={(event) => {
                  if (event.target.value === "custom") {
                    onPingSizeCustomOpenChange(true);
                    return;
                  }
                  onPingSizeCustomOpenChange(false);
                  onPingSizeChange(Number(event.target.value));
                }}
              >
                {PING_SIZE_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.value}>{preset.label}</option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          {(pingSizeCustomOpen || !hasPresetValue(PING_SIZE_PRESETS, pingSize)) && (
            <div className="tools-strip-advanced-slider tools-table-slider">
              <input aria-label="Fine tune sonar size" title="Fine tune sonar size" type="range" min={0.5} max={3} step={0.1} value={pingSize} onChange={(event) => onPingSizeChange(Number(event.target.value))} />
              <span>{Math.round(pingSize * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeCanvasTool === "laser" || activeCanvasTool === "arrow") {
    const toolLabel = activeCanvasTool === "arrow" ? "Arrow" : "Laser";
    return (
      <div className="tools-section-tools">
        <div className="tools-ping-settings-panel">
          <label className="tools-strip-field tools-strip-color-field">
            <span>Color</span>
            <ColorInput className="tools-ping-color" value={laserColor} aria-label={`${toolLabel} color`} title={`${toolLabel} color`} onChange={onLaserColorChange} />
          </label>
          <div className="tools-strip-select-field">
            <strong>Thickness</strong>
            <div>
              <select
                aria-label={`${toolLabel} thickness`}
                title={`${toolLabel} thickness`}
                value={getPresetSelectValue(LASER_THICKNESS_PRESETS, laserThickness, laserThicknessCustomOpen)}
                onChange={(event) => {
                  if (event.target.value === "custom") {
                    onLaserThicknessCustomOpenChange(true);
                    return;
                  }
                  onLaserThicknessCustomOpenChange(false);
                  onLaserThicknessChange(Number(event.target.value));
                }}
              >
                {LASER_THICKNESS_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.value}>{preset.label}</option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          {(laserThicknessCustomOpen || !hasPresetValue(LASER_THICKNESS_PRESETS, laserThickness)) && (
            <div className="tools-strip-advanced-slider tools-table-slider">
              <input aria-label={`Fine tune ${toolLabel.toLowerCase()} thickness`} title={`Fine tune ${toolLabel.toLowerCase()} thickness`} type="range" min={4} max={80} step={2} value={laserThickness} onChange={(event) => onLaserThicknessChange(Number(event.target.value))} />
              <span>{laserThickness}px</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
