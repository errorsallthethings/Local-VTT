import { describe, expect, it } from "vitest";
import {
  createImportedToken,
  duplicateToken,
  getDefaultTokenPosition,
  getDefaultTokenSize,
  getTokenPresentationDefaults,
  getTokenPositionAtPoint,
  stripFileExtension
} from "../../src/renderer/lib/tokens";
import { createDefaultScene, type Asset, type Token } from "../../src/shared/localvtt";

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

  it("creates library tokens from existing campaign token assets", () => {
    const scene = createDefaultScene("Library Token");
    scene.tokens = [{ ...createImportedToken(scene, tokenAsset, "existing"), id: "existing" }];

    const libraryToken = createImportedToken(scene, tokenAsset, "library-token");

    expect(libraryToken).toMatchObject({
      id: "library-token",
      name: "Guard Scout.final",
      assetId: tokenAsset.id,
      order: 1
    });
  });

  it("applies saved library token presentation defaults to new scene tokens", () => {
    const scene = createDefaultScene("Defaulted Token");
    scene.grid = { ...scene.grid, type: "square", sizePx: 80 };
    const defaultedAsset: Asset = {
      ...tokenAsset,
      tokenDefaults: {
        sizePreset: "large",
        mask: "square",
        borderColor: "#ff0000",
        borderStyle: "glow",
        borderWidth: 8,
        borderWidthPreset: "thick",
        glowColor: "#00ff00",
        footprintVisible: true
      }
    };

    const token = createImportedToken(scene, defaultedAsset, "token-defaulted");

    expect(token).toMatchObject({
      size: { width: 160, height: 160 },
      sizePreset: "large",
      mask: "square",
      borderColor: "#ff0000",
      borderStyle: "glow",
      borderWidth: 8,
      borderWidthPreset: "thick",
      glowColor: "#00ff00",
      footprintVisible: true
    });
  });

  it("captures scene token presentation as reusable library defaults", () => {
    const token: Token = {
      id: "token-1",
      name: "Guard",
      assetId: tokenAsset.id,
      position: { x: 0, y: 0 },
      size: { width: 150, height: 100 },
      sizePreset: "custom",
      mask: "none",
      borderColor: "#112233",
      borderStyle: "inner-shadow",
      borderWidth: 6,
      borderWidthPreset: "custom",
      glowColor: "#445566",
      footprintVisible: true,
      hidden: false,
      visibleInGm: true,
      visibleInPlayer: false
    };

    expect(getTokenPresentationDefaults(token, 100)).toEqual({
      sizePreset: "custom",
      customSizeCells: { width: 1.5, height: 1 },
      mask: "none",
      borderColor: "#112233",
      borderStyle: "inner-shadow",
      borderWidth: 6,
      borderWidthPreset: "custom",
      glowColor: "#445566",
      footprintVisible: true
    });
  });

  it("centers dropped library tokens on the drop point before square grid snapping", () => {
    const scene = createDefaultScene("Dropped Token");
    scene.grid = { ...scene.grid, type: "square", sizePx: 50, offsetX: 10, offsetY: 10 };

    const libraryToken = createImportedToken(scene, tokenAsset, "library-token", { x: 137, y: 84 });

    expect(libraryToken.position).toEqual({ x: 110, y: 60 });
  });

  it("centers dropped library tokens on gridless scenes without snapping", () => {
    const scene = createDefaultScene("Gridless Dropped Token");
    scene.grid = { ...scene.grid, type: "gridless", sizePx: 80 };

    expect(getTokenPositionAtPoint(scene, { width: 80, height: 80 }, { x: 200, y: 120 })).toEqual({ x: 160, y: 80 });
  });

  it("duplicates tokens with a fresh id, copy name, and newest order", () => {
    const sourceToken: Token = {
      id: "token-1",
      name: "Guard Scout",
      assetId: tokenAsset.id,
      position: { x: 12, y: 24 },
      size: { width: 80, height: 80 },
      sizePreset: "medium",
      mask: "circle",
      borderColor: "#fff",
      borderStyle: "solid",
      borderWidth: 5,
      borderWidthPreset: "medium",
      glowColor: "#fff",
      footprintVisible: false,
      order: 0,
      hidden: false,
      visibleInGm: true,
      visibleInPlayer: false,
      vision: { enabled: true, radius: 120 },
      light: { enabled: true, brightRadius: 20, dimRadius: 40, color: "#ffeeaa", intensity: 0.8 }
    };

    const tokens = duplicateToken([sourceToken], sourceToken.id, "token-2");

    expect(tokens).toHaveLength(2);
    expect(tokens[1]).toMatchObject({
      ...sourceToken,
      id: "token-2",
      name: "Guard Scout Copy",
      order: 1
    });
    expect(tokens[1].position).not.toBe(sourceToken.position);
    expect(tokens[1].size).not.toBe(sourceToken.size);
    expect(tokens[1].vision).not.toBe(sourceToken.vision);
    expect(tokens[1].light).not.toBe(sourceToken.light);
  });

  it("keeps duplicate token names unique", () => {
    const scene = createDefaultScene("Token Scene");
    const first = createImportedToken(scene, tokenAsset, "token-1");
    const second = { ...first, id: "token-2", name: "Guard Scout.final Copy", order: 1 };

    const tokens = duplicateToken([first, second], first.id, "token-3");

    expect(tokens[2].name).toBe("Guard Scout.final Copy 2");
  });
});
