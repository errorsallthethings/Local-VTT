import { describe, expect, it } from "vitest";
import { formatMetadataReadError } from "../../electron/metadataErrors";

describe("formatMetadataReadError", () => {
  it("adds campaign backup guidance to metadata parse errors", () => {
    const error = formatMetadataReadError("campaign", "C:\\Campaign\\backups\\campaign", new Error("Invalid campaign.json file."));

    expect(error.message).toBe(
      "Campaign metadata could not be read. Metadata backups may exist in C:\\Campaign\\backups\\campaign. Invalid campaign.json file."
    );
  });

  it("adds scene backup guidance to metadata parse errors", () => {
    const error = formatMetadataReadError("scene", "C:\\Campaign\\backups\\scenes\\scene-1", new SyntaxError("Unexpected end of JSON input"));

    expect(error.message).toBe(
      "Scene metadata could not be read. Metadata backups may exist in C:\\Campaign\\backups\\scenes\\scene-1. Unexpected end of JSON input"
    );
  });
});
