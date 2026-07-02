import type { EnvironmentEffectMask, EnvironmentEffectType, Point, Scene } from "../../../shared/localvtt";
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
import { distanceBetween } from "../tokens/tokenGeometry";
import type { Camera } from "../core/camera";
import { getEnvironmentEffectTuningFields } from "./environmentEffectTuning";
import { constrainSquarePoint } from "../grid/gridMath";
import { worldToScreenPoint } from "../core/viewportGeometry";
import { getEnvironmentEffectBounds } from "../scene/boundsGeometry";

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

export function getEnvironmentEffectDragFromPoint(
  pointerId: number,
  kind: EnvironmentEffectShapeKind,
  point: Point,
  effect: EnvironmentEffectType,
  feather: number,
  fallbackTuning: EnvironmentEffectTuningFallback = {}
): EnvironmentEffectDrag {
  return {
    pointerId,
    kind,
    effect,
    feather,
    ...getEnvironmentEffectTuningFields(effect, {}, fallbackTuning),
    start: point,
    current: point
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

export function getEnvironmentEffectPointSnapshot(scene: Scene, effectIds: string[]): Map<string, Point[]> {
  const ids = new Set(effectIds);
  const snapshot = new Map<string, Point[]>();
  for (const effect of scene.environment.effects) {
    if (ids.has(effect.id)) {
      snapshot.set(effect.id, effect.points.map((point) => ({ ...point })));
    }
  }
  return snapshot;
}

export function getEnvironmentEffectGroupSnapAnchor(scene: Scene, effectIds: string[], fallback: Point): Point {
  const ids = new Set(effectIds);
  const bounds = scene.environment.effects
    .filter((effect) => ids.has(effect.id))
    .map(getEnvironmentEffectBounds)
    .filter((bounds): bounds is NonNullable<ReturnType<typeof getEnvironmentEffectBounds>> => Boolean(bounds));
  if (bounds.length === 0) {
    return fallback;
  }
  const left = Math.min(...bounds.map((bound) => bound.x));
  const top = Math.min(...bounds.map((bound) => bound.y));
  const right = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const bottom = Math.max(...bounds.map((bound) => bound.y + bound.height));
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2
  };
}

export function getEnvironmentEffectsWithPointOverrides(scene: Scene, environmentEffectPoints: Map<string, Point[]> | null): EnvironmentEffectMask[] {
  if (!environmentEffectPoints) {
    return scene.environment.effects;
  }
  return scene.environment.effects.map((effect) => {
    const points = environmentEffectPoints.get(effect.id);
    return points ? { ...effect, points } : effect;
  });
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
