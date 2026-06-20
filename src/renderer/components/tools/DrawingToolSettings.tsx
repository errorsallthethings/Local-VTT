import type { DrawingStrokeStyle, DrawingTemplateEffect } from "../../../shared/localvtt";
import type { DrawingTool } from "../../canvas/drawingRenderer";
import { ColorInput } from "../controls/ColorPickerField";
import { getPresetSelectValue, hasPresetValue } from "./toolPresetOptions";

export type DrawingTemplateSize = "custom" | 5 | 10 | 15 | 20 | 30 | 60 | 100;
export type DrawingTemplateWidth = 0 | 5 | 10 | 15 | 20;

const DRAWING_THICKNESS_PRESETS = [
  { label: "Extra Thin", value: 8 },
  { label: "Thin", value: 20 },
  { label: "Medium", value: 40 },
  { label: "Thick", value: 80 },
  { label: "Extra Thick", value: 160 }
];

const TEMPLATE_THICKNESS_PRESETS = [
  { label: "Extra Thin", value: 4 },
  { label: "Thin", value: 8 },
  { label: "Medium", value: 16 },
  { label: "Thick", value: 32 },
  { label: "Extra Thick", value: 64 }
];

const DRAWING_OPACITY_PRESETS = [
  { label: "Faint", value: 0.25 },
  { label: "Soft", value: 0.5 },
  { label: "Bold", value: 0.75 },
  { label: "Solid", value: 1 }
];

const DRAWING_STROKE_STYLE_OPTIONS: Array<{ label: string; value: DrawingStrokeStyle }> = [
  { label: "Solid - continuous", value: "solid" },
  { label: "Dashed - long breaks", value: "dashed" },
  { label: "Dotted - round dots", value: "dotted" },
  { label: "Dash Dot - mixed", value: "dash-dot" },
  { label: "Sketch - uneven", value: "sketch" }
];

