import { describe, expect, it } from "vitest";
import { prepareLoadedScene } from "../../electron/sceneLoadDefaults";
import { createDefaultScene, DEFAULT_LAYERS } from "../../src/shared/localvtt";

describe("scene load defaults", () => {
  it("adds default layers when a loaded scene has none", () => {
    const scene = createDefaultScene("Legacy Scene");
    scene.layers = [];

    const prepared = prepareLoadedScene(scene);

    expect(prepared.layers).toEqual(DEFAULT_LAYERS);
    expect(prepared.layers).not.toBe(DEFAULT_LAYERS);
  });

  it("preserves existing scene layers", () => {
    const scene = createDefaultScene("Layered Scene");
    const prepared = prepareLoadedScene(scene);

    expect(prepared.layers).toEqual(scene.layers);
  });
});
