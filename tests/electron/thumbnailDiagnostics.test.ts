import { describe, expect, it } from "vitest";
import { createThumbnailImportFailureDiagnostic } from "../../electron/thumbnailDiagnostics";

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
});
