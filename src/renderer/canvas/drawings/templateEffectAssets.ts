import type { DrawingElement, DrawingTemplateEffect } from "../../../shared/localvtt";

export const TEMPLATE_EFFECT_ASSET_EFFECTS: DrawingTemplateEffect[] = [
  "acid",
  "arcane",
  "cold",
  "darkness",
  "fire",
  "fog",
  "lightning",
  "nature",
  "poison",
  "psychic",
  "radiant",
  "storm",
  "thunder",
  "water",
  "web"
];

const TEMPLATE_EFFECT_ASSET_EFFECT_SET = new Set<DrawingTemplateEffect>(TEMPLATE_EFFECT_ASSET_EFFECTS);
const TEMPLATE_EFFECT_ASSET_KINDS = new Set<DrawingElement["kind"]>(["line", "circle", "rectangle", "cone"]);
const TEMPLATE_EFFECT_INNER_GLOW_KINDS = new Set<DrawingElement["kind"]>(["circle", "rectangle", "cone"]);

export function hasTemplateEffectAssets(effect: DrawingTemplateEffect): boolean {
  return TEMPLATE_EFFECT_ASSET_EFFECT_SET.has(effect);
}

export function supportsTemplateEffectAssets(drawing: Pick<DrawingElement, "id" | "kind" | "templateEffect">): boolean {
  return drawing.id !== "preview" && hasTemplateEffectAssets(drawing.templateEffect ?? "plain") && TEMPLATE_EFFECT_ASSET_KINDS.has(drawing.kind);
}

export function supportsTemplateEffectInnerGlow(drawing: Pick<DrawingElement, "kind" | "templateEffect">): boolean {
  return hasTemplateEffectAssets(drawing.templateEffect ?? "plain") && TEMPLATE_EFFECT_INNER_GLOW_KINDS.has(drawing.kind);
}
