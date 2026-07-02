import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  campaignBackupFolder,
  createBackupTimestamp,
  createMetadataBackupEntry,
  metadataBackupPathFromRef,
  parseBackupTimestamp,
  requireSceneBackupId,
  sceneBackupFolder
} from "../../electron/metadataBackups";

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

  it("builds campaign and scene backup folders", () => {
    expect(campaignBackupFolder("campaign-root")).toBe(path.join("campaign-root", "backups", "campaign"));
    expect(sceneBackupFolder("campaign-root", "scene-1")).toBe(path.join("campaign-root", "backups", "scenes", "scene-1"));
  });

  it("resolves backup refs through the expected backup folders", () => {
    expect(metadataBackupPathFromRef("campaign-root", { kind: "campaign", fileName: "backup.campaign.json" })).toBe(
      path.join("campaign-root", "backups", "campaign", "backup.campaign.json")
    );
    expect(metadataBackupPathFromRef("campaign-root", { kind: "scene", sceneId: "scene-1", fileName: "backup.scene-1.scene.json" })).toBe(
      path.join("campaign-root", "backups", "scenes", "scene-1", "backup.scene-1.scene.json")
    );
  });

  it("strips directory components from backup file refs", () => {
    expect(metadataBackupPathFromRef("campaign-root", { kind: "campaign", fileName: "../backup.campaign.json" })).toBe(
      path.join("campaign-root", "backups", "campaign", "backup.campaign.json")
    );
  });

  it("requires scene backup refs to include a scene id", () => {
    expect(() => requireSceneBackupId({ kind: "scene", fileName: "backup.scene.json" })).toThrow("Scene backup selection is missing a scene id.");
    expect(() => metadataBackupPathFromRef("campaign-root", { kind: "scene", fileName: "backup.scene.json" })).toThrow(
      "Scene backup selection is missing a scene id."
    );
  });
});
