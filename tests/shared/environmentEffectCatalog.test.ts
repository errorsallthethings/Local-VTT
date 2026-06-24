import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_EFFECT_TYPES,
  formatEnvironmentEffectName,
  isEnvironmentEffectType
} from "../../src/shared/environmentEffectCatalog";

describe("environment effect catalog", () => {
  it("keeps effect ids unique", () => {
    expect(new Set(ENVIRONMENT_EFFECT_TYPES).size).toBe(ENVIRONMENT_EFFECT_TYPES.length);
  });

  it("identifies supported environmental effect ids", () => {
    expect(isEnvironmentEffectType("water")).toBe(true);
    expect(isEnvironmentEffectType("electric")).toBe(true);
    expect(isEnvironmentEffectType("lightning")).toBe(false);
    expect(isEnvironmentEffectType(null)).toBe(false);
  });

  it("formats environmental effect names used by scene normalization", () => {
    expect(formatEnvironmentEffectName("poison")).toBe("Poison Cloud");
    expect(formatEnvironmentEffectName("field")).toBe("Force Field");
    expect(formatEnvironmentEffectName("fog")).toBe("Mist");
  });
});
