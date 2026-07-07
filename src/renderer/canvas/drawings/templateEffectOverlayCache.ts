export type TemplateEffectOverlayCacheEntry = {
  canvas: HTMLCanvasElement;
  key: string;
  left: number;
  top: number;
};

export const TEMPLATE_EFFECT_OVERLAY_CACHE_LIMIT = 80;

export function getTemplateEffectOverlayCacheEntry(
  cache: Map<string, TemplateEffectOverlayCacheEntry>,
  key: string
): TemplateEffectOverlayCacheEntry | null {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }
  cache.delete(key);
  cache.set(key, cached);
  return cached;
}

export function setTemplateEffectOverlayCacheEntry(
  cache: Map<string, TemplateEffectOverlayCacheEntry>,
  entry: TemplateEffectOverlayCacheEntry,
  limit = TEMPLATE_EFFECT_OVERLAY_CACHE_LIMIT
): TemplateEffectOverlayCacheEntry {
  cache.set(entry.key, entry);
  trimTemplateEffectOverlayCache(cache, limit);
  return entry;
}

export function trimTemplateEffectOverlayCache(cache: Map<string, TemplateEffectOverlayCacheEntry>, limit = TEMPLATE_EFFECT_OVERLAY_CACHE_LIMIT) {
  while (cache.size > limit) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      return;
    }
    cache.delete(oldestKey);
  }
}
