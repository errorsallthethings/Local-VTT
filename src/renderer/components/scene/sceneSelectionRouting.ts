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
