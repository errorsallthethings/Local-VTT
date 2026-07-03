import { describe, expect, it } from "vitest";
import { createThumbnailImportFailureDiagnostic, createThumbnailRegenerationFailure, createVideoThumbnailFallbackFailure } from "../../electron/thumbnailDiagnostics";
import type { Asset } from "../../src/shared/localvtt";

describe("thumbnail diagnostics", () => {
  it("formats import thumbnail failures with a stable label and file name only", () => {
    expect(createThumbnailImportFailureDiagnostic("map", "C:/Campaign Imports/Ancient Cave.MP4", "Video metadata timed out.")).toEqual({
      label: "LOCALVTT_ASSET_THUMBNAIL_FAILED",
      kind: "map",
      fileName: "Ancient Cave.MP4",
      reason: "Video metadata timed out."
    });
  });

  it("uses a default reason when thumbnail generation did not provide one", () => {
    expect(createThumbnailImportFailureDiagnostic("token", "C:/Tokens/Hero.png", undefined)).toEqual({
      label: "LOCALVTT_ASSET_THUMBNAIL_FAILED",
      kind: "token",
      fileName: "Hero.png",
      reason: "Thumbnail could not be generated."
    });
  });

  it("formats regeneration failures from the asset metadata used by the UI", () => {
    const asset: Asset = {
      id: "asset-1",
      name: "Ancient Cave",
      kind: "map",
      mediaType: "video",
      relativePath: "assets/maps/ancient-cave.mp4",
      originalFileName: "Ancient Cave.mp4",
      createdAt: "2026-07-02T00:00:00.000Z"
    };

    expect(createThumbnailRegenerationFailure(asset, "Video metadata timed out.")).toEqual({
      assetId: "asset-1",
      assetName: "Ancient Cave",
      kind: "map",
      relativePath: "assets/maps/ancient-cave.mp4",
      reason: "Video metadata timed out."
    });
  });

  it("combines primary and renderer fallback video thumbnail failures", () => {
    expect(createVideoThumbnailFallbackFailure("Electron metadata timed out.", "Renderer frame was blank.")).toBe(
      "Electron metadata timed out. Renderer fallback also failed: Renderer frame was blank."
    );
  });

  it("uses default reasons for incomplete video thumbnail fallback failures", () => {
    expect(createVideoThumbnailFallbackFailure(undefined, undefined)).toBe(
      "Electron could not generate a video thumbnail. Renderer fallback also failed: Renderer fallback did not return a thumbnail."
    );
  });
});
