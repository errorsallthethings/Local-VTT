import type { EnvironmentEffectMask, EnvironmentEffectType, Point } from "../../shared/localvtt";
import type {
  AcidEffectTuning,
  ArcaneEffectTuning,
  ChaosEffectTuning,
  ColdEffectTuning,
  DarknessEffectTuning,
  DistortionEffectTuning,
  FogEffectTuning,
  ForceFieldEffectTuning,
  FireEffectTuning,
  LavaEffectTuning,
  LightningEffectTuning,
  NatureEffectTuning,
  PoisonEffectTuning,
  RadiantEffectTuning,
  ShockwaveEffectTuning,
  SmokeEffectTuning,
  VoidEffectTuning,
  WaterEffectTuning
} from "./environmentEffectsRenderer";
import { distanceBetween } from "./tokenGeometry";

export type EnvironmentEffectShapeKind = "rectangle" | "polygon" | "circle";

export interface EnvironmentEffectDrag {
  pointerId: number;
  kind: EnvironmentEffectShapeKind;
  effect: EnvironmentEffectType;
  feather: number;
  acidTuning?: AcidEffectTuning;
  coldTuning?: ColdEffectTuning;
  darknessTuning?: DarknessEffectTuning;
  poisonTuning?: PoisonEffectTuning;
  waterTuning?: WaterEffectTuning;
  lavaTuning?: LavaEffectTuning;
  fireTuning?: FireEffectTuning;
  lightningTuning?: LightningEffectTuning;
  arcaneTuning?: ArcaneEffectTuning;
  chaosTuning?: ChaosEffectTuning;
  voidTuning?: VoidEffectTuning;
  natureTuning?: NatureEffectTuning;
  distortionTuning?: DistortionEffectTuning;
  radiantTuning?: RadiantEffectTuning;
  fieldTuning?: ForceFieldEffectTuning;
  shockwaveTuning?: ShockwaveEffectTuning;
  smokeTuning?: SmokeEffectTuning;
  fogTuning?: FogEffectTuning;
  start: Point;
  current: Point;
}

export function environmentDragToMask(drag: EnvironmentEffectDrag): EnvironmentEffectMask {
  return {
    id: "preview",
    kind: drag.kind,
    effect: drag.effect,
    feather: drag.feather,
    points: drag.kind === "circle" ? [drag.start] : [drag.start, drag.current],
    radius: drag.kind === "circle" ? distanceBetween(drag.start, drag.current) : undefined,
    visibleInGm: true,
    visibleInPlayer: true
  };
}

export function isMeaningfulEnvironmentEffectDrag(drag: EnvironmentEffectDrag): boolean {
  return drag.kind === "circle" ? distanceBetween(drag.start, drag.current) > 8 : Math.abs(drag.current.x - drag.start.x) > 8 && Math.abs(drag.current.y - drag.start.y) > 8;
}
