import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState
} from "react";
import { GripVertical, X } from "lucide-react";
import type { EnvironmentEffectType, Scene } from "../../../shared/localvtt";
import { AcidEffectTuningPanel, ArcaneEffectTuningPanel, ChaosEffectTuningPanel, ColdEffectTuningPanel, DarknessEffectTuningPanel, DistortionEffectTuningPanel, FireEffectTuningPanel, FogEffectTuningPanel, ForceFieldEffectTuningPanel, LavaEffectTuningPanel, LightningEffectTuningPanel, NatureEffectTuningPanel, PoisonEffectTuningPanel, RadiantEffectTuningPanel, ShockwaveEffectTuningPanel, SmokeEffectTuningPanel, VoidEffectTuningPanel, WaterEffectTuningPanel } from "../tools";
import { DEFAULT_ACID_EFFECT_TUNING, DEFAULT_ARCANE_EFFECT_TUNING, DEFAULT_CHAOS_EFFECT_TUNING, DEFAULT_COLD_EFFECT_TUNING, DEFAULT_DARKNESS_EFFECT_TUNING, DEFAULT_DISTORTION_EFFECT_TUNING, DEFAULT_FIRE_EFFECT_TUNING, DEFAULT_FOG_EFFECT_TUNING, DEFAULT_FORCE_FIELD_EFFECT_TUNING, DEFAULT_LAVA_EFFECT_TUNING, DEFAULT_LIGHTNING_EFFECT_TUNING, DEFAULT_NATURE_EFFECT_TUNING, DEFAULT_POISON_EFFECT_TUNING, DEFAULT_RADIANT_EFFECT_TUNING, DEFAULT_SHOCKWAVE_EFFECT_TUNING, DEFAULT_SMOKE_EFFECT_TUNING, DEFAULT_VOID_EFFECT_TUNING, DEFAULT_WATER_EFFECT_TUNING, type AcidEffectTuning, type ArcaneEffectTuning, type ChaosEffectTuning, type ColdEffectTuning, type DarknessEffectTuning, type DistortionEffectTuning, type FireEffectTuning, type FogEffectTuning, type ForceFieldEffectTuning, type LavaEffectTuning, type LightningEffectTuning, type NatureEffectTuning, type PoisonEffectTuning, type RadiantEffectTuning, type ShockwaveEffectTuning, type SmokeEffectTuning, type VoidEffectTuning, type WaterEffectTuning } from "../../canvas/effects";
import { ENVIRONMENT_EFFECT_FEATHER_OPTIONS, ENVIRONMENT_EFFECT_OPTIONS, applyEnvironmentEffectPreset, formatEnvironmentEffectOptionLabel, getEnvironmentEffectFeatherSelectValue, getEnvironmentEffectPresetOptions, getEnvironmentEffectPresetSelectValue } from "../../lib/environmentEffectOptions";

