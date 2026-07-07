import type { DrawingTemplateEffect } from "../../../shared/localvtt";

export type TemplateEffectTuning = {
  density: number;
  maxPlacements: number;
  minPlacements: number;
  opacity: number;
  scale: number;
};

export const TEMPLATE_EFFECT_TUNING_VERSION = 2;

const DEFAULT_TEMPLATE_EFFECT_TUNING: TemplateEffectTuning = {
  density: 1,
  maxPlacements: 14,
  minPlacements: 5,
  opacity: 1,
  scale: 1
};

const TEMPLATE_EFFECT_TUNING: Partial<Record<DrawingTemplateEffect, Partial<TemplateEffectTuning>>> = {
  arcane: { density: 1.12, maxPlacements: 16, opacity: 1.18, scale: 1.12 },
  cold: { density: 1.08, maxPlacements: 16, opacity: 1.16, scale: 1.1 },
  fog: { density: 1.18, maxPlacements: 18, opacity: 1.32 },
  poison: { density: 1.15, maxPlacements: 18, opacity: 1.24 },
  radiant: { density: 1.1, maxPlacements: 16, opacity: 1.22, scale: 1.12 },
  storm: { density: 1.18, maxPlacements: 18, opacity: 1.26 },
  thunder: { density: 1.08, maxPlacements: 16, opacity: 1.18, scale: 1.14 }
};

export function getTemplateEffectTuning(effect: DrawingTemplateEffect): TemplateEffectTuning {
  return {
    ...DEFAULT_TEMPLATE_EFFECT_TUNING,
    ...(TEMPLATE_EFFECT_TUNING[effect] ?? {})
  };
}
