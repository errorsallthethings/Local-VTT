import { describe, expect, it } from "vitest";
import { ENVIRONMENT_EFFECT_REGISTRY } from "../../src/renderer/lib/effects";
import { ENVIRONMENT_EFFECT_DRAWERS, getRegisteredEnvironmentEffectDrawers } from "../../src/renderer/canvas/effects";
import type { EnvironmentEffectType } from "../../src/shared/localvtt";

describe("environment effect layer renderer registry", () => {
  it("registers a 2D drawer for every public environment effect", () => {
    expect(getRegisteredEnvironmentEffectDrawers()).toEqual(Object.keys(ENVIRONMENT_EFFECT_REGISTRY).sort());
  });

  it("keeps electric and force-field effect ids routed through canonical drawer keys", () => {
    expect(ENVIRONMENT_EFFECT_DRAWERS.electric).toBeTypeOf("function");
    expect(ENVIRONMENT_EFFECT_DRAWERS.field).toBeTypeOf("function");
    expect((ENVIRONMENT_EFFECT_DRAWERS as Partial<Record<EnvironmentEffectType | "lightning" | "forceField", unknown>>).lightning).toBeUndefined();
    expect((ENVIRONMENT_EFFECT_DRAWERS as Partial<Record<EnvironmentEffectType | "lightning" | "forceField", unknown>>).forceField).toBeUndefined();
  });
});
