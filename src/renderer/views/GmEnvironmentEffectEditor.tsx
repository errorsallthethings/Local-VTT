import type { Scene } from "../../shared/localvtt";
import { EnvironmentEffectEditorModal } from "../components/layers";
import {
  getDefaultAcidEffectTuning,
  getDefaultArcaneEffectTuning,
  getDefaultChaosEffectTuning,
  getDefaultColdEffectTuning,
  getDefaultDarknessEffectTuning,
  getDefaultDistortionEffectTuning,
  getDefaultFireEffectTuning,
  getDefaultFogEffectTuning,
  getDefaultForceFieldEffectTuning,
  getDefaultLavaEffectTuning,
  getDefaultLightningEffectTuning,
  getDefaultNatureEffectTuning,
  getDefaultPoisonEffectTuning,
  getDefaultRadiantEffectTuning,
  getDefaultShockwaveEffectTuning,
  getDefaultSmokeEffectTuning,
  getDefaultVoidEffectTuning,
  getDefaultWaterEffectTuning
} from "../hooks/useEnvironmentEffectTuning";
import type { useEnvironmentEffectActions } from "../hooks/useEnvironmentEffectActions";

type EnvironmentEffect = Scene["environment"]["effects"][number];
type EnvironmentEffectActions = ReturnType<typeof useEnvironmentEffectActions>;

export function GmEnvironmentEffectEditor({
  actions,
  effect,
  onClose,
  onPositionChange,
  onSizeChange,
  position,
  size
}: {
  actions: EnvironmentEffectActions;
  effect: EnvironmentEffect;
  onClose: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  position: { x: number; y: number } | null;
  size: { width: number; height: number } | null;
}) {
  return (
    <EnvironmentEffectEditorModal
      effect={effect}
      position={position}
      size={size}
      onClose={onClose}
      onPositionChange={onPositionChange}
      onSizeChange={onSizeChange}
      onAcidTuningChange={(acidTuning) => actions.updateEnvironmentEffectAcidTuning(effect.id, acidTuning)}
      onAcidTuningReset={() => actions.updateEnvironmentEffectAcidTuning(effect.id, getDefaultAcidEffectTuning())}
      onColdTuningChange={(coldTuning) => actions.updateEnvironmentEffectColdTuning(effect.id, coldTuning)}
      onColdTuningReset={() => actions.updateEnvironmentEffectColdTuning(effect.id, getDefaultColdEffectTuning())}
      onDarknessTuningChange={(darknessTuning) => actions.updateEnvironmentEffectDarknessTuning(effect.id, darknessTuning)}
      onDarknessTuningReset={() => actions.updateEnvironmentEffectDarknessTuning(effect.id, getDefaultDarknessEffectTuning())}
      onPoisonTuningChange={(poisonTuning) => actions.updateEnvironmentEffectPoisonTuning(effect.id, poisonTuning)}
      onPoisonTuningReset={() => actions.updateEnvironmentEffectPoisonTuning(effect.id, getDefaultPoisonEffectTuning())}
      onWaterTuningChange={(waterTuning) => actions.updateEnvironmentEffectWaterTuning(effect.id, waterTuning)}
      onWaterTuningReset={() => actions.updateEnvironmentEffectWaterTuning(effect.id, getDefaultWaterEffectTuning())}
      onLavaTuningChange={(lavaTuning) => actions.updateEnvironmentEffectLavaTuning(effect.id, lavaTuning)}
      onLavaTuningReset={() => actions.updateEnvironmentEffectLavaTuning(effect.id, getDefaultLavaEffectTuning())}
      onFireTuningChange={(fireTuning) => actions.updateEnvironmentEffectFireTuning(effect.id, fireTuning)}
      onFireTuningReset={() => actions.updateEnvironmentEffectFireTuning(effect.id, getDefaultFireEffectTuning())}
      onLightningTuningChange={(lightningTuning) => actions.updateEnvironmentEffectLightningTuning(effect.id, lightningTuning)}
      onLightningTuningReset={() => actions.updateEnvironmentEffectLightningTuning(effect.id, getDefaultLightningEffectTuning())}
      onArcaneTuningChange={(arcaneTuning) => actions.updateEnvironmentEffectArcaneTuning(effect.id, arcaneTuning)}
      onArcaneTuningReset={() => actions.updateEnvironmentEffectArcaneTuning(effect.id, getDefaultArcaneEffectTuning())}
      onChaosTuningChange={(chaosTuning) => actions.updateEnvironmentEffectChaosTuning(effect.id, chaosTuning)}
      onChaosTuningReset={() => actions.updateEnvironmentEffectChaosTuning(effect.id, getDefaultChaosEffectTuning())}
      onVoidTuningChange={(voidTuning) => actions.updateEnvironmentEffectVoidTuning(effect.id, voidTuning)}
      onVoidTuningReset={() => actions.updateEnvironmentEffectVoidTuning(effect.id, getDefaultVoidEffectTuning())}
      onNatureTuningChange={(natureTuning) => actions.updateEnvironmentEffectNatureTuning(effect.id, natureTuning)}
      onNatureTuningReset={() => actions.updateEnvironmentEffectNatureTuning(effect.id, getDefaultNatureEffectTuning())}
      onDistortionTuningChange={(distortionTuning) => actions.updateEnvironmentEffectDistortionTuning(effect.id, distortionTuning)}
      onDistortionTuningReset={() => actions.updateEnvironmentEffectDistortionTuning(effect.id, getDefaultDistortionEffectTuning())}
      onRadiantTuningChange={(radiantTuning) => actions.updateEnvironmentEffectRadiantTuning(effect.id, radiantTuning)}
      onRadiantTuningReset={() => actions.updateEnvironmentEffectRadiantTuning(effect.id, getDefaultRadiantEffectTuning())}
      onForceFieldTuningChange={(fieldTuning) => actions.updateEnvironmentEffectForceFieldTuning(effect.id, fieldTuning)}
      onForceFieldTuningReset={() => actions.updateEnvironmentEffectForceFieldTuning(effect.id, getDefaultForceFieldEffectTuning())}
      onShockwaveTuningChange={(shockwaveTuning) => actions.updateEnvironmentEffectShockwaveTuning(effect.id, shockwaveTuning)}
      onShockwaveTuningReset={() => actions.updateEnvironmentEffectShockwaveTuning(effect.id, getDefaultShockwaveEffectTuning())}
      onSmokeTuningChange={(smokeTuning) => actions.updateEnvironmentEffectSmokeTuning(effect.id, smokeTuning)}
      onSmokeTuningReset={() => actions.updateEnvironmentEffectSmokeTuning(effect.id, getDefaultSmokeEffectTuning())}
      onFogTuningChange={(fogTuning) => actions.updateEnvironmentEffectFogTuning(effect.id, fogTuning)}
      onFogTuningReset={() => actions.updateEnvironmentEffectFogTuning(effect.id, getDefaultFogEffectTuning())}
      onFeatherChange={(feather) => actions.updateEnvironmentEffectFeather(effect.id, feather)}
      onEffectTypeChange={(effectType) => actions.updateEnvironmentEffectType(effect.id, effectType)}
    />
  );
}
