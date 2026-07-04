import type { GridType } from "../../../../shared/localvtt";
import {
  type Token,
  type TokenBorderStyle,
  type TokenBorderWidthPreset,
  type TokenMask,
  type TokenSizePreset
} from "../../../../shared/localvtt";
import {
  getTokenBorderWidthPresetPatch,
  getTokenCustomBorderWidthPatch,
  getTokenCustomSizePatch,
  getTokenFootprintVisibilityPatch,
  getTokenSettingsPresentation,
  getTokenSizePresetPatch
} from "../../../lib/tokens";
import { ColorSettingRow } from "../../controls/ColorPickerField";

export function TokenSettings({
  token,
  gridSize,
  gridType,
  onUpdateToken,
  onOpenTokenColor,
  showFootprint = true
}: {
  token: Token;
  gridSize: number;
  gridType: GridType;
  onUpdateToken: (patch: Partial<Token>) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
  showFootprint?: boolean;
}) {
  const presentation = getTokenSettingsPresentation(token, gridSize, gridType);

  const updateSizePreset = (preset: TokenSizePreset) => {
    onUpdateToken(getTokenSizePresetPatch(preset, gridSize, gridType));
  };

  const updateCustomSize = (axis: "width" | "height", cells: number) => {
    onUpdateToken(getTokenCustomSizePatch(token, gridSize, axis, cells));
  };

  return (
    <div className="settings-grid">
      <label className="setting-row">
        <span>Size</span>
        <select value={presentation.sizePreset} onChange={(event) => updateSizePreset(event.target.value as TokenSizePreset)}>
          <option value="tiny">Tiny/Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
          <option value="gargantuan">Gargantuan</option>
          <option value="custom" disabled={presentation.customSizeDisabled}>Custom</option>
        </select>
      </label>
      {presentation.sizePreset === "custom" && !presentation.customSizeDisabled && (
        <div className="setting-row">
          <span>Cells</span>
          <div className="xy-inputs">
            <label>
              W
              <input type="number" min={0.25} max={10} step={0.25} value={presentation.customWidthCells} onChange={(event) => updateCustomSize("width", Number(event.target.value))} />
            </label>
            <label>
              H
              <input type="number" min={0.25} max={10} step={0.25} value={presentation.customHeightCells} onChange={(event) => updateCustomSize("height", Number(event.target.value))} />
            </label>
          </div>
        </div>
      )}
      <label className="setting-row">
        <span>Mask</span>
        <select value={presentation.mask} onChange={(event) => onUpdateToken({ mask: event.target.value as TokenMask })}>
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="none">None</option>
        </select>
      </label>
      <label className="setting-row">
        <span>Border</span>
        <select value={presentation.borderStyle} onChange={(event) => onUpdateToken({ borderStyle: event.target.value as TokenBorderStyle })}>
          <option value="none">None</option>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="double-line">Double Line</option>
          <option value="embossed">Embossed</option>
          <option value="inner-shadow">Inner Shadow</option>
          <option value="glow">Glow</option>
        </select>
      </label>
      <ColorSettingRow label="Border Color" value={presentation.borderColor} onOpen={() => onOpenTokenColor(token.id, presentation.borderColor, "border")} />
      {presentation.borderStyle === "glow" && <ColorSettingRow label="Glow Color" value={presentation.glowColor} onOpen={() => onOpenTokenColor(token.id, presentation.glowColor, "glow")} />}
      <label className="setting-row">
        <span>Border Width</span>
        <select
          value={presentation.borderWidthPreset}
          onChange={(event) => {
            const preset = event.target.value as TokenBorderWidthPreset;
            onUpdateToken(getTokenBorderWidthPresetPatch(preset, presentation.borderWidth));
          }}
        >
          <option value="thin">Thin</option>
          <option value="medium">Medium</option>
          <option value="thick">Thick</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {presentation.borderWidthPreset === "custom" && (
        <label className="setting-row">
          <span>Pixels</span>
          <input
            type="number"
            min={1}
            max={64}
            step={1}
            value={presentation.borderWidth}
            onChange={(event) => onUpdateToken(getTokenCustomBorderWidthPatch(Number(event.target.value)))}
          />
        </label>
      )}
      {showFootprint && (
        <label className="setting-row">
          <span>Footprint</span>
          <label className="fog-operation-switch token-footprint-switch" title="Show token footprint highlight">
            <span>Show</span>
            <input
              aria-label="Show token footprint highlight"
              type="checkbox"
              checked={presentation.footprintHidden}
              onChange={(event) => onUpdateToken(getTokenFootprintVisibilityPatch(event.target.checked))}
            />
            <span>Hide</span>
          </label>
        </label>
      )}
    </div>
  );
}
