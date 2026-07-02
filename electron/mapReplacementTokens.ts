import { randomUUID } from "node:crypto";
import path from "node:path";

export const MAP_REPLACEMENT_TOKEN_TTL_MS = 10 * 60 * 1000;

export interface MapReplacementTokenInput {
  campaignPath: string;
  sceneId: string;
  currentAssetId: string;
  sourcePath: string;
}

export interface MapReplacementToken extends MapReplacementTokenInput {
  id: string;
  createdAt: number;
}

export type MapReplacementTokenStore = Map<string, MapReplacementToken>;

export function createMapReplacementToken(
  store: MapReplacementTokenStore,
  input: MapReplacementTokenInput,
  now = Date.now()
): MapReplacementToken {
  pruneExpiredMapReplacementTokens(store, now);
  const token: MapReplacementToken = {
    ...input,
    campaignPath: path.resolve(input.campaignPath),
    sourcePath: path.resolve(input.sourcePath),
    id: randomUUID(),
    createdAt: now
  };
  store.set(token.id, token);
  return token;
}

export function consumeMapReplacementToken(
  store: MapReplacementTokenStore,
  tokenId: string,
  expected: Omit<MapReplacementTokenInput, "sourcePath">,
  now = Date.now()
): string {
  pruneExpiredMapReplacementTokens(store, now);
  const token = store.get(tokenId);
  if (!token) {
    throw new Error("Map replacement selection expired. Choose the replacement map again.");
  }

  store.delete(tokenId);
  if (
    path.resolve(token.campaignPath) !== path.resolve(expected.campaignPath) ||
    token.sceneId !== expected.sceneId ||
    token.currentAssetId !== expected.currentAssetId
  ) {
    throw new Error("Map replacement selection does not match the selected scene. Choose the replacement map again.");
  }

  return token.sourcePath;
}

export function pruneExpiredMapReplacementTokens(store: MapReplacementTokenStore, now = Date.now()): void {
  for (const [tokenId, token] of store) {
    if (now - token.createdAt > MAP_REPLACEMENT_TOKEN_TTL_MS) {
      store.delete(tokenId);
    }
  }
}
