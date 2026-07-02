import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Asset } from "../src/shared/localvtt.js";

export type AssetImportKind = "map" | "token";

export interface AssetImportCandidate {
  sourcePath: string;
  kind: AssetImportKind;
  sizeBytes: number;
  isFile: boolean;
}

export const MAP_ASSET_MAX_BYTES = 2 * 1024 * 1024 * 1024;
export const TOKEN_ASSET_MAX_BYTES = 100 * 1024 * 1024;
export const SUPPORTED_MAP_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"] as const;
export const SUPPORTED_TOKEN_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

export function validateAssetImportCandidate(candidate: AssetImportCandidate): void {
  if (!candidate.isFile) {
    throw new Error("Selected asset must be a file.");
  }

  if (!Number.isFinite(candidate.sizeBytes) || candidate.sizeBytes <= 0) {
    throw new Error("Selected asset file is empty or could not be read.");
  }

  const maxBytes = candidate.kind === "map" ? MAP_ASSET_MAX_BYTES : TOKEN_ASSET_MAX_BYTES;
  if (candidate.sizeBytes > maxBytes) {
    throw new Error(
      candidate.kind === "map"
        ? `Map assets must be ${formatByteLimit(maxBytes)} or smaller.`
        : `Token image assets must be ${formatByteLimit(maxBytes)} or smaller.`
    );
  }

  if (candidate.kind === "map" ? !allowedMapExtension(candidate.sourcePath) : !allowedTokenExtension(candidate.sourcePath)) {
    throw new Error(
      candidate.kind === "map"
        ? "Unsupported map type. Use jpg, jpeg, png, webp, gif, mp4, or webm."
        : "Unsupported token type. Use jpg, jpeg, png, webp, or gif."
    );
  }
}

export function allowedMapExtension(filePath: string): boolean {
  return SUPPORTED_MAP_EXTENSIONS.includes(path.extname(filePath).toLowerCase() as typeof SUPPORTED_MAP_EXTENSIONS[number]);
}

export function allowedTokenExtension(filePath: string): boolean {
  return SUPPORTED_TOKEN_EXTENSIONS.includes(path.extname(filePath).toLowerCase() as typeof SUPPORTED_TOKEN_EXTENSIONS[number]);
}

export function mapMediaType(filePath: string): Asset["mediaType"] {
  return [".mp4", ".webm"].includes(path.extname(filePath).toLowerCase()) ? "video" : "image";
}

export function safeAssetName(originalPath: string, timestamp = Date.now(), uniqueId = randomUUID()): string {
  const parsed = path.parse(originalPath);
  const cleanBase = parsed.name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "asset";
  return `${cleanBase}-${timestamp}-${uniqueId.slice(0, 8)}${parsed.ext.toLowerCase()}`;
}

function formatByteLimit(bytes: number): string {
  const gib = bytes / (1024 * 1024 * 1024);
  if (gib >= 1) {
    return `${Number.isInteger(gib) ? gib : gib.toFixed(1)} GB`;
  }

  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
