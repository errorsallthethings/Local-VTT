import { describe, expect, it } from "vitest";
import type { Scene } from "../../src/shared/localvtt";
import { getEnvironmentEffectRowState } from "../../src/renderer/components/layers/panel/environmentEffectRowState";

function createEffect(overrides: Partial<Scene["environment"]["effects"][number]> = {}): Scene["environment"]["effects"][number] {
  return {
    id: "effect-1",
    kind: "circle",
    effect: "fire",
    points: [],
    visibleInGm: true,
    visibleInPlayer: false,
    ...overrides
  };
}

describe("getEnvironmentEffectRowState", () => {
  it("uses a trimmed custom name and derives visibility/selection state", () => {
    const state = getEnvironmentEffectRowState({
      effect: createEffect({ name: "  Burning Room  ", visibleInGm: false, visibleInPlayer: true }),
      selectedEnvironmentEffectId: "effect-1"
    });

    expect(state).toMatchObject({
      label: "Burning Room",
      effectLabel: "Fire",
      shapeLabel: "Radius",
      isSelected: true,
      isVisibleInGm: false,
      isVisibleInPlayer: true
    });
  });

  it("falls back to the effect label and treats omitted visibility as visible", () => {
    const state = getEnvironmentEffectRowState({
      effect: createEffect({ effect: "arcane", kind: "polygon", name: " ", visibleInGm: undefined, visibleInPlayer: undefined }),
      selectedEnvironmentEffectId: null
    });

    expect(state).toMatchObject({
      label: "Arcane Effect",
      effectLabel: "Arcane",
      shapeLabel: "Polygon",
      isSelected: false,
      isVisibleInGm: true,
      isVisibleInPlayer: true
    });
  });
});
