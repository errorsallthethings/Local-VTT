import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState
} from "react";
import { GripVertical, X } from "lucide-react";
import type { EnvironmentEffectType, Scene } from "../../../../shared/localvtt";
import { clampModalPosition, type ModalSize, useResizableModal } from "../../../hooks/useResizableModal";
import { AcidEffectTuningPanel, ArcaneEffectTuningPanel, ChaosEffectTuningPanel, ColdEffectTuningPanel, DarknessEffectTuningPanel, DistortionEffectTuningPanel, FireEffectTuningPanel, FogEffectTuningPanel, ForceFieldEffectTuningPanel, LavaEffectTuningPanel, LightningEffectTuningPanel, NatureEffectTuningPanel, PoisonEffectTuningPanel, RadiantEffectTuningPanel, ShockwaveEffectTuningPanel, SmokeEffectTuningPanel, VoidEffectTuningPanel, WaterEffectTuningPanel } from "../../tools";
import { ENVIRONMENT_EFFECT_FEATHER_OPTIONS, ENVIRONMENT_EFFECT_OPTIONS, formatEnvironmentEffectOptionLabel, getEnvironmentEffectFeatherSelectValue, getEnvironmentEffectPresetOptions } from "../../../lib/effects";
import {
  applyEnvironmentEffectEditorPreset,
  getEnvironmentEffectEditorActiveTunings,
  getEnvironmentEffectEditorDefaultPresetValue,
  getEnvironmentEffectEditorDragPosition,
  getEnvironmentEffectEditorDragStart,
  getEnvironmentEffectEditorEmptyTuningMessage,
  getEnvironmentEffectEditorLabel,
  getEnvironmentEffectEditorModalClassName,
  getEnvironmentEffectEditorPresetValue,
  resetEnvironmentEffectEditorTuning,
  type EnvironmentEffectEditorDragState,
  type EnvironmentEffectEditorTuningChangeHandlers,
  type EnvironmentEffectEditorTuningResetHandlers
} from "./environmentEffectEditorState";

export function EnvironmentEffectEditorModal({
  effect,
  position,
  size,
  onClose,
  onPositionChange,
  onSizeChange,
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
  size: ModalSize | null;
  onClose: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: ModalSize) => void;
  onFeatherChange: (feather: number) => void;
  onEffectTypeChange: (effectType: EnvironmentEffectType) => void;
} & EnvironmentEffectEditorTuningChangeHandlers & EnvironmentEffectEditorTuningResetHandlers) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<EnvironmentEffectEditorDragState | null>(null);
  const label = getEnvironmentEffectEditorLabel(effect);
  const { resize, startResize, stopResize } = useResizableModal({
    elementRef: modalRef,
    position,
    size,
    minSize: { width: 520, height: 420 },
    onPositionChange,
    onSizeChange
  });
  const style = {
    ...(position ? { left: position.x, top: position.y } : {}),
    ...(size ? { width: size.width, height: size.height } : {})
  } as CSSProperties;
  const activeTunings = getEnvironmentEffectEditorActiveTunings(effect);
  const {
    acid: activeAcidTuning,
    cold: activeColdTuning,
    darkness: activeDarknessTuning,
    poison: activePoisonTuning,
    water: activeWaterTuning,
    lava: activeLavaTuning,
    fire: activeFireTuning,
    lightning: activeLightningTuning,
    arcane: activeArcaneTuning,
    chaos: activeChaosTuning,
    void: activeVoidTuning,
    nature: activeNatureTuning,
    distortion: activeDistortionTuning,
    radiant: activeRadiantTuning,
    forceField: activeForceFieldTuning,
    shockwave: activeShockwaveTuning,
    smoke: activeSmokeTuning,
    fog: activeFogTuning
  } = activeTunings;
  const defaultPresetValue = getEnvironmentEffectEditorDefaultPresetValue(effect, activeTunings);
  const [presetSelection, setPresetSelection] = useState(() => ({ effectId: effect.id, value: defaultPresetValue }));
  const presetValue = getEnvironmentEffectEditorPresetValue(presetSelection, effect.id, defaultPresetValue);
  const tuningChangeHandlers: EnvironmentEffectEditorTuningChangeHandlers = {
    onAcidTuningChange,
    onColdTuningChange,
    onDarknessTuningChange,
    onPoisonTuningChange,
    onWaterTuningChange,
    onLavaTuningChange,
    onFireTuningChange,
    onLightningTuningChange,
    onArcaneTuningChange,
    onChaosTuningChange,
    onVoidTuningChange,
    onNatureTuningChange,
    onDistortionTuningChange,
    onRadiantTuningChange,
    onForceFieldTuningChange,
    onShockwaveTuningChange,
    onSmokeTuningChange,
    onFogTuningChange
  };
  const tuningResetHandlers: EnvironmentEffectEditorTuningResetHandlers = {
    onAcidTuningReset,
    onColdTuningReset,
    onDarknessTuningReset,
    onPoisonTuningReset,
    onWaterTuningReset,
    onLavaTuningReset,
    onFireTuningReset,
    onLightningTuningReset,
    onArcaneTuningReset,
    onChaosTuningReset,
    onVoidTuningReset,
    onNatureTuningReset,
    onDistortionTuningReset,
    onRadiantTuningReset,
    onForceFieldTuningReset,
    onShockwaveTuningReset,
    onSmokeTuningReset,
    onFogTuningReset
  };
  const resetActiveTuning = () => {
    if (presetValue !== "custom") {
      applyEnvironmentEffectEditorPreset(effect.effect, presetValue, tuningChangeHandlers);
      return;
    }

    resetEnvironmentEffectEditorTuning(effect.effect, tuningResetHandlers);
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = modalRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = getEnvironmentEffectEditorDragStart(event.pointerId, event.clientX, event.clientY, bounds);
    onPositionChange(clampModalPosition(bounds.left, bounds.top, bounds.width, bounds.height));
  };

  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    const bounds = modalRef.current?.getBoundingClientRect();
    if (!dragState || dragState.pointerId !== event.pointerId || !bounds) {
      return;
    }
    const nextPosition = getEnvironmentEffectEditorDragPosition(dragState, event.clientX, event.clientY);
    onPositionChange(clampModalPosition(nextPosition.x, nextPosition.y, bounds.width, bounds.height));
  };

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <section
      ref={modalRef}
      className={getEnvironmentEffectEditorModalClassName(position)}
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
                  applyEnvironmentEffectEditorPreset(effect.effect, nextPreset, tuningChangeHandlers);
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
            <span>{getEnvironmentEffectEditorEmptyTuningMessage(effect.effect)}</span>
          </div>
        )}
        <div className="button-row modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div
        className="modal-resize-handle"
        title="Drag to resize"
        aria-label="Resize edit effect modal"
        onPointerDown={startResize}
        onPointerMove={resize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
      />
    </section>
  );
}
