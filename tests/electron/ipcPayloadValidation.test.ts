import { describe, expect, it } from "vitest";
import {
  assertIpcBoolean,
  assertIpcSafeId,
  assertMetadataBackupRef,
  assertOptionalIpcSafeId,
  assertPlayerOpenOptions,
  assertSquareCropRect
} from "../../electron/ipcPayloadValidation";

describe("IPC payload validation", () => {
  it("accepts safe renderer ids and rejects path-like ids", () => {
    expect(() => assertIpcSafeId("scene-1", "Scene id")).not.toThrow();
    expect(() => assertOptionalIpcSafeId(undefined, "Scene folder id")).not.toThrow();
    expect(() => assertOptionalIpcSafeId("folder-1", "Scene folder id")).not.toThrow();

    for (const value of ["", ".", "..", "../scene", "nested/scene", "C:\\Campaign\\scene"]) {
      expect(() => assertIpcSafeId(value, "Scene id")).toThrow("Scene id is invalid.");
    }
    expect(() => assertIpcSafeId(42, "Scene id")).toThrow("Scene id is invalid.");
  });

  it("validates metadata backup references before restore or preview", () => {
    expect(() => assertMetadataBackupRef({ kind: "campaign", fileName: "2026-07-01T10-00-00-000Z.campaign.json" })).not.toThrow();
    expect(() =>
      assertMetadataBackupRef({ kind: "scene", sceneId: "scene-1", fileName: "2026-07-01T10-00-00-000Z.scene-1.scene.json" })
    ).not.toThrow();

    expect(() => assertMetadataBackupRef({ kind: "campaign", fileName: "../campaign.json" })).toThrow("Unsafe backup file name.");
    expect(() => assertMetadataBackupRef({ kind: "scene", fileName: "backup.scene.json" })).toThrow("Scene backup selection is missing a scene id.");
    expect(() => assertMetadataBackupRef({ kind: "scene", sceneId: "../scene", fileName: "backup.scene.json" })).toThrow("Unsafe backup scene id.");
    expect(() => assertMetadataBackupRef({ kind: "other", fileName: "backup.json" })).toThrow("Backup selection is invalid.");
  });

  it("validates token crop rectangles", () => {
    expect(() => assertSquareCropRect({ x: 0, y: 12.5, size: 256 })).not.toThrow();

    for (const value of [undefined, { x: 0, y: 0, size: 0 }, { x: -1, y: 0, size: 10 }, { x: 0, y: Number.NaN, size: 10 }, { x: 0, y: 0 }]) {
      expect(() => assertSquareCropRect(value)).toThrow("Token crop selection is invalid.");
    }
  });

  it("validates player view options and boolean settings", () => {
    expect(() => assertPlayerOpenOptions(undefined)).not.toThrow();
    expect(() => assertPlayerOpenOptions({ displayId: 2, fullscreen: true })).not.toThrow();
    expect(() => assertIpcBoolean(false, "Player View fullscreen setting")).not.toThrow();

    expect(() => assertPlayerOpenOptions("bad")).toThrow("Player View options are invalid.");
    expect(() => assertPlayerOpenOptions({ displayId: -1 })).toThrow("Player View display selection is invalid.");
    expect(() => assertPlayerOpenOptions({ displayId: 1.5 })).toThrow("Player View display selection is invalid.");
    expect(() => assertPlayerOpenOptions({ fullscreen: "yes" })).toThrow("Player View fullscreen option is invalid.");
    expect(() => assertIpcBoolean("false", "Player View fullscreen setting")).toThrow("Player View fullscreen setting is invalid.");
  });
});
