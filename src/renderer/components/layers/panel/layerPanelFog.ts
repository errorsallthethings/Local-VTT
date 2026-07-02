import type { FogSettings } from "../../../../shared/localvtt";

export function getFogStartModePatch(mode: FogSettings["mode"]): Partial<FogSettings> {
  const opacity = mode === "revealed" ? 0 : mode === "partial" ? 0.5 : 1;
  return {
    mode,
    gmOpacity: mode === "revealed" ? 0 : 0.5,
    playerOpacity: opacity,
    opacity
  };
}
