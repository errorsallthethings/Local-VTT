import { describe, expect, it } from "vitest";
import {
  MAP_ASSET_MAX_BYTES,
  TOKEN_ASSET_MAX_BYTES,
  allowedMapExtension,
  allowedTokenExtension,
  mapMediaType,
  validateAssetImportCandidate
} from "../../electron/assetImportValidation";

describe("asset import validation", () => {
  it("accepts supported map and token extensions case-insensitively", () => {
    expect(allowedMapExtension("C:/Maps/Dungeon.WEBM")).toBe(true);
    expect(allowedMapExtension("C:/Maps/Dungeon.PNG")).toBe(true);
    expect(allowedTokenExtension("C:/Tokens/Hero.webp")).toBe(true);
    expect(mapMediaType("C:/Maps/Loop.MP4")).toBe("video");
    expect(mapMediaType("C:/Maps/Dungeon.png")).toBe("image");
  });

  it("rejects unsupported asset extensions with user-facing messages", () => {
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Maps/readme.txt", kind: "map", sizeBytes: 100, isFile: true })
    ).toThrow("Unsupported map type. Use jpg, jpeg, png, webp, gif, mp4, or webm.");
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Tokens/hero.svg", kind: "token", sizeBytes: 100, isFile: true })
    ).toThrow("Unsupported token type. Use jpg, jpeg, png, webp, or gif.");
  });

  it("rejects empty, non-file, and over-budget imports before copy work", () => {
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Maps", kind: "map", sizeBytes: 100, isFile: false })
    ).toThrow("Selected asset must be a file.");
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Maps/empty.png", kind: "map", sizeBytes: 0, isFile: true })
    ).toThrow("Selected asset file is empty or could not be read.");
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Maps/huge.mp4", kind: "map", sizeBytes: MAP_ASSET_MAX_BYTES + 1, isFile: true })
    ).toThrow("Map assets must be 2 GB or smaller.");
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Tokens/huge.png", kind: "token", sizeBytes: TOKEN_ASSET_MAX_BYTES + 1, isFile: true })
    ).toThrow("Token image assets must be 100 MB or smaller.");
  });

  it("accepts files at the configured size limits", () => {
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Maps/max.mp4", kind: "map", sizeBytes: MAP_ASSET_MAX_BYTES, isFile: true })
    ).not.toThrow();
    expect(() =>
      validateAssetImportCandidate({ sourcePath: "C:/Tokens/max.png", kind: "token", sizeBytes: TOKEN_ASSET_MAX_BYTES, isFile: true })
    ).not.toThrow();
  });
});
