import { describe, expect, it } from "vitest";
import { createBackupTimestamp, createMetadataBackupEntry, parseBackupTimestamp } from "../../electron/metadataBackups";

describe("metadata backup helpers", () => {
  it("formats backup timestamps for filesystem-safe names", () => {
    expect(createBackupTimestamp(new Date("2026-07-02T12:34:56.789Z"))).toBe("2026-07-02T12-34-56-789Z");
  });

  it("parses campaign and scene backup timestamps", () => {
    expect(parseBackupTimestamp("2026-07-02T12-34-56-789Z.campaign.json")).toBe("2026-07-02T12:34:56.789Z");
    expect(parseBackupTimestamp("2026-07-02T12-34-56-789Z.scene-1.scene.json")).toBe("2026-07-02T12:34:56.789Z");
    expect(parseBackupTimestamp("manual-backup.campaign.json")).toBeNull();
  });

  it("creates campaign backup entries", () => {
    expect(createMetadataBackupEntry("campaign", "2026-07-02T12-34-56-789Z.campaign.json", 1234)).toEqual({
      id: "campaign::2026-07-02T12-34-56-789Z.campaign.json",
      kind: "campaign",
      sceneId: undefined,
      fileName: "2026-07-02T12-34-56-789Z.campaign.json",
      timestamp: "2026-07-02T12:34:56.789Z",
      label: "Campaign metadata",
      sizeBytes: 1234
    });
  });

  it("creates scene backup entries with scene labels", () => {
    expect(createMetadataBackupEntry("scene", "2026-07-02T12-34-56-789Z.scene-1.scene.json", 5678, "scene-1", "Cave")).toEqual({
      id: "scene:scene-1:2026-07-02T12-34-56-789Z.scene-1.scene.json",
      kind: "scene",
      sceneId: "scene-1",
      fileName: "2026-07-02T12-34-56-789Z.scene-1.scene.json",
      timestamp: "2026-07-02T12:34:56.789Z",
      label: "Scene metadata: Cave",
      sizeBytes: 5678
    });
  });
});
