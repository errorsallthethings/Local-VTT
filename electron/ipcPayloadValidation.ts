import { isPlayerSceneProjection, type MetadataBackupRef, type PlayerSceneProjection, type SquareCropRect } from "../src/shared/localvtt.js";
import type { PlayerOpenOptions } from "./playerViewIpc.js";
import { requireBackupFileName, requireSceneBackupId } from "./metadataBackups.js";
import { assertSafePathSegment } from "./safePathSegments.js";

export function assertIpcSafeId(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`${label} is invalid.`);
  }
  assertSafePathSegment(value, `${label} is invalid.`);
}

export function assertOptionalIpcSafeId(value: unknown, label: string): asserts value is string | undefined {
  if (value === undefined) {
    return;
  }
  assertIpcSafeId(value, label);
}

export function assertMetadataBackupRef(value: unknown): asserts value is MetadataBackupRef {
  if (!isRecord(value) || (value.kind !== "campaign" && value.kind !== "scene") || typeof value.fileName !== "string") {
    throw new Error("Backup selection is invalid.");
  }

  requireBackupFileName(value.fileName);
  const ref: MetadataBackupRef =
    value.kind === "campaign"
      ? { kind: "campaign", fileName: value.fileName }
      : { kind: "scene", fileName: value.fileName, sceneId: typeof value.sceneId === "string" ? value.sceneId : undefined };
  if (value.kind === "scene") {
    requireSceneBackupId(ref);
  }
}

export function assertSquareCropRect(value: unknown): asserts value is SquareCropRect {
  if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.size) || value.x < 0 || value.y < 0 || value.size <= 0) {
    throw new Error("Token crop selection is invalid.");
  }
}

export function assertPlayerOpenOptions(value: unknown): asserts value is PlayerOpenOptions | undefined {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    throw new Error("Player View options are invalid.");
  }
  const displayId = value.displayId;
  if ("displayId" in value && (typeof displayId !== "number" || !Number.isInteger(displayId) || displayId < 0)) {
    throw new Error("Player View display selection is invalid.");
  }
  if ("fullscreen" in value && typeof value.fullscreen !== "boolean") {
    throw new Error("Player View fullscreen option is invalid.");
  }
}

export function assertPlayerSceneProjection(value: unknown): asserts value is PlayerSceneProjection {
  if (!isPlayerSceneProjection(value)) {
    throw new Error("Invalid Player View scene projection.");
  }
}

export function assertIpcBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} is invalid.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
