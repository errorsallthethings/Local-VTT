import type { Scene } from "../../../../shared/localvtt";
import { formatEnvironmentEffectOptionLabel as formatEnvironmentEffectLabel } from "../../../lib/effects";
import { formatEnvironmentShapeLabel } from "./layerPanelFormat";

export interface EnvironmentEffectRowState {
  effectLabel: string;
  isSelected: boolean;
  isVisibleInGm: boolean;
  isVisibleInPlayer: boolean;
  label: string;
  shapeLabel: string;
}

export function getEnvironmentEffectRowState({
  effect,
  selectedEnvironmentEffectId
}: {
  effect: Scene["environment"]["effects"][number];
  selectedEnvironmentEffectId: string | null;
}): EnvironmentEffectRowState {
  const effectLabel = formatEnvironmentEffectLabel(effect.effect);
  return {
    effectLabel,
    isSelected: selectedEnvironmentEffectId === effect.id,
    isVisibleInGm: effect.visibleInGm !== false,
    isVisibleInPlayer: effect.visibleInPlayer !== false,
    label: effect.name?.trim() || `${effectLabel} Effect`,
    shapeLabel: formatEnvironmentShapeLabel(effect.kind)
  };
}
