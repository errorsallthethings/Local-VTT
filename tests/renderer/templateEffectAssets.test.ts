import { describe, expect, it } from "vitest";
import {
  TEMPLATE_EFFECT_ASSET_EFFECTS,
  getRegisteredTemplateEffectRenderableEffects,
  hasTemplateEffectAssets,
  supportsTemplateEffectAssets,
  supportsTemplateEffectInnerGlow
} from "../../src/renderer/canvas/drawings";
import type { DrawingElement, DrawingTemplateEffect } from "../../src/shared/localvtt";

const ALL_TEMPLATE_EFFECTS: DrawingTemplateEffect[] = [
  "plain",
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

describe("template effect asset support", () => {
  it("keeps asset-backed template effects explicit", () => {
    expect(TEMPLATE_EFFECT_ASSET_EFFECTS).toEqual(ALL_TEMPLATE_EFFECTS.filter((effect) => effect !== "plain"));
    expect(getRegisteredTemplateEffectRenderableEffects()).toEqual([...TEMPLATE_EFFECT_ASSET_EFFECTS].sort());
    expect(hasTemplateEffectAssets("plain")).toBe(false);
    for (const effect of TEMPLATE_EFFECT_ASSET_EFFECTS) {
      expect(hasTemplateEffectAssets(effect)).toBe(true);
    }
  });

  it("allows overlay assets only for supported template shapes", () => {
    expect(supportsTemplateEffectAssets(drawing({ kind: "line", templateEffect: "fire" }))).toBe(true);
    expect(supportsTemplateEffectAssets(drawing({ kind: "circle", templateEffect: "fire" }))).toBe(true);
    expect(supportsTemplateEffectAssets(drawing({ kind: "rectangle", templateEffect: "fire" }))).toBe(true);
    expect(supportsTemplateEffectAssets(drawing({ kind: "cone", templateEffect: "fire" }))).toBe(true);
    expect(supportsTemplateEffectAssets(drawing({ kind: "polygon", templateEffect: "fire" }))).toBe(false);
    expect(supportsTemplateEffectAssets(drawing({ kind: "circle", templateEffect: "plain" }))).toBe(false);
    expect(supportsTemplateEffectAssets(drawing({ id: "preview", kind: "circle", templateEffect: "fire" }))).toBe(false);
  });

  it("keeps inner glow limited to closed area templates", () => {
    expect(supportsTemplateEffectInnerGlow(drawing({ kind: "circle", templateEffect: "acid" }))).toBe(true);
    expect(supportsTemplateEffectInnerGlow(drawing({ kind: "rectangle", templateEffect: "acid" }))).toBe(true);
    expect(supportsTemplateEffectInnerGlow(drawing({ kind: "cone", templateEffect: "acid" }))).toBe(true);
    expect(supportsTemplateEffectInnerGlow(drawing({ kind: "line", templateEffect: "acid" }))).toBe(false);
    expect(supportsTemplateEffectInnerGlow(drawing({ kind: "circle", templateEffect: "plain" }))).toBe(false);
  });
});

function drawing(patch: Partial<DrawingElement>): DrawingElement {
  return {
    id: "template",
    kind: "circle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    color: "#7dd3fc",
    opacity: 1,
    strokeWidth: 8,
    templateEffect: "fire",
    measurementLabelVisible: true,
    visibleInPlayer: true,
    ...patch
  };
}
