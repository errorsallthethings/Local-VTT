import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Undo2 } from "lucide-react";
import type {
  AcidEffectTuning,
  ArcaneEffectTuning,
  ChaosEffectTuning,
  ColdEffectTuning,
  DarknessEffectTuning,
  DistortionEffectTuning,
  FireEffectTuning,
  FogEffectTuning,
  ForceFieldEffectTuning,
  LavaEffectTuning,
  LightningEffectTuning,
  NatureEffectTuning,
  PoisonEffectTuning,
  RadiantEffectTuning,
  ShockwaveEffectTuning,
  SmokeEffectTuning,
  VoidEffectTuning,
  WaterEffectTuning
} from "../../canvas/environmentEffectsRenderer";
import { ColorInput } from "../controls/ColorPickerField";

export function WaterEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: WaterEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: WaterEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<WaterEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Water effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset water tuning" aria-label="Reset water tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Band Scale" value={tuning.bandScale} min={0.5} max={20} step={0.1} onChange={(bandScale) => update({ bandScale })} />
            <WaterTuningSlider label="Band Width" value={tuning.bandWidth} min={0.01} max={0.49} step={0.01} onChange={(bandWidth) => update({ bandWidth })} />
            <WaterTuningSlider label="Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Distortion" value={tuning.distortion} min={0} max={2} step={0.01} onChange={(distortion) => update({ distortion })} />
            <WaterTuningSlider label="Vertical Distortion" value={tuning.verticalDistortion} min={0} max={2} step={0.01} onChange={(verticalDistortion) => update({ verticalDistortion })} />
            <WaterTuningSlider label="Distortion Variation" value={tuning.distortionVariation} min={0} max={2} step={0.01} onChange={(distortionVariation) => update({ distortionVariation })} />
            <WaterTuningSlider label="Band Breakup" value={tuning.bandBreakup} min={0} max={1} step={0.01} onChange={(bandBreakup) => update({ bandBreakup })} />
            <WaterTuningSlider label="Band Variation" value={tuning.bandVariation} min={0} max={4} step={0.01} onChange={(bandVariation) => update({ bandVariation })} />
            <WaterTuningSlider label="Band Overlap" value={tuning.bandOverlap} min={0} max={1} step={0.01} onChange={(bandOverlap) => update({ bandOverlap })} />
            <WaterTuningSlider label="Zoom Scale" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Alpha" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
            <WaterTuningSlider label="Highlight Alpha" value={tuning.highlightAlpha} min={0} max={1} step={0.01} onChange={(highlightAlpha) => update({ highlightAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Deep" value={tuning.deepColor} onChange={(deepColor) => update({ deepColor })} />
            <WaterTuningColor label="Water" value={tuning.waterColor} onChange={(waterColor) => update({ waterColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy water tuning JSON" aria-label="Copy water tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AcidEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: AcidEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: AcidEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<AcidEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Acid effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset acid tuning" aria-label="Reset acid tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Acid Scale" value={tuning.acidScale} min={0.5} max={20} step={0.1} onChange={(acidScale) => update({ acidScale })} />
            <WaterTuningSlider label="Animation Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Flow Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Corrosion" value={tuning.corrosion} min={0} max={1} step={0.01} onChange={(corrosion) => update({ corrosion })} />
            <WaterTuningSlider label="Bubble Density" value={tuning.bubbleDensity} min={0} max={1} step={0.01} onChange={(bubbleDensity) => update({ bubbleDensity })} />
            <WaterTuningSlider label="Bubble Size" value={tuning.bubbleSize} min={0} max={1} step={0.01} onChange={(bubbleSize) => update({ bubbleSize })} />
            <WaterTuningSlider label="Streak Density" value={tuning.streakDensity} min={0} max={1} step={0.01} onChange={(streakDensity) => update({ streakDensity })} />
            <WaterTuningSlider label="Streak Warp" value={tuning.streakWarp} min={0} max={1} step={0.01} onChange={(streakWarp) => update({ streakWarp })} />
            <WaterTuningSlider label="Foam" value={tuning.foam} min={0} max={1} step={0.01} onChange={(foam) => update({ foam })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Dark" value={tuning.darkColor} onChange={(darkColor) => update({ darkColor })} />
            <WaterTuningColor label="Acid" value={tuning.acidColor} onChange={(acidColor) => update({ acidColor })} />
            <WaterTuningColor label="Foam" value={tuning.foamColor} onChange={(foamColor) => update({ foamColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy acid tuning JSON" aria-label="Copy acid tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function PoisonEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: PoisonEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: PoisonEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<PoisonEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Poison Cloud effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset poison cloud tuning" aria-label="Reset poison cloud tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Cloud Scale" value={tuning.cloudScale} min={0.5} max={20} step={0.1} onChange={(cloudScale) => update({ cloudScale })} />
            <WaterTuningSlider label="Drift Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Drift Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Turbulence" value={tuning.turbulence} min={0} max={2} step={0.01} onChange={(turbulence) => update({ turbulence })} />
            <WaterTuningSlider label="Cloud Density" value={tuning.density} min={0} max={1} step={0.01} onChange={(density) => update({ density })} />
            <WaterTuningSlider label="Pocket Density" value={tuning.pocketDensity} min={0} max={1} step={0.01} onChange={(pocketDensity) => update({ pocketDensity })} />
            <WaterTuningSlider label="Pocket Size" value={tuning.pocketSize} min={0} max={1} step={0.01} onChange={(pocketSize) => update({ pocketSize })} />
            <WaterTuningSlider label="Softness" value={tuning.softness} min={0} max={1} step={0.01} onChange={(softness) => update({ softness })} />
            <WaterTuningSlider label="Drift Curl" value={tuning.drift} min={0} max={1} step={0.01} onChange={(drift) => update({ drift })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Shadow" value={tuning.shadowColor} onChange={(shadowColor) => update({ shadowColor })} />
            <WaterTuningColor label="Poison" value={tuning.poisonColor} onChange={(poisonColor) => update({ poisonColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy poison cloud tuning JSON" aria-label="Copy poison cloud tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ColdEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: ColdEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: ColdEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<ColdEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Cold effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset cold tuning" aria-label="Reset cold tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Frost Scale" value={tuning.frostScale} min={0.5} max={20} step={0.1} onChange={(frostScale) => update({ frostScale })} />
            <WaterTuningSlider label="Animation Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Frost Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Vein Density" value={tuning.veinDensity} min={0} max={1} step={0.01} onChange={(veinDensity) => update({ veinDensity })} />
            <WaterTuningSlider label="Vein Width" value={tuning.veinWidth} min={0} max={1} step={0.01} onChange={(veinWidth) => update({ veinWidth })} />
            <WaterTuningSlider label="Crystal Density" value={tuning.crystalDensity} min={0} max={1} step={0.01} onChange={(crystalDensity) => update({ crystalDensity })} />
            <WaterTuningSlider label="Crystal Size" value={tuning.crystalSize} min={0} max={1} step={0.01} onChange={(crystalSize) => update({ crystalSize })} />
            <WaterTuningSlider label="Icy Haze" value={tuning.haze} min={0} max={1} step={0.01} onChange={(haze) => update({ haze })} />
            <WaterTuningSlider label="Shimmer" value={tuning.shimmer} min={0} max={1} step={0.01} onChange={(shimmer) => update({ shimmer })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Shadow" value={tuning.shadowColor} onChange={(shadowColor) => update({ shadowColor })} />
            <WaterTuningColor label="Frost" value={tuning.frostColor} onChange={(frostColor) => update({ frostColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy cold tuning JSON" aria-label="Copy cold tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function DarknessEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: DarknessEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: DarknessEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<DarknessEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Darkness effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset darkness tuning" aria-label="Reset darkness tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Shadow Scale" value={tuning.darknessScale} min={0.5} max={20} step={0.1} onChange={(darknessScale) => update({ darknessScale })} />
            <WaterTuningSlider label="Animation Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Drift Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Void Depth" value={tuning.depth} min={0} max={1} step={0.01} onChange={(depth) => update({ depth })} />
            <WaterTuningSlider label="Tendril Density" value={tuning.tendrilDensity} min={0} max={1} step={0.01} onChange={(tendrilDensity) => update({ tendrilDensity })} />
            <WaterTuningSlider label="Tendril Reach" value={tuning.tendrilReach} min={0} max={1} step={0.01} onChange={(tendrilReach) => update({ tendrilReach })} />
            <WaterTuningSlider label="Edge Softness" value={tuning.edgeSoftness} min={0} max={1} step={0.01} onChange={(edgeSoftness) => update({ edgeSoftness })} />
            <WaterTuningSlider label="Wisp Density" value={tuning.wispDensity} min={0} max={1} step={0.01} onChange={(wispDensity) => update({ wispDensity })} />
            <WaterTuningSlider label="Drift Curl" value={tuning.drift} min={0} max={1} step={0.01} onChange={(drift) => update({ drift })} />
            <WaterTuningSlider label="Void Highlights" value={tuning.voidHighlight} min={0} max={1} step={0.01} onChange={(voidHighlight) => update({ voidHighlight })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Shadow" value={tuning.shadowColor} onChange={(shadowColor) => update({ shadowColor })} />
            <WaterTuningColor label="Void" value={tuning.voidColor} onChange={(voidColor) => update({ voidColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy darkness tuning JSON" aria-label="Copy darkness tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function LavaEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: LavaEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: LavaEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<LavaEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Lava effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset lava tuning" aria-label="Reset lava tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Flow Scale" value={tuning.flowScale} min={0.5} max={20} step={0.1} onChange={(flowScale) => update({ flowScale })} />
            <WaterTuningSlider label="Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Distortion" value={tuning.distortion} min={0} max={2} step={0.01} onChange={(distortion) => update({ distortion })} />
            <WaterTuningSlider label="Crust" value={tuning.crust} min={0} max={1} step={0.01} onChange={(crust) => update({ crust })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Ember" value={tuning.ember} min={0} max={1} step={0.01} onChange={(ember) => update({ ember })} />
            <WaterTuningSlider label="Zoom Scale" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Alpha" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Dark" value={tuning.darkColor} onChange={(darkColor) => update({ darkColor })} />
            <WaterTuningColor label="Lava" value={tuning.lavaColor} onChange={(lavaColor) => update({ lavaColor })} />
            <WaterTuningColor label="Hot" value={tuning.hotColor} onChange={(hotColor) => update({ hotColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy lava tuning JSON" aria-label="Copy lava tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function FireEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: FireEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: FireEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<FireEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Fire effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset fire tuning" aria-label="Reset fire tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Flame Scale" value={tuning.flameScale} min={0.5} max={20} step={0.1} onChange={(flameScale) => update({ flameScale })} />
            <WaterTuningSlider label="Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Turbulence" value={tuning.turbulence} min={0} max={2} step={0.01} onChange={(turbulence) => update({ turbulence })} />
            <WaterTuningSlider label="Tongues" value={tuning.tongues} min={0} max={1} step={0.01} onChange={(tongues) => update({ tongues })} />
            <WaterTuningSlider label="Distortion" value={tuning.tongueVariation} min={0} max={1} step={0.01} onChange={(tongueVariation) => update({ tongueVariation })} />
            <WaterTuningSlider label="Breakup" value={tuning.breakup} min={0} max={1} step={0.01} onChange={(breakup) => update({ breakup })} />
            <WaterTuningSlider label="Flame Stretch" value={tuning.flameStretch} min={0} max={1} step={0.01} onChange={(flameStretch) => update({ flameStretch })} />
            <WaterTuningSlider label="Flicker" value={tuning.flicker} min={0} max={1} step={0.01} onChange={(flicker) => update({ flicker })} />
            <WaterTuningSlider label="Ember" value={tuning.ember} min={0} max={1} step={0.01} onChange={(ember) => update({ ember })} />
            <WaterTuningSlider label="Heat" value={tuning.heat} min={0} max={1} step={0.01} onChange={(heat) => update({ heat })} />
            <WaterTuningSlider label="Zoom Scale" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Alpha" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Ember" value={tuning.emberColor} onChange={(emberColor) => update({ emberColor })} />
            <WaterTuningColor label="Flame" value={tuning.flameColor} onChange={(flameColor) => update({ flameColor })} />
            <WaterTuningColor label="Hot" value={tuning.hotColor} onChange={(hotColor) => update({ hotColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy fire tuning JSON" aria-label="Copy fire tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function LightningEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: LightningEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: LightningEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<LightningEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Electric effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset electric tuning" aria-label="Reset electric tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Arc Scale" value={tuning.arcScale} min={0.5} max={20} step={0.1} onChange={(arcScale) => update({ arcScale })} />
            <WaterTuningSlider label="Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Density" value={tuning.boltDensity} min={0} max={1} step={0.01} onChange={(boltDensity) => update({ boltDensity })} />
            <WaterTuningSlider label="Branches" value={tuning.branchiness} min={0} max={1} step={0.01} onChange={(branchiness) => update({ branchiness })} />
            <WaterTuningSlider label="Jitter" value={tuning.jitter} min={0} max={1} step={0.01} onChange={(jitter) => update({ jitter })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Width" value={tuning.strikeWidth} min={0} max={1} step={0.01} onChange={(strikeWidth) => update({ strikeWidth })} />
            <WaterTuningSlider label="Segment Breaks" value={tuning.segmentBreaks} min={0} max={1} step={0.01} onChange={(segmentBreaks) => update({ segmentBreaks })} />
            <WaterTuningSlider label="Zoom Scale" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Alpha" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Arc" value={tuning.arcColor} onChange={(arcColor) => update({ arcColor })} />
            <WaterTuningColor label="Core" value={tuning.coreColor} onChange={(coreColor) => update({ coreColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy electric tuning JSON" aria-label="Copy electric tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ArcaneEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: ArcaneEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: ArcaneEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<ArcaneEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Arcane effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset arcane tuning" aria-label="Reset arcane tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Rune Frequency" value={tuning.glyphScale} min={0.5} max={20} step={0.1} onChange={(glyphScale) => update({ glyphScale })} />
            <WaterTuningSlider label="Animation Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Spin Speed" value={tuning.rotationSpeed} min={-2} max={2} step={0.01} onChange={(rotationSpeed) => update({ rotationSpeed })} />
            <WaterTuningSlider label="Rune Amount" value={tuning.glyphDensity} min={0} max={1} step={0.01} onChange={(glyphDensity) => update({ glyphDensity })} />
            <WaterTuningSlider label="Circle Strength" value={tuning.ringDensity} min={0} max={1} step={0.01} onChange={(ringDensity) => update({ ringDensity })} />
            <WaterTuningSlider label="Circle Detail" value={tuning.circleScale} min={1} max={20} step={0.1} onChange={(circleScale) => update({ circleScale })} />
            <WaterTuningSlider label="Spoke Amount" value={tuning.spokeAmount} min={0} max={1} step={0.01} onChange={(spokeAmount) => update({ spokeAmount })} />
            <WaterTuningSlider label="Pulse Strength" value={tuning.pulse} min={0} max={1} step={0.01} onChange={(pulse) => update({ pulse })} />
            <WaterTuningSlider label="Rune Drift" value={tuning.drift} min={0} max={1} step={0.01} onChange={(drift) => update({ drift })} />
            <WaterTuningSlider label="Glow Strength" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Stroke Width" value={tuning.lineWidth} min={0} max={1} step={0.01} onChange={(lineWidth) => update({ lineWidth })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Background" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Runes" value={tuning.glyphColor} onChange={(glyphColor) => update({ glyphColor })} />
            <WaterTuningColor label="Glow" value={tuning.glowColor} onChange={(glowColor) => update({ glowColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy arcane tuning JSON" aria-label="Copy arcane tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ChaosEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: ChaosEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: ChaosEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<ChaosEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Chaos Field effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset chaos field tuning" aria-label="Reset chaos field tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Chaos Scale" value={tuning.chaosScale} min={0.5} max={20} step={0.1} onChange={(chaosScale) => update({ chaosScale })} />
            <WaterTuningSlider label="Animation Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Drift Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Rift Density" value={tuning.riftDensity} min={0} max={1} step={0.01} onChange={(riftDensity) => update({ riftDensity })} />
            <WaterTuningSlider label="Rift Warp" value={tuning.riftWarp} min={0} max={1} step={0.01} onChange={(riftWarp) => update({ riftWarp })} />
            <WaterTuningSlider label="Mote Count" value={tuning.moteDensity} min={0} max={1} step={0.01} onChange={(moteDensity) => update({ moteDensity })} />
            <WaterTuningSlider label="Mote Size" value={tuning.moteSize} min={0} max={5} step={0.05} onChange={(moteSize) => update({ moteSize })} />
            <WaterTuningSlider label="Color Shift" value={tuning.colorShift} min={0} max={1} step={0.01} onChange={(colorShift) => update({ colorShift })} />
            <WaterTuningSlider label="Pulse" value={tuning.pulse} min={0} max={1} step={0.01} onChange={(pulse) => update({ pulse })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Instability" value={tuning.instability} min={0} max={1} step={0.01} onChange={(instability) => update({ instability })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Background Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Rifts" value={tuning.riftColor} onChange={(riftColor) => update({ riftColor })} />
            <WaterTuningColor label="Motes" value={tuning.moteColor} onChange={(moteColor) => update({ moteColor })} />
            <WaterTuningColor label="Accent" value={tuning.accentColor} onChange={(accentColor) => update({ accentColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy chaos field tuning JSON" aria-label="Copy chaos field tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function VoidEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: VoidEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: VoidEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<VoidEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Void Tendrils effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset void tendrils tuning" aria-label="Reset void tendrils tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Tendril Scale" value={tuning.tendrilScale} min={0.5} max={20} step={0.1} onChange={(tendrilScale) => update({ tendrilScale })} />
            <WaterTuningSlider label="Animation Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Drift Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Tendril Density" value={tuning.tendrilDensity} min={0} max={1} step={0.01} onChange={(tendrilDensity) => update({ tendrilDensity })} />
            <WaterTuningSlider label="Tendril Width" value={tuning.tendrilWidth} min={0} max={1} step={0.01} onChange={(tendrilWidth) => update({ tendrilWidth })} />
            <WaterTuningSlider label="Curl" value={tuning.curl} min={0} max={1} step={0.01} onChange={(curl) => update({ curl })} />
            <WaterTuningSlider label="Reach" value={tuning.reach} min={0} max={1} step={0.01} onChange={(reach) => update({ reach })} />
            <WaterTuningSlider label="Void Depth" value={tuning.voidDepth} min={0} max={1} step={0.01} onChange={(voidDepth) => update({ voidDepth })} />
            <WaterTuningSlider label="Mote Count" value={tuning.moteDensity} min={0} max={1} step={0.01} onChange={(moteDensity) => update({ moteDensity })} />
            <WaterTuningSlider label="Mote Size" value={tuning.moteSize} min={0} max={5} step={0.05} onChange={(moteSize) => update({ moteSize })} />
            <WaterTuningSlider label="Pulse" value={tuning.pulse} min={0} max={1} step={0.01} onChange={(pulse) => update({ pulse })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Instability" value={tuning.instability} min={0} max={1} step={0.01} onChange={(instability) => update({ instability })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Background Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Tendrils" value={tuning.tendrilColor} onChange={(tendrilColor) => update({ tendrilColor })} />
            <WaterTuningColor label="Void" value={tuning.voidColor} onChange={(voidColor) => update({ voidColor })} />
            <WaterTuningColor label="Accent" value={tuning.accentColor} onChange={(accentColor) => update({ accentColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy void tendrils tuning JSON" aria-label="Copy void tendrils tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function NatureEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: NatureEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: NatureEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<NatureEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Nature Growth effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset nature growth tuning" aria-label="Reset nature growth tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Vine Scale" value={tuning.vineScale} min={0.5} max={20} step={0.1} onChange={(vineScale) => update({ vineScale })} />
            <WaterTuningSlider label="Animation Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Growth Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Vine Density" value={tuning.vineDensity} min={0} max={1} step={0.01} onChange={(vineDensity) => update({ vineDensity })} />
            <WaterTuningSlider label="Vine Width" value={tuning.vineWidth} min={0} max={1} step={0.01} onChange={(vineWidth) => update({ vineWidth })} />
            <WaterTuningSlider label="Vine Brightness" value={tuning.vineBrightness} min={0} max={2} step={0.02} onChange={(vineBrightness) => update({ vineBrightness })} />
            <WaterTuningSlider label="Curl" value={tuning.curl} min={0} max={1} step={0.01} onChange={(curl) => update({ curl })} />
            <WaterTuningSlider label="Thorn Density" value={tuning.thornDensity} min={0} max={1} step={0.01} onChange={(thornDensity) => update({ thornDensity })} />
            <WaterTuningSlider label="Thorn Size" value={tuning.thornSize} min={0} max={1} step={0.01} onChange={(thornSize) => update({ thornSize })} />
            <WaterTuningSlider label="Thorn Brightness" value={tuning.thornBrightness} min={0} max={3} step={0.03} onChange={(thornBrightness) => update({ thornBrightness })} />
            <WaterTuningSlider label="Thorn Irregularity" value={tuning.thornIrregularity} min={0} max={1} step={0.01} onChange={(thornIrregularity) => update({ thornIrregularity })} />
            <WaterTuningSlider label="Leaf Density" value={tuning.leafDensity} min={0} max={1} step={0.01} onChange={(leafDensity) => update({ leafDensity })} />
            <WaterTuningSlider label="Leaf Size" value={tuning.leafSize} min={0} max={1} step={0.01} onChange={(leafSize) => update({ leafSize })} />
            <WaterTuningSlider label="Leaf Sharpness" value={tuning.leafSharpness} min={0} max={1} step={0.01} onChange={(leafSharpness) => update({ leafSharpness })} />
            <WaterTuningSlider label="Growth Motion" value={tuning.growth} min={0} max={1} step={0.01} onChange={(growth) => update({ growth })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Instability" value={tuning.instability} min={0} max={1} step={0.01} onChange={(instability) => update({ instability })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Ground Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Ground" value={tuning.soilColor} onChange={(soilColor) => update({ soilColor })} />
            <WaterTuningColor label="Vines" value={tuning.vineColor} onChange={(vineColor) => update({ vineColor })} />
            <WaterTuningColor label="Leaves" value={tuning.leafColor} onChange={(leafColor) => update({ leafColor })} />
            <WaterTuningColor label="Thorns" value={tuning.thornColor} onChange={(thornColor) => update({ thornColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy nature growth tuning JSON" aria-label="Copy nature growth tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function RadiantEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: RadiantEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: RadiantEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<RadiantEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Radiant effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset radiant tuning" aria-label="Reset radiant tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Ray Count" value={tuning.rayScale} min={0.5} max={20} step={0.1} onChange={(rayScale) => update({ rayScale })} />
            <WaterTuningSlider label="Drift Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Source Edge Position" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Ray Amount" value={tuning.rayDensity} min={0} max={1} step={0.01} onChange={(rayDensity) => update({ rayDensity })} />
            <WaterTuningSlider label="Ray Breakup" value={tuning.rayBreakup} min={0} max={1} step={0.01} onChange={(rayBreakup) => update({ rayBreakup })} />
            <WaterTuningSlider label="Source Spread" value={tuning.raySpread} min={0} max={1} step={0.01} onChange={(raySpread) => update({ raySpread })} />
            <WaterTuningSlider label="Source Distance" value={tuning.rayDistance} min={0} max={1} step={0.01} onChange={(rayDistance) => update({ rayDistance })} />
            <WaterTuningSlider label="Mote Count" value={tuning.moteDensity} min={0} max={1} step={0.01} onChange={(moteDensity) => update({ moteDensity })} />
            <WaterTuningSlider label="Mote Size" value={tuning.moteSize} min={0} max={5} step={0.05} onChange={(moteSize) => update({ moteSize })} />
            <WaterTuningSlider label="Shimmer" value={tuning.shimmer} min={0} max={1} step={0.01} onChange={(shimmer) => update({ shimmer })} />
            <WaterTuningSlider label="Bloom" value={tuning.bloom} min={0} max={1} step={0.01} onChange={(bloom) => update({ bloom })} />
            <WaterTuningSlider label="Ray Width" value={tuning.streakWidth} min={0} max={5} step={0.05} onChange={(streakWidth) => update({ streakWidth })} />
            <WaterTuningSlider label="Pulse" value={tuning.pulse} min={0} max={1} step={0.01} onChange={(pulse) => update({ pulse })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Background Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Rays" value={tuning.rayColor} onChange={(rayColor) => update({ rayColor })} />
            <WaterTuningColor label="Core" value={tuning.coreColor} onChange={(coreColor) => update({ coreColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy radiant tuning JSON" aria-label="Copy radiant tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ForceFieldEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: ForceFieldEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: ForceFieldEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<ForceFieldEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Force Field effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset force field tuning" aria-label="Reset force field tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Field Scale" value={tuning.fieldScale} min={0.5} max={20} step={0.1} onChange={(fieldScale) => update({ fieldScale })} />
            <WaterTuningSlider label="Drift Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Grid Density" value={tuning.gridDensity} min={0} max={1} step={0.01} onChange={(gridDensity) => update({ gridDensity })} />
            <WaterTuningSlider label="Grid Warp" value={tuning.gridWarp} min={0} max={1} step={0.01} onChange={(gridWarp) => update({ gridWarp })} />
            <WaterTuningSlider label="Ripple Strength" value={tuning.rippleStrength} min={0} max={1} step={0.01} onChange={(rippleStrength) => update({ rippleStrength })} />
            <WaterTuningSlider label="Ripple Frequency" value={tuning.rippleFrequency} min={0} max={1} step={0.01} onChange={(rippleFrequency) => update({ rippleFrequency })} />
            <WaterTuningSlider label="Edge Strength" value={tuning.edgeStrength} min={0} max={1} step={0.01} onChange={(edgeStrength) => update({ edgeStrength })} />
            <WaterTuningSlider label="Pulse" value={tuning.pulse} min={0} max={1} step={0.01} onChange={(pulse) => update({ pulse })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Refraction" value={tuning.refraction} min={0} max={1} step={0.01} onChange={(refraction) => update({ refraction })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Background Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Grid" value={tuning.gridColor} onChange={(gridColor) => update({ gridColor })} />
            <WaterTuningColor label="Edge" value={tuning.edgeColor} onChange={(edgeColor) => update({ edgeColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy force field tuning JSON" aria-label="Copy force field tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ShockwaveEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: ShockwaveEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: ShockwaveEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<ShockwaveEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Shockwave effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset shockwave tuning" aria-label="Reset shockwave tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Ring Scale" value={tuning.ringScale} min={0.5} max={20} step={0.1} onChange={(ringScale) => update({ ringScale })} />
            <WaterTuningSlider label="Pulse Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Drift Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Ring Count" value={tuning.ringCount} min={0} max={1} step={0.01} onChange={(ringCount) => update({ ringCount })} />
            <WaterTuningSlider label="Ring Width" value={tuning.ringWidth} min={0} max={1} step={0.01} onChange={(ringWidth) => update({ ringWidth })} />
            <WaterTuningSlider label="Ring Sharpness" value={tuning.ringSharpness} min={0} max={1} step={0.01} onChange={(ringSharpness) => update({ ringSharpness })} />
            <WaterTuningSlider label="Distortion" value={tuning.distortion} min={0} max={1} step={0.01} onChange={(distortion) => update({ distortion })} />
            <WaterTuningSlider label="Turbulence" value={tuning.turbulence} min={0} max={1} step={0.01} onChange={(turbulence) => update({ turbulence })} />
            <WaterTuningSlider label="Center Impact" value={tuning.centerStrength} min={0} max={1} step={0.01} onChange={(centerStrength) => update({ centerStrength })} />
            <WaterTuningSlider label="Edge Fade" value={tuning.fade} min={0} max={1} step={0.01} onChange={(fade) => update({ fade })} />
            <WaterTuningSlider label="Pulse" value={tuning.pulse} min={0} max={1} step={0.01} onChange={(pulse) => update({ pulse })} />
            <WaterTuningSlider label="Glow" value={tuning.glow} min={0} max={1} step={0.01} onChange={(glow) => update({ glow })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Background Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Rings" value={tuning.ringColor} onChange={(ringColor) => update({ ringColor })} />
            <WaterTuningColor label="Core" value={tuning.coreColor} onChange={(coreColor) => update({ coreColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy shockwave tuning JSON" aria-label="Copy shockwave tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function DistortionEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: DistortionEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: DistortionEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<DistortionEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Distortion effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset distortion tuning" aria-label="Reset distortion tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Distortion Scale" value={tuning.distortionScale} min={0.5} max={20} step={0.1} onChange={(distortionScale) => update({ distortionScale })} />
            <WaterTuningSlider label="Flow Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Flow Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Warp Strength" value={tuning.distortionStrength} min={0} max={1} step={0.01} onChange={(distortionStrength) => update({ distortionStrength })} />
            <WaterTuningSlider label="Ripple Strength" value={tuning.rippleStrength} min={0} max={1} step={0.01} onChange={(rippleStrength) => update({ rippleStrength })} />
            <WaterTuningSlider label="Ripple Frequency" value={tuning.rippleFrequency} min={0} max={1} step={0.01} onChange={(rippleFrequency) => update({ rippleFrequency })} />
            <WaterTuningSlider label="Shimmer" value={tuning.shimmer} min={0} max={1} step={0.01} onChange={(shimmer) => update({ shimmer })} />
            <WaterTuningSlider label="Turbulence" value={tuning.turbulence} min={0} max={1} step={0.01} onChange={(turbulence) => update({ turbulence })} />
            <WaterTuningSlider label="Caustic Highlights" value={tuning.causticStrength} min={0} max={1} step={0.01} onChange={(causticStrength) => update({ causticStrength })} />
            <WaterTuningSlider label="Edge Strength" value={tuning.edgeStrength} min={0} max={1} step={0.01} onChange={(edgeStrength) => update({ edgeStrength })} />
            <WaterTuningSlider label="Pulse" value={tuning.pulse} min={0} max={1} step={0.01} onChange={(pulse) => update({ pulse })} />
            <WaterTuningSlider label="Zoom Response" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Background Tint" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Background" value={tuning.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
            <WaterTuningColor label="Warp" value={tuning.distortionColor} onChange={(distortionColor) => update({ distortionColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy distortion tuning JSON" aria-label="Copy distortion tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function SmokeEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: SmokeEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: SmokeEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<SmokeEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Smoke effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset smoke tuning" aria-label="Reset smoke tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Cloud Scale" value={tuning.cloudScale} min={0.5} max={20} step={0.1} onChange={(cloudScale) => update({ cloudScale })} />
            <WaterTuningSlider label="Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Turbulence" value={tuning.turbulence} min={0} max={2} step={0.01} onChange={(turbulence) => update({ turbulence })} />
            <WaterTuningSlider label="Softness" value={tuning.softness} min={0} max={1} step={0.01} onChange={(softness) => update({ softness })} />
            <WaterTuningSlider label="Density" value={tuning.density} min={0} max={1} step={0.01} onChange={(density) => update({ density })} />
            <WaterTuningSlider label="Lift" value={tuning.lift} min={0} max={1} step={0.01} onChange={(lift) => update({ lift })} />
            <WaterTuningSlider label="Zoom Scale" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Alpha" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Shadow" value={tuning.shadowColor} onChange={(shadowColor) => update({ shadowColor })} />
            <WaterTuningColor label="Smoke" value={tuning.smokeColor} onChange={(smokeColor) => update({ smokeColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy smoke tuning JSON" aria-label="Copy smoke tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function FogEffectTuningPanel({
  tuning,
  title = "Advanced Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: FogEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: FogEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<FogEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Mist effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset mist tuning" aria-label="Reset mist tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Cloud Scale" value={tuning.cloudScale} min={0.5} max={20} step={0.1} onChange={(cloudScale) => update({ cloudScale })} />
            <WaterTuningSlider label="Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Turbulence" value={tuning.turbulence} min={0} max={2} step={0.01} onChange={(turbulence) => update({ turbulence })} />
            <WaterTuningSlider label="Softness" value={tuning.softness} min={0} max={1} step={0.01} onChange={(softness) => update({ softness })} />
            <WaterTuningSlider label="Density" value={tuning.density} min={0} max={1} step={0.01} onChange={(density) => update({ density })} />
            <WaterTuningSlider label="Lift" value={tuning.lift} min={0} max={1} step={0.01} onChange={(lift) => update({ lift })} />
            <WaterTuningSlider label="Zoom Scale" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Alpha" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Shadow" value={tuning.shadowColor} onChange={(shadowColor) => update({ shadowColor })} />
            <WaterTuningColor label="Mist" value={tuning.smokeColor} onChange={(smokeColor) => update({ smokeColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy mist tuning JSON" aria-label="Copy mist tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WaterTuningSlider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="water-tuning-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <strong>{formatTuningNumber(value)}{suffix}</strong>
    </label>
  );
}

function WaterTuningColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="water-tuning-color">
      <span>{label}</span>
      <ColorInput value={value} onChange={onChange} aria-label={`${label} water color`} />
    </label>
  );
}

function formatTuningNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
function SettingsToggle({ open, label, onToggle }: { open: boolean; label: string; onToggle: () => void }) {
  return (
    <button className="tools-settings-toggle" type="button" aria-expanded={open} onClick={onToggle}>
      {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
      <strong>{label}</strong>
    </button>
  );
}
