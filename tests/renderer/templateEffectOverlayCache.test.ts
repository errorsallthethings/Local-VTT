import { describe, expect, it } from "vitest";
import {
  getTemplateEffectOverlayCacheEntry,
  setTemplateEffectOverlayCacheEntry,
  trimTemplateEffectOverlayCache,
  type TemplateEffectOverlayCacheEntry
} from "../../src/renderer/canvas/drawings";

describe("template effect overlay cache", () => {
  it("refreshes a cache hit so recently used overlays are retained", () => {
    const cache = new Map<string, TemplateEffectOverlayCacheEntry>();
    setTemplateEffectOverlayCacheEntry(cache, entry("a"), 3);
    setTemplateEffectOverlayCacheEntry(cache, entry("b"), 3);
    setTemplateEffectOverlayCacheEntry(cache, entry("c"), 3);

    expect(getTemplateEffectOverlayCacheEntry(cache, "a")?.key).toBe("a");
    setTemplateEffectOverlayCacheEntry(cache, entry("d"), 3);

    expect([...cache.keys()]).toEqual(["c", "a", "d"]);
    expect(cache.has("b")).toBe(false);
  });

  it("trims oldest entries when the cache is over the configured limit", () => {
    const cache = new Map<string, TemplateEffectOverlayCacheEntry>([
      ["a", entry("a")],
      ["b", entry("b")],
      ["c", entry("c")]
    ]);

    trimTemplateEffectOverlayCache(cache, 2);

    expect([...cache.keys()]).toEqual(["b", "c"]);
  });

  it("returns null for missing cache entries", () => {
    const cache = new Map<string, TemplateEffectOverlayCacheEntry>();

    expect(getTemplateEffectOverlayCacheEntry(cache, "missing")).toBeNull();
  });
});

function entry(key: string): TemplateEffectOverlayCacheEntry {
  return {
    canvas: {} as HTMLCanvasElement,
    key,
    left: 0,
    top: 0
  };
}
