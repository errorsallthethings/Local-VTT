import type { EnvironmentEffectType, Scene } from "../../shared/localvtt";
import { setSceneEnvironmentEffectFeather, setSceneEnvironmentEffectPatch, setSceneEnvironmentEffectType } from "../lib/scene";

type EnvironmentEffect = Scene["environment"]["effects"][number];

interface UseEnvironmentEffectActionsOptions {
  activeScene: Scene | null;
  updateScene: (nextScene: Scene) => void;
}

export function useEnvironmentEffectActions({ activeScene, updateScene }: UseEnvironmentEffectActionsOptions) {
  const updateEnvironmentEffectPatch = (effectId: string, patch: Partial<EnvironmentEffect>) => {
    if (!activeScene) {
      return;
    }
    updateScene(setSceneEnvironmentEffectPatch(activeScene, effectId, patch));
  };

  return {
    updateEnvironmentEffectAcidTuning: (effectId: string, acidTuning: EnvironmentEffect["acidTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { acidTuning }),
    updateEnvironmentEffectPoisonTuning: (effectId: string, poisonTuning: EnvironmentEffect["poisonTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { poisonTuning }),
    updateEnvironmentEffectColdTuning: (effectId: string, coldTuning: EnvironmentEffect["coldTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { coldTuning }),
    updateEnvironmentEffectDarknessTuning: (effectId: string, darknessTuning: EnvironmentEffect["darknessTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { darknessTuning }),
    updateEnvironmentEffectWaterTuning: (effectId: string, waterTuning: EnvironmentEffect["waterTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { waterTuning }),
    updateEnvironmentEffectLavaTuning: (effectId: string, lavaTuning: EnvironmentEffect["lavaTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { lavaTuning }),
    updateEnvironmentEffectFireTuning: (effectId: string, fireTuning: EnvironmentEffect["fireTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { fireTuning }),
    updateEnvironmentEffectLightningTuning: (effectId: string, lightningTuning: EnvironmentEffect["lightningTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { lightningTuning }),
    updateEnvironmentEffectArcaneTuning: (effectId: string, arcaneTuning: EnvironmentEffect["arcaneTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { arcaneTuning }),
    updateEnvironmentEffectChaosTuning: (effectId: string, chaosTuning: EnvironmentEffect["chaosTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { chaosTuning }),
    updateEnvironmentEffectVoidTuning: (effectId: string, voidTuning: EnvironmentEffect["voidTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { voidTuning }),
    updateEnvironmentEffectNatureTuning: (effectId: string, natureTuning: EnvironmentEffect["natureTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { natureTuning }),
    updateEnvironmentEffectDistortionTuning: (effectId: string, distortionTuning: EnvironmentEffect["distortionTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { distortionTuning }),
    updateEnvironmentEffectRadiantTuning: (effectId: string, radiantTuning: EnvironmentEffect["radiantTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { radiantTuning }),
    updateEnvironmentEffectForceFieldTuning: (effectId: string, fieldTuning: EnvironmentEffect["fieldTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { fieldTuning }),
    updateEnvironmentEffectShockwaveTuning: (effectId: string, shockwaveTuning: EnvironmentEffect["shockwaveTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { shockwaveTuning }),
    updateEnvironmentEffectSmokeTuning: (effectId: string, smokeTuning: EnvironmentEffect["smokeTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { smokeTuning }),
    updateEnvironmentEffectFogTuning: (effectId: string, fogTuning: EnvironmentEffect["fogTuning"]) =>
      updateEnvironmentEffectPatch(effectId, { fogTuning }),
    updateEnvironmentEffectFeather: (effectId: string, feather: number) => {
      if (activeScene) {
        updateScene(setSceneEnvironmentEffectFeather(activeScene, effectId, feather));
      }
    },
    updateEnvironmentEffectType: (effectId: string, effectType: EnvironmentEffectType) => {
      if (activeScene) {
        updateScene(setSceneEnvironmentEffectType(activeScene, effectId, effectType));
      }
    }
  };
}
