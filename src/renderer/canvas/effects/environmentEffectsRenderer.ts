import { disposeElementalEffectRuntimes } from "./environmentElementalEffects";
import { disposeHazardEffectRuntimes } from "./environmentHazardEffects";
import { disposeMagicEffectRuntimes } from "./environmentMagicEffects";
import { disposeSmokeFogEffectRuntimes } from "./environmentSmokeFogEffects";
import { disposeWaterEffectRuntimes } from "./environmentWaterEffect";
import { disposeSharedEnvironmentEffectRuntimeResources } from "./environmentEffectRuntime";

export {
  FIRE_EFFECT_PRESETS,
  LAVA_EFFECT_PRESETS,
  LIGHTNING_EFFECT_PRESETS,
  drawEnvironmentFireEffect,
  drawEnvironmentLavaEffect,
  drawEnvironmentLightningEffect
} from "./environmentElementalEffects";

export {
  ACID_EFFECT_PRESETS,
  COLD_EFFECT_PRESETS,
  DARKNESS_EFFECT_PRESETS,
  POISON_EFFECT_PRESETS,
  drawEnvironmentAcidEffect,
  drawEnvironmentColdEffect,
  drawEnvironmentDarknessEffect,
  drawEnvironmentPoisonEffect
} from "./environmentHazardEffects";

export {
  ARCANE_EFFECT_PRESETS,
  CHAOS_EFFECT_PRESETS,
  DISTORTION_EFFECT_PRESETS,
  FORCE_FIELD_EFFECT_PRESETS,
  NATURE_EFFECT_PRESETS,
  RADIANT_EFFECT_PRESETS,
  SHOCKWAVE_EFFECT_PRESETS,
  VOID_EFFECT_PRESETS,
  drawEnvironmentArcaneEffect,
  drawEnvironmentChaosEffect,
  drawEnvironmentDistortionEffect,
  drawEnvironmentForceFieldEffect,
  drawEnvironmentNatureEffect,
  drawEnvironmentRadiantEffect,
  drawEnvironmentShockwaveEffect,
  drawEnvironmentVoidEffect
} from "./environmentMagicEffects";

export {
  FOG_EFFECT_PRESETS,
  SMOKE_EFFECT_PRESETS,
  drawEnvironmentFogEffect,
  drawEnvironmentSmokeEffect
} from "./environmentSmokeFogEffects";

export {
  WATER_EFFECT_PRESETS,
  drawEnvironmentWaterEffect
} from "./environmentWaterEffect";

let environmentEffectRendererUsers = 0;

export function retainEnvironmentEffectRuntimes(): () => void {
  environmentEffectRendererUsers += 1;
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    environmentEffectRendererUsers = Math.max(0, environmentEffectRendererUsers - 1);
    if (environmentEffectRendererUsers === 0) {
      disposeEnvironmentEffectRuntimes();
    }
  };
}

export function disposeEnvironmentEffectRuntimes(): void {
  environmentEffectRendererUsers = 0;

  disposeWaterEffectRuntimes();
  disposeSmokeFogEffectRuntimes();
  disposeElementalEffectRuntimes();
  disposeHazardEffectRuntimes();
  disposeMagicEffectRuntimes();
  disposeSharedEnvironmentEffectRuntimeResources();
}
