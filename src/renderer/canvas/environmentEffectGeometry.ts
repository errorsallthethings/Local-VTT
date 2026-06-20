import type { EnvironmentEffectMask, EnvironmentEffectType, Point, Scene } from "../../shared/localvtt";
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
import type { Camera } from "./camera";
import { getEnvironmentEffectTuningFields } from "./environmentEffectTuning";
import { constrainSquarePoint } from "./gridMath";
import { worldToScreenPoint } from "./viewportGeometry";

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

export type EnvironmentPolygonDraft = {
  points: Point[];
  current?: Point;
};

type EnvironmentEffectTuningFallback = Partial<EnvironmentEffectMask>;

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

export function getEnvironmentEffectFromDrag(
  drag: EnvironmentEffectDrag,
  id: string,
  name: string,
  fallbackTuning: EnvironmentEffectTuningFallback = {}
): EnvironmentEffectMask {
  return {
    ...environmentDragToMask(drag),
    id,
    name,
    ...getEnvironmentEffectTuningFields(drag.effect, drag, fallbackTuning)
  };
}

export function getEnvironmentEffectFromPolygonDraft(
  draft: EnvironmentPolygonDraft,
  id: string,
  name: string,
  effect: EnvironmentEffectType,
  feather: number,
  fallbackTuning: EnvironmentEffectTuningFallback = {}
): EnvironmentEffectMask {
  return {
    id,
    name,
    kind: "polygon",
    effect,
    feather,
    ...getEnvironmentEffectTuningFields(effect, {}, fallbackTuning),
    points: draft.points,
    visibleInGm: true,
    visibleInPlayer: true
  };
}

export function isMeaningfulEnvironmentEffectDrag(drag: EnvironmentEffectDrag): boolean {
  return drag.kind === "circle" ? distanceBetween(drag.start, drag.current) > 8 : Math.abs(drag.current.x - drag.start.x) > 8 && Math.abs(drag.current.y - drag.start.y) > 8;
}

export function getUpdatedEnvironmentEffectDrag(drag: EnvironmentEffectDrag, point: Point, squareConstrained: boolean): EnvironmentEffectDrag {
  return {
    ...drag,
    current: drag.kind === "rectangle" && squareConstrained ? constrainSquarePoint(drag.start, point) : point
  };
}

export function isEnvironmentEffectVisibleForMode(effect: EnvironmentEffectMask, mode: "gm" | "player"): boolean {
  return mode === "gm" ? effect.visibleInGm !== false : effect.visibleInPlayer !== false;
}

export function getClampedEnvironmentEffectFeather(effect: EnvironmentEffectMask): number {
  return Math.max(0, Math.min(1, effect.feather ?? 0));
}

export type EnvironmentEffectPathCommand =
  | { kind: "rect"; x: number; y: number; width: number; height: number }
  | { kind: "arc"; x: number; y: number; radius: number }
  | { kind: "polygon"; points: Point[] };

export function getEnvironmentEffectPathCommands(effect: EnvironmentEffectMask, camera: Camera): EnvironmentEffectPathCommand[] {
  if (effect.kind === "rectangle" && effect.points.length >= 2) {
    const start = worldToScreenPoint(effect.points[0], camera);
    const end = worldToScreenPoint(effect.points[1], camera);
    return [
      {
        kind: "rect",
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y)
      }
    ];
  }
  if (effect.kind === "circle" && effect.points[0] && effect.radius) {
    const center = worldToScreenPoint(effect.points[0], camera);
    return [{ kind: "arc", x: center.x, y: center.y, radius: effect.radius * camera.zoom }];
  }
  if (effect.kind === "polygon" && effect.points.length >= 3) {
    return [{ kind: "polygon", points: effect.points.map((point) => worldToScreenPoint(point, camera)) }];
  }
  return [];
}

export function shouldAnimateEnvironmentEffects(scene: Scene | null, mode: "gm" | "player", layerVisible: boolean): boolean {
  return Boolean(
    scene &&
      layerVisible &&
      scene.environment.effects.some((effect) => isEnvironmentEffectVisibleForMode(effect, mode))
  );
}
