import { describe, expect, it } from "vitest";
import { formatUserFacingError } from "../../src/renderer/lib/errorMessages";

describe("formatUserFacingError", () => {
  it("turns missing file errors into an actionable message", () => {
    expect(formatUserFacingError(new Error("ENOENT: no such file or directory, open 'C:\\Missing\\campaign.json'"))).toBe(
      "That file or folder could not be found. It may have been moved, renamed, or deleted."
    );
  });

  it("strips Electron IPC prefixes before matching known errors", () => {
    expect(formatUserFacingError(new Error("Error invoking remote method 'asset:importMap': Error: Unsupported map type. Use jpg."))).toBe(
      "That map file type is not supported. Use JPG, PNG, WebP, GIF, MP4, or WebM."
    );
  });

  it("keeps backup guidance for corrupt campaign metadata", () => {
    const message = "Campaign metadata could not be read. Metadata backups may exist in C:\\Campaign\\backups. Invalid campaign.json file.";

    expect(formatUserFacingError(new Error(message))).toBe(message);
  });

  it("falls back to the source message or a generic message", () => {
    expect(formatUserFacingError(new Error("Scene name cannot be empty."))).toBe("Scene name cannot be empty.");
    expect(formatUserFacingError(null)).toBe("Something went wrong.");
  });
});
