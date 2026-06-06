import { describe, expect, it } from "vitest";
import { createImportedToken, getDefaultTokenPosition, getDefaultTokenSize, stripFileExtension } from "../../src/renderer/lib/tokenDefaults";
import { createDefaultScene, type Asset } from "../../src/shared/localvtt";

const tokenAsset: Asset = {
  id: "asset-1",
  name: "Guard Scout.final.png",
  kind: "token",
  mediaType: "image",
  relativePath: "assets/tokens/guard.png",
  originalFileName: "guard.png",
  createdAt: "2026-06-06T00:00:00.000Z"
};

describe("token defaults", () => {
  it("strips only the last file extension from imported token names", () => {
    expect(stripFileExtension("Guard Scout.final.png")).toBe("Guard Scout.final");
    expect(stripFileExtension(".gitignore")).toBe(".gitignore");
  });

  it("places and sizes imported tokens from the active grid", () => {
    const scene = createDefaultScene("Square");
    scene.grid = { ...scene.grid, type: "square", sizePx: 80, offsetX: 12, offsetY: 24 };

    expect(getDefaultTokenPosition(scene)).toEqual({ x: 12, y: 24 });
    expect(getDefaultTokenSize(scene)).toEqual({ width: 80, height: 80 });
  });

  it("uses compact square art sizing for hex token imports", () => {
    const scene = createDefaultScene("Hex");
    scene.grid = { ...scene.grid, type: "hex", sizePx: 100 };

    expect(getDefaultTokenSize(scene)).toEqual({ width: 72, height: 72 });
  });

  it("creates imported tokens with token layer visibility defaults", () => {
    const scene = createDefaultScene("Token Scene");
    scene.layers = scene.layers.map((layer) => layer.id === "token" ? { ...layer, visibleInGm: true, visibleInPlayer: true } : layer);
    scene.tokens = [{ ...createImportedToken(scene, tokenAsset, "existing"), id: "existing" }];

    const imported = createImportedToken(scene, tokenAsset, "token-2");

    expect(imported).toMatchObject({
      id: "token-2",
      name: "Guard Scout.final",
      assetId: tokenAsset.id,
      order: 1,
      visibleInGm: true,
      visibleInPlayer: true,
      hidden: false,
      mask: "circle",
      borderStyle: "none"
    });
  });
});
