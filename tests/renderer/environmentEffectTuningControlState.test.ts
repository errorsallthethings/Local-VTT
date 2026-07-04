import { describe, expect, it } from "vitest";
import {
  getEffectTuningColorAriaLabel,
  getEffectTuningSliderReadout,
  parseEffectTuningSliderInput
} from "../../src/renderer/components/tools/effects/environmentEffectTuningControlState";

describe("environment effect tuning control state", () => {
  it("formats slider readouts with optional suffixes", () => {
    expect(getEffectTuningSliderReadout(2)).toBe("2");
    expect(getEffectTuningSliderReadout(1.25)).toBe("1.25");
    expect(getEffectTuningSliderReadout(90, "deg")).toBe("90deg");
  });

  it("parses slider input and falls back for invalid values", () => {
    expect(parseEffectTuningSliderInput("0.75", 0.25)).toBe(0.75);
    expect(parseEffectTuningSliderInput("bad", 0.25)).toBe(0.25);
  });

  it("uses effect-generic color accessibility labels", () => {
    expect(getEffectTuningColorAriaLabel("Flame")).toBe("Flame effect color");
  });
});
