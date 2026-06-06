import type { GridType } from "../../../shared/localvtt";
import {
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_TOKEN_BORDER_STYLE,
  DEFAULT_TOKEN_BORDER_WIDTH,
  DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
  DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
  DEFAULT_TOKEN_GLOW_COLOR,
  DEFAULT_TOKEN_MASK,
  DEFAULT_TOKEN_SIZE_PRESET,
  type Token,
  type TokenBorderStyle,
  type TokenBorderWidthPreset,
  type TokenMask,
  type TokenSizePreset
} from "../../../shared/localvtt";
import { ColorSettingRow } from "../controls/ColorPickerField";

export function TokenSettings({
  token,
  gridSize,
  gridType,
  onUpdateToken,
  onOpenTokenColor
}: {
  token: Token;
  gridSize: number;
  gridType: GridType;
  onUpdateToken: (patch: Partial<Token>) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const sizePreset = token.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET;
  const borderColor = token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR;
  const borderWidth = token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH;
  const borderWidthPreset = token.borderWidthPreset ?? getBorderWidthPreset(borderWidth);
  const borderStyle = token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE;
  const glowColor = token.glowColor ?? DEFAULT_TOKEN_GLOW_COLOR;
  const customWidthCells = Math.round((token.size.width / Math.max(1, gridSize)) * 100) / 100;
  const customHeightCells = Math.round((token.size.height / Math.max(1, gridSize)) * 100) / 100;
  const customSizeDisabled = gridType === "hex";

  const updateSizePreset = (preset: TokenSizePreset) => {
    if (preset === "custom") {
      onUpdateToken({ sizePreset: "custom" });
      return;
    }
    onUpdateToken({
      sizePreset: preset,
      size: getTokenSizeForPreset(preset, gridSize, gridType)
    });
  };

  const updateCustomSize = (axis: "width" | "height", cells: number) => {
    const clampedCells = Math.min(10, Math.max(0.25, cells));
    onUpdateToken({
      sizePreset: "custom",
      size: {
        width: axis === "width" ? Math.max(1, gridSize) * clampedCells : token.size.width,
        height: axis === "height" ? Math.max(1, gridSize) * clampedCells : token.size.height
      }
    });
  };

  return (
    <div className="settings-grid">
      <label className="setting-row">
        <span>Size</span>
        <select value={sizePreset} onChange={(event) => updateSizePreset(event.target.value as TokenSizePreset)}>
          <option value="tiny">Tiny/Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
          <option value="gargantuan">Gargantuan</option>
          <option value="custom" disabled={customSizeDisabled}>Custom</option>
        </select>
      </label>
      {sizePreset === "custom" && !customSizeDisabled && (
        <div className="setting-row">
          <span>Cells</span>
          <div className="xy-inputs">
            <label>
              W
              <input type="number" min={0.25} max={10} step={0.25} value={customWidthCells} onChange={(event) => updateCustomSize("width", Number(event.target.value))} />
            </label>
            <label>
              H
              <input type="number" min={0.25} max={10} step={0.25} value={customHeightCells} onChange={(event) => updateCustomSize("height", Number(event.target.value))} />
            </label>
          </div>
        </div>
      )}
      <label className="setting-row">
        <span>Mask</span>
        <select value={token.mask ?? DEFAULT_TOKEN_MASK} onChange={(event) => onUpdateToken({ mask: event.target.value as TokenMask })}>
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="none">None</option>
        </select>
      </label>
      <label className="setting-row">
        <span>Border</span>
        <select value={borderStyle} onChange={(event) => onUpdateToken({ borderStyle: event.target.value as TokenBorderStyle })}>
          <option value="none">None</option>
          <option value="solid">Solid</option>
          <option value="embossed">Embossed</option>
          <option value="inner-shadow">Inner Shadow</option>
          <option value="glow">Glow</option>
        </select>
      </label>
      <ColorSettingRow label="Border Color" value={borderColor} onOpen={() => onOpenTokenColor(token.id, borderColor, "border")} />
      {borderStyle === "glow" && <ColorSettingRow label="Glow Color" value={glowColor} onOpen={() => onOpenTokenColor(token.id, glowColor, "glow")} />}
      <label className="setting-row">
        <span>Border Width</span>
        <select
          value={borderWidthPreset}
          onChange={(event) => {
            const preset = event.target.value as TokenBorderWidthPreset;
            onUpdateToken({
              borderWidthPreset: preset,
              borderWidth: getBorderWidthForPreset(preset, borderWidth)
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
          <input
            type="number"
            min={1}
            max={16}
            step={1}
            value={borderWidth}
            onChange={(event) => onUpdateToken({ borderWidth: Math.min(16, Math.max(1, Number(event.target.value))) })}
          />
        </label>
      )}
      <label className="setting-row">
        <span>Footprint</span>
        <label className="fog-operation-switch token-footprint-switch" title="Show token footprint highlight">
          <span>Show</span>
          <input
            aria-label="Show token footprint highlight"
            type="checkbox"
            checked={!(token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE)}
            onChange={(event) => onUpdateToken({ footprintVisible: !event.target.checked })}
          />
          <span>Hide</span>
        </label>
      </label>
    </div>
  );
}

export function getTokenSizeForPreset(preset: TokenSizePreset, gridSize: number, gridType: GridType): Token["size"] {
  const size = Math.max(1, gridSize);
  if (gridType === "hex") {
    const cells = getTokenPresetCells(preset);
    const multiplier = preset === "tiny" ? 0.42 : Math.max(0.72, cells * 0.72);
    return {
      width: size * multiplier,
      height: size * multiplier
    };
  }
  const cells = getTokenPresetCells(preset);
  return {
    width: size * cells,
    height: size * cells
  };
}

export function getBorderWidthPreset(width: number): TokenBorderWidthPreset {
  if (width === 3) {
    return "thin";
  }
  if (width === 5) {
    return "medium";
  }
  if (width === 8) {
    return "thick";
  }
  return "custom";
}

export function getBorderWidthForPreset(preset: TokenBorderWidthPreset, fallback: number): number {
  switch (preset) {
    case "thin":
      return 3;
    case "medium":
      return 5;
    case "thick":
      return 8;
    case "custom":
      return fallback;
  }
}

function getTokenPresetCells(preset: TokenSizePreset): number {
  switch (preset) {
    case "tiny":
      return 0.5;
    case "large":
      return 2;
    case "huge":
      return 3;
    case "gargantuan":
      return 4;
    case "medium":
    case "custom":
      return 1;
  }
}
