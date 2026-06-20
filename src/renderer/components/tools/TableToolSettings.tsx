import { ColorInput } from "../controls/ColorPickerField";
import { getPresetSelectValue, hasPresetValue } from "./toolPresetOptions";

type CanvasTool = "ruler" | "ping" | "laser";

const PING_SIZE_PRESETS = [
  { label: "Extra Small", value: 0.65 },
  { label: "Small", value: 0.85 },
  { label: "Medium", value: 1 },
  { label: "Large", value: 1.5 },
  { label: "Extra Large", value: 2.25 }
];

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
  laserThickness,
  laserColor,
  pingSizeCustomOpen,
  laserThicknessCustomOpen,
  onPingSizeChange,
  onPingColorChange,
  onLaserThicknessChange,
  onLaserColorChange,
  onPingSizeCustomOpenChange,
  onLaserThicknessCustomOpenChange
}: {
  activeCanvasTool: CanvasTool | null;
  pingSize: number;
  pingColor: string;
  laserThickness: number;
  laserColor: string;
  pingSizeCustomOpen: boolean;
  laserThicknessCustomOpen: boolean;
  onPingSizeChange: (pingSize: number) => void;
  onPingColorChange: (color: string) => void;
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

  if (activeCanvasTool === "laser") {
    return (
      <div className="tools-section-tools">
        <div className="tools-ping-settings-panel">
          <label className="tools-strip-field tools-strip-color-field">
            <span>Color</span>
            <ColorInput className="tools-ping-color" value={laserColor} aria-label="Laser color" title="Laser color" onChange={onLaserColorChange} />
          </label>
          <div className="tools-strip-select-field">
            <strong>Thickness</strong>
            <div>
              <select
                aria-label="Laser thickness"
                title="Laser thickness"
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
              <input aria-label="Fine tune laser thickness" title="Fine tune laser thickness" type="range" min={4} max={80} step={2} value={laserThickness} onChange={(event) => onLaserThicknessChange(Number(event.target.value))} />
              <span>{laserThickness}px</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
