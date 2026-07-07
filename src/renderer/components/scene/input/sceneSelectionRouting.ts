import type { Scene } from "../../../../shared/localvtt";
import { getCompletedSceneMarqueeSelection } from "../../../canvas/selection";
import type { SelectionMode } from "../../../canvas/scene";
import type { SelectorSelectionFilters } from "../../tools";

export type SceneSelectionTargetKind = "token" | "drawing" | "fogShape" | "weatherMask" | "environmentEffect" | "empty";

export interface SceneSelectionClearTargets {
  token: boolean;
  drawing: boolean;
  fogShape: boolean;
  weatherMask: boolean;
  environmentEffect: boolean;
}

const SCENE_SELECTION_KINDS: Array<keyof SceneSelectionClearTargets> = [
  "token",
  "drawing",
  "fogShape",
  "weatherMask",
  "environmentEffect"
];

export function getSceneSelectionClearTargets(activeKind: SceneSelectionTargetKind): SceneSelectionClearTargets {
  return {
    token: shouldClearSceneSelectionKind(activeKind, "token"),
    drawing: shouldClearSceneSelectionKind(activeKind, "drawing"),
    fogShape: shouldClearSceneSelectionKind(activeKind, "fogShape"),
    weatherMask: shouldClearSceneSelectionKind(activeKind, "weatherMask"),
    environmentEffect: shouldClearSceneSelectionKind(activeKind, "environmentEffect")
  };
}

export function shouldClearSceneSelectionKind(activeKind: SceneSelectionTargetKind, candidateKind: keyof SceneSelectionClearTargets): boolean {
  return activeKind === "empty" || activeKind !== candidateKind;
}

export function getSceneSelectionKindsToClear(activeKind: SceneSelectionTargetKind): Array<keyof SceneSelectionClearTargets> {
  return SCENE_SELECTION_KINDS.filter((kind) => shouldClearSceneSelectionKind(activeKind, kind));
}

export interface SceneSelectionClearCallbacks {
  token?: (id: string | null) => void;
  drawing?: (id: string | null) => void;
  fogShape?: (id: string | null) => void;
  weatherMask?: (id: string | null) => void;
  environmentEffect?: (id: string | null) => void;
}

export function clearSceneSelectionsExcept(activeKind: SceneSelectionTargetKind, callbacks: SceneSelectionClearCallbacks): void {
  for (const kind of getSceneSelectionKindsToClear(activeKind)) {
    callbacks[kind]?.(null);
  }
}

export interface SceneMarqueeSelectionPayload {
  tokenIds?: string[];
  drawingIds?: string[];
  fogShapeIds?: string[];
  weatherMaskIds?: string[];
  mode?: SelectionMode;
}

export function getSceneMarqueeSelectionPayload(
  scene: Scene,
  drag: { start: { x: number; y: number }; current: { x: number; y: number }; mode: SelectionMode },
  filters: SelectorSelectionFilters,
  visibility: { tokens: boolean; drawings: boolean }
): SceneMarqueeSelectionPayload | null {
  const selection = getCompletedSceneMarqueeSelection(scene, drag, filters, visibility);
  return selection ? { ...selection, mode: drag.mode } : null;
}