export function EnvironmentEffectEditorModal({
  effect,
  position,
  onClose,
  onPositionChange,
  onAcidTuningChange,
  onAcidTuningReset,
  onColdTuningChange,
  onColdTuningReset,
  onDarknessTuningChange,
  onDarknessTuningReset,
  onPoisonTuningChange,
  onPoisonTuningReset,
  onWaterTuningChange,
  onWaterTuningReset,
  onLavaTuningChange,
  onLavaTuningReset,
  onFireTuningChange,
  onFireTuningReset,
  onLightningTuningChange,
  onLightningTuningReset,
  onArcaneTuningChange,
  onArcaneTuningReset,
  onChaosTuningChange,
  onChaosTuningReset,
  onVoidTuningChange,
  onVoidTuningReset,
  onNatureTuningChange,
  onNatureTuningReset,
  onDistortionTuningChange,
  onDistortionTuningReset,
  onRadiantTuningChange,
  onRadiantTuningReset,
  onForceFieldTuningChange,
  onForceFieldTuningReset,
  onShockwaveTuningChange,
  onShockwaveTuningReset,
  onSmokeTuningChange,
  onSmokeTuningReset,
  onFogTuningChange,
  onFogTuningReset,
  onFeatherChange,
  onEffectTypeChange
}: {
  effect: Scene["environment"]["effects"][number];
  position: { x: number; y: number } | null;
  onClose: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onAcidTuningChange: (tuning: AcidEffectTuning) => void;
  onAcidTuningReset: () => void;
  onColdTuningChange: (tuning: ColdEffectTuning) => void;
  onColdTuningReset: () => void;
  onDarknessTuningChange: (tuning: DarknessEffectTuning) => void;
  onDarknessTuningReset: () => void;
  onPoisonTuningChange: (tuning: PoisonEffectTuning) => void;
  onPoisonTuningReset: () => void;
  onWaterTuningChange: (tuning: WaterEffectTuning) => void;
  onWaterTuningReset: () => void;
  onLavaTuningChange: (tuning: LavaEffectTuning) => void;
  onLavaTuningReset: () => void;
  onFireTuningChange: (tuning: FireEffectTuning) => void;
  onFireTuningReset: () => void;
  onLightningTuningChange: (tuning: LightningEffectTuning) => void;
  onLightningTuningReset: () => void;
  onArcaneTuningChange: (tuning: ArcaneEffectTuning) => void;
  onArcaneTuningReset: () => void;
  onChaosTuningChange: (tuning: ChaosEffectTuning) => void;
  onChaosTuningReset: () => void;
  onVoidTuningChange: (tuning: VoidEffectTuning) => void;
  onVoidTuningReset: () => void;
  onNatureTuningChange: (tuning: NatureEffectTuning) => void;
  onNatureTuningReset: () => void;
  onDistortionTuningChange: (tuning: DistortionEffectTuning) => void;
  onDistortionTuningReset: () => void;
  onRadiantTuningChange: (tuning: RadiantEffectTuning) => void;
  onRadiantTuningReset: () => void;
  onForceFieldTuningChange: (tuning: ForceFieldEffectTuning) => void;
  onForceFieldTuningReset: () => void;
  onShockwaveTuningChange: (tuning: ShockwaveEffectTuning) => void;
  onShockwaveTuningReset: () => void;
  onSmokeTuningChange: (tuning: SmokeEffectTuning) => void;
  onSmokeTuningReset: () => void;
  onFogTuningChange: (tuning: FogEffectTuning) => void;
  onFogTuningReset: () => void;
  onFeatherChange: (feather: number) => void;
  onEffectTypeChange: (effectType: EnvironmentEffectType) => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const label = effect.name?.trim() || `${formatEnvironmentEffectOptionLabel(effect.effect)} Effect`;
  const style = position ? ({ left: position.x, top: position.y } as CSSProperties) : undefined;
  const activeAcidTuning = { ...DEFAULT_ACID_EFFECT_TUNING, ...(effect.acidTuning ?? {}) };
  const activeColdTuning = { ...DEFAULT_COLD_EFFECT_TUNING, ...(effect.coldTuning ?? {}) };
  const activeDarknessTuning = { ...DEFAULT_DARKNESS_EFFECT_TUNING, ...(effect.darknessTuning ?? {}) };
  const activePoisonTuning = { ...DEFAULT_POISON_EFFECT_TUNING, ...(effect.poisonTuning ?? {}) };
  const activeWaterTuning = { ...DEFAULT_WATER_EFFECT_TUNING, ...(effect.waterTuning ?? {}) };
  const activeLavaTuning = { ...DEFAULT_LAVA_EFFECT_TUNING, ...(effect.lavaTuning ?? {}) };
  const activeFireTuning = { ...DEFAULT_FIRE_EFFECT_TUNING, ...(effect.fireTuning ?? {}) };
  const activeLightningTuning = { ...DEFAULT_LIGHTNING_EFFECT_TUNING, ...(effect.lightningTuning ?? {}) };
  const activeArcaneTuning = { ...DEFAULT_ARCANE_EFFECT_TUNING, ...(effect.arcaneTuning ?? {}) };
  const activeChaosTuning = { ...DEFAULT_CHAOS_EFFECT_TUNING, ...(effect.chaosTuning ?? {}) };
  const activeVoidTuning = { ...DEFAULT_VOID_EFFECT_TUNING, ...(effect.voidTuning ?? {}) };
  const activeNatureTuning = { ...DEFAULT_NATURE_EFFECT_TUNING, ...(effect.natureTuning ?? {}) };
  const activeDistortionTuning = { ...DEFAULT_DISTORTION_EFFECT_TUNING, ...(effect.distortionTuning ?? {}) };
  const activeRadiantTuning = { ...DEFAULT_RADIANT_EFFECT_TUNING, ...(effect.radiantTuning ?? {}) };
  const activeForceFieldTuning = { ...DEFAULT_FORCE_FIELD_EFFECT_TUNING, ...(effect.fieldTuning ?? {}) };
  const activeShockwaveTuning = { ...DEFAULT_SHOCKWAVE_EFFECT_TUNING, ...(effect.shockwaveTuning ?? {}) };
  const activeSmokeTuning = { ...DEFAULT_SMOKE_EFFECT_TUNING, ...(effect.smokeTuning ?? {}) };
  const activeFogTuning = { ...DEFAULT_FOG_EFFECT_TUNING, ...(effect.fogTuning ?? {}) };
  const defaultPresetValue = getEnvironmentEffectPresetSelectValue(effect.effect, activeAcidTuning, activeColdTuning, activeDarknessTuning, activePoisonTuning, activeWaterTuning, activeLavaTuning, activeFireTuning, activeLightningTuning, activeArcaneTuning, activeChaosTuning, activeVoidTuning, activeNatureTuning, activeDistortionTuning, activeRadiantTuning, activeForceFieldTuning, activeShockwaveTuning, activeSmokeTuning, activeFogTuning);
  const [presetSelection, setPresetSelection] = useState(() => ({ effectId: effect.id, value: defaultPresetValue }));
  const presetValue = presetSelection.effectId === effect.id ? presetSelection.value : defaultPresetValue;
  const resetActiveTuning = () => {
    if (presetValue !== "custom") {
      applyEnvironmentEffectPreset(effect.effect, presetValue, {
        onAcidEffectTuningChange: onAcidTuningChange,
        onColdEffectTuningChange: onColdTuningChange,
        onDarknessEffectTuningChange: onDarknessTuningChange,
        onPoisonEffectTuningChange: onPoisonTuningChange,
        onWaterEffectTuningChange: onWaterTuningChange,
        onLavaEffectTuningChange: onLavaTuningChange,
        onFireEffectTuningChange: onFireTuningChange,
        onLightningEffectTuningChange: onLightningTuningChange,
        onArcaneEffectTuningChange: onArcaneTuningChange,
        onChaosEffectTuningChange: onChaosTuningChange,
        onVoidEffectTuningChange: onVoidTuningChange,
        onNatureEffectTuningChange: onNatureTuningChange,
        onDistortionEffectTuningChange: onDistortionTuningChange,
        onRadiantEffectTuningChange: onRadiantTuningChange,
        onForceFieldEffectTuningChange: onForceFieldTuningChange,
        onShockwaveEffectTuningChange: onShockwaveTuningChange,
        onSmokeEffectTuningChange: onSmokeTuningChange,
        onFogEffectTuningChange: onFogTuningChange
      });
      return;
    }

    if (effect.effect === "acid") {
      onAcidTuningReset();
    } else if (effect.effect === "cold") {
      onColdTuningReset();
    } else if (effect.effect === "darkness") {
      onDarknessTuningReset();
    } else if (effect.effect === "poison") {
      onPoisonTuningReset();
    } else if (effect.effect === "water") {
      onWaterTuningReset();
    } else if (effect.effect === "lava") {
      onLavaTuningReset();
    } else if (effect.effect === "fire") {
      onFireTuningReset();
    } else if (effect.effect === "electric") {
      onLightningTuningReset();
    } else if (effect.effect === "arcane") {
      onArcaneTuningReset();
    } else if (effect.effect === "chaos") {
      onChaosTuningReset();
    } else if (effect.effect === "void") {
      onVoidTuningReset();
    } else if (effect.effect === "nature") {
      onNatureTuningReset();
    } else if (effect.effect === "distortion") {
      onDistortionTuningReset();
    } else if (effect.effect === "radiant") {
      onRadiantTuningReset();
    } else if (effect.effect === "field") {
      onForceFieldTuningReset();
    } else if (effect.effect === "shockwave") {
      onShockwaveTuningReset();
    } else if (effect.effect === "smoke") {
      onSmokeTuningReset();
    } else if (effect.effect === "fog") {
      onFogTuningReset();
    }
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = modalRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top
    };
    onPositionChange(clampEnvironmentEffectEditorPosition(bounds.left, bounds.top, bounds));
  };

  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    const bounds = modalRef.current?.getBoundingClientRect();
    if (!dragState || dragState.pointerId !== event.pointerId || !bounds) {
      return;
    }
    onPositionChange(clampEnvironmentEffectEditorPosition(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY, bounds));
  };

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <section
      ref={modalRef}
      className={position ? "environment-effect-editor-modal environment-effect-editor-modal-positioned" : "environment-effect-editor-modal"}
      style={style}
      role="dialog"
      aria-labelledby="environment-effect-editor-title"
    >
      <div
        className="environment-effect-editor-header"
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div className="environment-effect-editor-title">
          <GripVertical size={15} aria-hidden="true" />
          <div>
            <h2 id="environment-effect-editor-title">Edit Animated Effect</h2>
            <p title={label}>{label}</p>
          </div>
        </div>
        <div className="environment-effect-editor-actions" onPointerDown={(event) => event.stopPropagation()}>
          <button className="icon-button" type="button" aria-label="Close edit effect" title="Close" onClick={onClose}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="environment-effect-editor-body">
        <div className="tools-section-label">Settings</div>
        <div className="tools-effect-select-row">
          <div className="tools-strip-select-field">
            <strong>Effect</strong>
            <div>
              <select
                aria-label="Animated effect type"
                title="Animated effect type"
                value={effect.effect}
                onChange={(event) => {
                  setPresetSelection({ effectId: effect.id, value: "custom" });
                  onEffectTypeChange(event.target.value as EnvironmentEffectType);
                }}
              >
                {ENVIRONMENT_EFFECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="tools-strip-select-field">
            <strong>Preset</strong>
            <div>
              <select
                aria-label={`${formatEnvironmentEffectOptionLabel(effect.effect)} effect preset`}
                title={`${formatEnvironmentEffectOptionLabel(effect.effect)} effect preset`}
                value={presetValue}
                onChange={(event) => {
                  const nextPreset = event.target.value;
                  setPresetSelection({ effectId: effect.id, value: nextPreset });
                  if (nextPreset === "custom") {
                    return;
                  }
                  applyEnvironmentEffectPreset(effect.effect, nextPreset, {
                    onAcidEffectTuningChange: onAcidTuningChange,
                    onColdEffectTuningChange: onColdTuningChange,
                    onDarknessEffectTuningChange: onDarknessTuningChange,
                    onPoisonEffectTuningChange: onPoisonTuningChange,
                    onWaterEffectTuningChange: onWaterTuningChange,
                    onLavaEffectTuningChange: onLavaTuningChange,
                    onFireEffectTuningChange: onFireTuningChange,
                    onLightningEffectTuningChange: onLightningTuningChange,
                    onArcaneEffectTuningChange: onArcaneTuningChange,
                    onChaosEffectTuningChange: onChaosTuningChange,
                    onVoidEffectTuningChange: onVoidTuningChange,
                    onNatureEffectTuningChange: onNatureTuningChange,
                    onDistortionEffectTuningChange: onDistortionTuningChange,
                    onRadiantEffectTuningChange: onRadiantTuningChange,
                    onForceFieldEffectTuningChange: onForceFieldTuningChange,
                    onShockwaveEffectTuningChange: onShockwaveTuningChange,
                    onSmokeEffectTuningChange: onSmokeTuningChange,
                    onFogEffectTuningChange: onFogTuningChange
                  });
                }}
              >
                {getEnvironmentEffectPresetOptions(effect.effect).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="tools-effect-select-row tools-effect-select-row-single">
          <div className="tools-strip-select-field">
            <strong>Feather</strong>
            <div>
              <select
                aria-label="Animated effect feather"
                title="Animated effect feather"
                value={getEnvironmentEffectFeatherSelectValue(effect.feather ?? 0)}
                onChange={(event) => onFeatherChange(Number(event.target.value))}
              >
                {ENVIRONMENT_EFFECT_FEATHER_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="tools-section-divider" />
        {effect.effect === "acid" ? (
          <AcidEffectTuningPanel
            key={effect.id}
            tuning={activeAcidTuning}
            defaultOpen
            onChange={onAcidTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "cold" ? (
          <ColdEffectTuningPanel
            key={effect.id}
            tuning={activeColdTuning}
            defaultOpen
            onChange={onColdTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "darkness" ? (
          <DarknessEffectTuningPanel
            key={effect.id}
            tuning={activeDarknessTuning}
            defaultOpen
            onChange={onDarknessTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "poison" ? (
          <PoisonEffectTuningPanel
            key={effect.id}
            tuning={activePoisonTuning}
            defaultOpen
            onChange={onPoisonTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "water" ? (
          <WaterEffectTuningPanel
            key={effect.id}
            tuning={activeWaterTuning}
            defaultOpen
            onChange={onWaterTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "lava" ? (
          <LavaEffectTuningPanel
            key={effect.id}
            tuning={activeLavaTuning}
            defaultOpen
            onChange={onLavaTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "fire" ? (
          <FireEffectTuningPanel
            key={effect.id}
            tuning={activeFireTuning}
            defaultOpen
            onChange={onFireTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "electric" ? (
          <LightningEffectTuningPanel
            key={effect.id}
            tuning={activeLightningTuning}
            defaultOpen
            onChange={onLightningTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "arcane" ? (
          <ArcaneEffectTuningPanel
            key={effect.id}
            tuning={activeArcaneTuning}
            defaultOpen
            onChange={onArcaneTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "chaos" ? (
          <ChaosEffectTuningPanel
            key={effect.id}
            tuning={activeChaosTuning}
            defaultOpen
            onChange={onChaosTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "void" ? (
          <VoidEffectTuningPanel
            key={effect.id}
            tuning={activeVoidTuning}
            defaultOpen
            onChange={onVoidTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "nature" ? (
          <NatureEffectTuningPanel
            key={effect.id}
            tuning={activeNatureTuning}
            defaultOpen
            onChange={onNatureTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "distortion" ? (
          <DistortionEffectTuningPanel
            key={effect.id}
            tuning={activeDistortionTuning}
            defaultOpen
            onChange={onDistortionTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "radiant" ? (
          <RadiantEffectTuningPanel
            key={effect.id}
            tuning={activeRadiantTuning}
            defaultOpen
            onChange={onRadiantTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "field" ? (
          <ForceFieldEffectTuningPanel
            key={effect.id}
            tuning={activeForceFieldTuning}
            defaultOpen
            onChange={onForceFieldTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "shockwave" ? (
          <ShockwaveEffectTuningPanel
            key={effect.id}
            tuning={activeShockwaveTuning}
            defaultOpen
            onChange={onShockwaveTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "smoke" ? (
          <SmokeEffectTuningPanel
            key={effect.id}
            tuning={activeSmokeTuning}
            defaultOpen
            onChange={onSmokeTuningChange}
            onReset={resetActiveTuning}
          />
        ) : effect.effect === "fog" ? (
          <FogEffectTuningPanel
            key={effect.id}
            tuning={activeFogTuning}
            defaultOpen
            onChange={onFogTuningChange}
            onReset={resetActiveTuning}
          />
        ) : (
          <div className="layer-empty-state">
            <strong>No Editable Settings</strong>
            <span>{formatEnvironmentEffectOptionLabel(effect.effect)} effects do not have advanced controls yet.</span>
          </div>
        )}
        <div className="button-row modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </section>
  );
}

function clampEnvironmentEffectEditorPosition(x: number, y: number, bounds: DOMRect): { x: number; y: number } {
  const margin = 12;
  return {
    x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - bounds.width - margin)),
    y: Math.min(Math.max(margin, y), Math.max(margin, window.innerHeight - bounds.height - margin))
  };
}
