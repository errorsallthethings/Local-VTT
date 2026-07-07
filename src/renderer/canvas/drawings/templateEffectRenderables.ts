import type { DrawingTemplateEffect } from "../../../shared/localvtt";
import {
  createAcidSpatterImage,
  createColdShardImage,
  createDarknessMistImage,
  createPoisonBubbleImage
} from "./templateEffectHazardRenderables";
import {
  createNatureThornImage,
  createRadiantLightImage,
  createWaterDropletImage,
  createWebStrandImage
} from "./templateEffectNatureRenderables";
import {
  createArcaneGlyphImage,
  createFireTongueImage,
  createPsychicHazeImage
} from "./templateEffectMagicRenderables";
import {
  createFogCloudImage,
  createLightningForkImage,
  createStormCloudImage,
  createThunderWaveImage
} from "./templateEffectStormRenderables";
import type { TemplateEffectAssetEffect } from "./templateEffectAssets";
import type { TemplateEffectRenderable } from "./templateEffectPlacement";

interface TemplateEffectRenderableDefinition {
  createCanvas: () => HTMLCanvasElement | null;
  id: string;
}

const TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS: Record<TemplateEffectAssetEffect, TemplateEffectRenderableDefinition> = {
  acid: { id: "three-acid-spatter-v2", createCanvas: createAcidSpatterImage },
  arcane: { id: "three-arcane-glyphs-v2", createCanvas: createArcaneGlyphImage },
  cold: { id: "three-cold-shards-v1", createCanvas: createColdShardImage },
  darkness: { id: "three-darkness-mist-v1", createCanvas: createDarknessMistImage },
  fire: { id: "three-fire-tongues-v1", createCanvas: createFireTongueImage },
  fog: { id: "three-fog-clouds-v1", createCanvas: createFogCloudImage },
  lightning: { id: "three-lightning-forks-v1", createCanvas: createLightningForkImage },
  nature: { id: "three-nature-thorns-v6", createCanvas: createNatureThornImage },
  poison: { id: "three-poison-bubbles-v1", createCanvas: createPoisonBubbleImage },
  psychic: { id: "three-psychic-haze-v1", createCanvas: createPsychicHazeImage },
  radiant: { id: "three-radiant-light-v1", createCanvas: createRadiantLightImage },
  storm: { id: "three-storm-clouds-v1", createCanvas: createStormCloudImage },
  thunder: { id: "three-thunder-waves-v2", createCanvas: createThunderWaveImage },
  water: { id: "three-water-ripples-currents-droplets-v3", createCanvas: createWaterDropletImage },
  web: { id: "three-web-strands-v2", createCanvas: createWebStrandImage }
};

const templateEffectRenderableCache: Partial<Record<TemplateEffectAssetEffect, TemplateEffectRenderable[]>> = {};

export function getRegisteredTemplateEffectRenderableEffects(): TemplateEffectAssetEffect[] {
  return Object.keys(TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS).sort() as TemplateEffectAssetEffect[];
}

export function getTemplateEffectRenderables(effect: DrawingTemplateEffect): TemplateEffectRenderable[] {
  return effect === "plain" ? [] : getCachedTemplateEffectRenderables(effect);
}

export function getTemplateEffectRenderableAssetIds(): Record<TemplateEffectAssetEffect, string> {
  return Object.fromEntries(
    Object.entries(TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS).map(([effect, definition]) => [effect, definition.id])
  ) as Record<TemplateEffectAssetEffect, string>;
}

function getCachedTemplateEffectRenderables(effect: TemplateEffectAssetEffect): TemplateEffectRenderable[] {
  const cachedRenderables = templateEffectRenderableCache[effect];
  if (cachedRenderables) {
    return cachedRenderables;
  }

  const definition = TEMPLATE_EFFECT_RENDERABLE_DEFINITIONS[effect];
  const canvas = definition.createCanvas();
  const renderables = canvas ? [createCanvasTemplateRenderable(definition.id, canvas)] : [];
  templateEffectRenderableCache[effect] = renderables;
  return renderables;
}

function createCanvasTemplateRenderable(id: string, canvas: HTMLCanvasElement): TemplateEffectRenderable {
  return {
    id,
    image: canvas,
    naturalHeight: canvas.height,
    naturalWidth: canvas.width
  };
}