const TEMPLATE_SIZE_PRESETS: DrawingTemplateSize[] = ["custom", 5, 10, 15, 20, 30, 60, 100];
const TEMPLATE_WIDTH_PRESETS: Array<{ label: string; value: DrawingTemplateWidth }> = [
  { label: "Line Only", value: 0 },
  { label: "5 ft", value: 5 },
  { label: "10 ft", value: 10 },
  { label: "15 ft", value: 15 },
  { label: "20 ft", value: 20 }
];
const TEMPLATE_EFFECT_OPTIONS: Array<{ label: string; value: DrawingTemplateEffect }> = [
  { label: "Plain", value: "plain" },
  { label: "Acid", value: "acid" },
  { label: "Arcane", value: "arcane" },
  { label: "Cold", value: "cold" },
  { label: "Darkness", value: "darkness" },
  { label: "Fire", value: "fire" },
  { label: "Fog / Smoke", value: "fog" },
  { label: "Electric", value: "lightning" },
  { label: "Nature / Thorns", value: "nature" },
  { label: "Poison Cloud", value: "poison" },
  { label: "Psychic", value: "psychic" },
  { label: "Radiant", value: "radiant" },
  { label: "Storm", value: "storm" },
  { label: "Thunder", value: "thunder" },
  { label: "Water", value: "water" },
  { label: "Web", value: "web" }
];
export function DrawingSettings({
  drawingColor,
  drawingOpacity,
  drawingFillColor,
  drawingFillOpacity,
  drawingStrokeStyle,
  drawingStrokeWidth,
  drawingTemplateSize,
  drawingTemplateEffect,
  drawingTemplateWidth,
  templatePreviewVisibleInPlayer = false,
  activeDrawingTool,
  drawingThicknessCustomOpen,
  drawingOpacityCustomOpen,
  showFillSettings,
  templateToolActive,
  onDrawingColorChange,
  onDrawingOpacityChange,
  onDrawingFillColorChange,
  onDrawingFillOpacityChange,
  onDrawingStrokeStyleChange,
  onDrawingStrokeWidthChange,
  onDrawingTemplateSizeChange,
  onDrawingTemplateEffectChange,
  onDrawingTemplateWidthChange,
  onTemplatePreviewVisibleInPlayerChange,
  onDrawingThicknessCustomOpenChange,
  onDrawingOpacityCustomOpenChange
}: {
  drawingColor: string;
  drawingOpacity: number;
  drawingFillColor: string;
  drawingFillOpacity: number;
  drawingStrokeStyle: DrawingStrokeStyle;
  drawingStrokeWidth: number;
  drawingTemplateSize: DrawingTemplateSize;
  drawingTemplateEffect: DrawingTemplateEffect;
  drawingTemplateWidth: DrawingTemplateWidth;
  templatePreviewVisibleInPlayer?: boolean;
  activeDrawingTool: DrawingTool | null;
  drawingThicknessCustomOpen: boolean;
  drawingOpacityCustomOpen: boolean;
  showFillSettings: boolean;
  templateToolActive: boolean;
  onDrawingColorChange: (color: string) => void;
  onDrawingOpacityChange: (opacity: number) => void;
  onDrawingFillColorChange: (color: string) => void;
  onDrawingFillOpacityChange: (opacity: number) => void;
  onDrawingStrokeStyleChange: (strokeStyle: DrawingStrokeStyle) => void;
  onDrawingStrokeWidthChange: (strokeWidth: number) => void;
  onDrawingTemplateSizeChange: (size: DrawingTemplateSize) => void;
  onDrawingTemplateEffectChange: (effect: DrawingTemplateEffect) => void;
  onDrawingTemplateWidthChange: (width: DrawingTemplateWidth) => void;
  onTemplatePreviewVisibleInPlayerChange?: (visible: boolean) => void;
  onDrawingThicknessCustomOpenChange: (open: boolean) => void;
  onDrawingOpacityCustomOpenChange: (open: boolean) => void;
}) {
  const strokeColorDisabled = templateToolActive && drawingTemplateEffect !== "plain";
  const thicknessPresets = templateToolActive ? TEMPLATE_THICKNESS_PRESETS : DRAWING_THICKNESS_PRESETS;
  const thicknessInputLabel = templateToolActive ? "Template thickness" : "Drawing thickness";
  const thicknessMin = templateToolActive ? 4 : 8;
  return (
    <div className={templateToolActive ? "tools-drawing-settings tools-drawing-settings-template" : "tools-drawing-settings"}>
      {templateToolActive && (
        <div className="tools-drawing-settings-row tools-template-effect-row">
          <div className="tools-drawing-row-label">Effect</div>
          <div className="tools-strip-select-field tools-strip-template-effect-control">
            <strong>Visual</strong>
            <div>
              <select aria-label="Template visual effect" title="Template visual effect" value={drawingTemplateEffect} onChange={(event) => onDrawingTemplateEffectChange(event.target.value as DrawingTemplateEffect)}>
                {TEMPLATE_EFFECT_OPTIONS.map((effect) => (
                  <option key={effect.value} value={effect.value}>{effect.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      <div className="tools-drawing-settings-row tools-drawing-stroke-row">
        <div className="tools-drawing-row-label">Stroke</div>
        <label className={strokeColorDisabled ? "tools-strip-field tools-strip-color-field tools-field-disabled" : "tools-strip-field tools-strip-color-field"}>
          <span>Color</span>
          <ColorInput className="tools-drawing-color" value={drawingColor} aria-label="Stroke color" title={strokeColorDisabled ? "Stroke color is controlled by the selected effect" : "Stroke color"} disabled={strokeColorDisabled} onChange={onDrawingColorChange} />
        </label>
        <div className="tools-strip-select-field tools-strip-thickness-control">
          <strong>Thickness</strong>
          <div>
            <select
              aria-label={thicknessInputLabel}
              title={thicknessInputLabel}
              value={getPresetSelectValue(thicknessPresets, drawingStrokeWidth, drawingThicknessCustomOpen)}
              onChange={(event) => {
                if (event.target.value === "custom") {
                  onDrawingThicknessCustomOpenChange(true);
                  return;
                }
                onDrawingThicknessCustomOpenChange(false);
                onDrawingStrokeWidthChange(Number(event.target.value));
              }}
            >
              {thicknessPresets.map((preset) => (
                <option key={preset.label} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        {!templateToolActive && (
          <div className="tools-strip-select-field tools-strip-style-control">
            <strong>Type</strong>
            <div>
              <select aria-label="Drawing stroke type" title="Drawing stroke type" value={drawingStrokeStyle} onChange={(event) => onDrawingStrokeStyleChange(event.target.value as DrawingStrokeStyle)}>
                {DRAWING_STROKE_STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="tools-strip-select-field tools-strip-opacity-control">
          <strong>Opacity</strong>
          <div>
            <select
              aria-label="Drawing opacity"
              title="Drawing opacity"
              value={getPresetSelectValue(DRAWING_OPACITY_PRESETS, drawingOpacity, drawingOpacityCustomOpen)}
              onChange={(event) => {
                if (event.target.value === "custom") {
                  onDrawingOpacityCustomOpenChange(true);
                  return;
                }
                onDrawingOpacityCustomOpenChange(false);
                onDrawingOpacityChange(Number(event.target.value));
              }}
            >
              {DRAWING_OPACITY_PRESETS.map((preset) => (
                <option key={preset.label} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>
      {showFillSettings && (
        <div className="tools-drawing-settings-row tools-drawing-fill-row">
          <div className="tools-drawing-row-label">Fill</div>
          <label className="tools-strip-field tools-strip-color-field">
            <span>Color</span>
            <ColorInput className="tools-drawing-color" value={drawingFillColor} aria-label="Fill color" title="Fill color" onChange={onDrawingFillColorChange} />
          </label>
          <div className="tools-strip-select-field tools-strip-fill-opacity-control">
            <strong>Opacity</strong>
            <div>
              <select
                aria-label="Drawing fill opacity"
                title="Drawing fill opacity"
                value={drawingFillOpacity === 0 ? "0" : getPresetSelectValue(DRAWING_OPACITY_PRESETS, drawingFillOpacity, false)}
                onChange={(event) => onDrawingFillOpacityChange(Number(event.target.value))}
              >
                <option value={0}>None</option>
                {DRAWING_OPACITY_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {templateToolActive && (
        <div className="tools-drawing-settings-row tools-template-size-row">
          <div className="tools-drawing-row-label">Size</div>
          <div className="tools-strip-select-field tools-strip-template-size-control">
            <strong>Length/Radius</strong>
            <div>
              <select
                aria-label="Template length or radius"
                title="Template length or radius"
                value={String(drawingTemplateSize)}
                onChange={(event) => {
                  const value = event.target.value;
                  onDrawingTemplateSizeChange(value === "custom" ? "custom" : (Number(value) as DrawingTemplateSize));
                }}
              >
                {TEMPLATE_SIZE_PRESETS.map((size) => (
                  <option key={size} value={size}>{size === "custom" ? "Custom" : `${size} ft`}</option>
                ))}
              </select>
            </div>
          </div>
          {activeDrawingTool === "template-line" && (
            <div className="tools-strip-select-field tools-strip-template-width-control">
              <strong>Width</strong>
              <div>
                <select aria-label="Template line width" title="Template line width" value={drawingTemplateWidth} onChange={(event) => onDrawingTemplateWidthChange(Number(event.target.value) as DrawingTemplateWidth)}>
                  {TEMPLATE_WIDTH_PRESETS.map((width) => (
                    <option key={width.value} value={width.value}>{width.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
      {templateToolActive && onTemplatePreviewVisibleInPlayerChange && (
        <div className="tools-drawing-settings-row tools-template-player-preview-row">
          <div className="tools-drawing-row-label">Player</div>
          <SettingsCheckbox label="Live Preview" checked={templatePreviewVisibleInPlayer} onChange={onTemplatePreviewVisibleInPlayerChange} />
        </div>
      )}
      {(drawingThicknessCustomOpen || !hasPresetValue(thicknessPresets, drawingStrokeWidth)) && (
        <div className="tools-strip-advanced-slider tools-strip-thickness-slider">
          <input aria-label={`Fine tune ${templateToolActive ? "template" : "drawing"} thickness`} title={`Fine tune ${templateToolActive ? "template" : "drawing"} thickness`} type="range" min={thicknessMin} max={400} step={4} value={drawingStrokeWidth} onChange={(event) => onDrawingStrokeWidthChange(Number(event.target.value))} />
          <span aria-label={`${thicknessInputLabel} ${drawingStrokeWidth} pixels`}>{drawingStrokeWidth}px</span>
        </div>
      )}
      {(drawingOpacityCustomOpen || !hasPresetValue(DRAWING_OPACITY_PRESETS, drawingOpacity)) && (
        <div className="tools-strip-advanced-slider tools-strip-opacity-slider">
          <input aria-label="Fine tune drawing opacity" title="Fine tune drawing opacity" type="range" min={0.15} max={1} step={0.05} value={drawingOpacity} onChange={(event) => onDrawingOpacityChange(Number(event.target.value))} />
          <span aria-label={`Drawing opacity ${Math.round(drawingOpacity * 100)} percent`}>{Math.round(drawingOpacity * 100)}%</span>
        </div>
      )}
    </div>
  );
}
function SettingsCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="tools-selector-filter">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
