import { describe, expect, it } from "vitest";
import { formatUserFacingError } from "../../src/renderer/lib/errors";

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

  it("keeps backup guidance for corrupt scene metadata", () => {
    const message = "Scene metadata could not be read. Metadata backups may exist in C:\\Campaign\\backups\\scenes\\scene-1. Invalid scene file.";

    expect(formatUserFacingError(new Error(message))).toBe(message);
  });

  it("keeps metadata save context before matching generic filesystem errors", () => {
    const campaignMessage = "Campaign metadata could not be saved. ENOSPC: no space left on device, write";
    const sceneMessage = "Scene metadata could not be saved. EACCES: permission denied, open 'scene.json'";

    expect(formatUserFacingError(new Error(campaignMessage))).toBe(
      "Campaign metadata could not be saved. There is not enough free disk space to save that change. Free up space and try again."
    );
    expect(formatUserFacingError(new Error(sceneMessage))).toBe(
      "Scene metadata could not be saved. Local VTT does not have permission to access that file or folder. Check the folder permissions or choose a different location."
    );
  });

  it("keeps unknown metadata save details intact", () => {
    const message = "Campaign metadata could not be saved. Drive temporarily unavailable.";

    expect(formatUserFacingError(new Error(message))).toBe(message);
  });

  it("turns permission errors into an actionable message", () => {
    expect(formatUserFacingError(new Error("EACCES: permission denied, open 'C:\\Campaign\\campaign.json'"))).toBe(
      "Local VTT does not have permission to access that file or folder. Check the folder permissions or choose a different location."
    );
    expect(formatUserFacingError(new Error("EPERM: operation not permitted, unlink 'C:\\Campaign\\assets\\map.png'"))).toBe(
      "Local VTT does not have permission to access that file or folder. Check the folder permissions or choose a different location."
    );
  });

  it("turns wrong file or folder type errors into actionable messages", () => {
    expect(formatUserFacingError(new Error("ENOTDIR: not a directory, open 'C:\\Campaign\\campaign.json\\scene.json'"))).toBe(
      "Local VTT expected a folder but found a file instead. Choose a campaign folder and try again."
    );
    expect(formatUserFacingError(new Error("EISDIR: illegal operation on a directory, read"))).toBe(
      "Local VTT expected a file but found a folder instead. Choose a valid file and try again."
    );
  });

  it("turns disk space and truncated JSON errors into recovery-focused messages", () => {
    expect(formatUserFacingError(new Error("ENOSPC: no space left on device, write"))).toBe(
      "There is not enough free disk space to save that change. Free up space and try again."
    );
    expect(formatUserFacingError(new SyntaxError("Unexpected end of JSON input"))).toBe(
      "That campaign or scene file appears to be incomplete or corrupted. Check the campaign backups folder for a previous copy."
    );
  });

  it("falls back to the source message or a generic message", () => {
    expect(formatUserFacingError(new Error("Scene name cannot be empty."))).toBe("Scene name cannot be empty.");
    expect(formatUserFacingError(null)).toBe("Something went wrong.");
  });
});
