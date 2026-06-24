import type { TokenBorderStyle, TokenBorderWidthPreset, TokenMask, TokenPresentationDefaults, TokenSizePreset } from "../../../shared/localvtt";
import {
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_TOKEN_BORDER_STYLE,
  DEFAULT_TOKEN_BORDER_WIDTH,
  DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
  DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
  DEFAULT_TOKEN_GLOW_COLOR,
  DEFAULT_TOKEN_MASK,
  DEFAULT_TOKEN_SIZE_PRESET
} from "../../../shared/localvtt";
import { getBorderWidthForPreset } from "../../lib/tokens";
import { ColorPickerField } from "../controls/ColorPickerField";

interface TokenDefaultsPanelProps {
  draft: TokenPresentationDefaults;
  onChange: (draft: TokenPresentationDefaults) => void;
}

export function TokenDefaultsPanel({ draft, onChange }: TokenDefaultsPanelProps) {
  const sizePreset = draft.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET;
  const customSizeCells = draft.customSizeCells ?? { width: 1, height: 1 };
  const borderColor = draft.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR;
  const borderWidth = draft.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH;
  const borderWidthPreset = draft.borderWidthPreset ?? DEFAULT_TOKEN_BORDER_WIDTH_PRESET;
  const borderStyle = draft.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE;
  const glowColor = draft.glowColor ?? DEFAULT_TOKEN_GLOW_COLOR;
  const footprintVisible = draft.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE;

  const patchDraft = (patch: TokenPresentationDefaults) => onChange({ ...draft, ...patch });

  return (
    <div className="settings-grid">
      <label className="setting-row">
        <span>Size</span>
        <select value={sizePreset} onChange={(event) => patchDraft({ sizePreset: event.target.value as TokenSizePreset })}>
          <option value="tiny">Tiny/Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
          <option value="gargantuan">Gargantuan</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {sizePreset === "custom" && (
        <div className="setting-row">
          <span>Cells</span>
          <div className="xy-inputs">
            <label>
              W
              <input
                type="number"
                min={0.25}
                max={10}
                step={0.25}
                value={customSizeCells.width}
                onChange={(event) => patchDraft({ customSizeCells: { ...customSizeCells, width: clampCellCount(Number(event.target.value)) } })}
              />
            </label>
            <label>
              H
              <input
                type="number"
                min={0.25}
                max={10}
                step={0.25}
                value={customSizeCells.height}
                onChange={(event) => patchDraft({ customSizeCells: { ...customSizeCells, height: clampCellCount(Number(event.target.value)) } })}
              />
            </label>
          </div>
        </div>
      )}
      <label className="setting-row">
        <span>Mask</span>
        <select value={draft.mask ?? DEFAULT_TOKEN_MASK} onChange={(event) => patchDraft({ mask: event.target.value as TokenMask })}>
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="none">None</option>
        </select>
      </label>
      <label className="setting-row">
        <span>Border</span>
        <select value={borderStyle} onChange={(event) => patchDraft({ borderStyle: event.target.value as TokenBorderStyle })}>
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
      <ColorPickerField label="Border Color" value={borderColor} onChange={(borderColor) => patchDraft({ borderColor })} />
      {borderStyle === "glow" && <ColorPickerField label="Glow Color" value={glowColor} onChange={(glowColor) => patchDraft({ glowColor })} />}
      <label className="setting-row">
        <span>Border Width</span>
        <select
          value={borderWidthPreset}
          onChange={(event) => {
            const nextPreset = event.target.value as TokenBorderWidthPreset;
            patchDraft({
              borderWidthPreset: nextPreset,
              borderWidth: getBorderWidthForPreset(nextPreset, borderWidth)
            });
          }}
        >
          <option value="thin">Thin</option>
          <option value="medium">Medium</option>
          <option value="thick">Thick</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {borderWidthPreset === "custom" && (
        <label className="setting-row">
          <span>Pixels</span>
          <input type="number" min={1} max={64} step={1} value={borderWidth} onChange={(event) => patchDraft({ borderWidth: Math.min(64, Math.max(1, Number(event.target.value))) })} />
        </label>
      )}
      <label className="setting-row">
        <span>Footprint</span>
        <label className="fog-operation-switch token-footprint-switch" title="Show token footprint highlight by default">
          <span>Show</span>
          <input aria-label="Show token footprint highlight by default" type="checkbox" checked={!footprintVisible} onChange={(event) => patchDraft({ footprintVisible: !event.target.checked })} />
          <span>Hide</span>
        </label>
      </label>
    </div>
  );
}

function clampCellCount(value: number): number {
  return Math.min(10, Math.max(0.25, Number.isFinite(value) ? value : 1));
}
