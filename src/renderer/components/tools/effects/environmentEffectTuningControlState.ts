import {
  formatEnvironmentEffectTuningNumber,
  parseEnvironmentEffectTuningSliderValue
} from "../../../lib/effects";

export function getEffectTuningSliderReadout(value: number, suffix = ""): string {
  return `${formatEnvironmentEffectTuningNumber(value)}${suffix}`;
}

export function parseEffectTuningSliderInput(value: string, fallback: number): number {
  return parseEnvironmentEffectTuningSliderValue(value, fallback);
}

export function getEffectTuningColorAriaLabel(label: string): string {
  return `${label} effect color`;
}

export function getEffectTuningCopyLabel(effectLabel: string): string {
  return `Copy ${effectLabel} tuning JSON`;
}
